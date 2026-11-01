import { after, test } from "node:test";
import { buildApp } from "../src/app.ts";
import { db } from "../src/db.ts";
import { createUser, randomEmail, type User } from "./helpers.ts";
import assert from "node:assert/strict";

const app = buildApp({ logger: false });
after(async () => {
  await app.close();
  await db.end();
});

// setup: owner creates a note, shares it with editor and viewer; stranger has no access
const [owner, editor, viewer, stranger] = await Promise.all([
  createUser(),
  createUser(),
  createUser(),
  createUser(),
]);

const createRes = await app.inject({
  method: "POST",
  url: "/api/notes",
  headers: owner.auth,
  payload: { title: "shared" },
});
const noteId: string = createRes.json().id;
const note = `/api/notes/${noteId}`;
const members = `/api/notes/${noteId}/members`;

for (const [user, role] of [
  [editor, "editor"],
  [viewer, "viewer"],
] as const) {
  const res = await app.inject({
    method: "PUT",
    url: members,
    headers: owner.auth,
    payload: { email: user.email, role },
  });
  assert.equal(res.statusCode, 204);
}

test("create returns the note with role owner", () => {
  assert.equal(createRes.statusCode, 201);
  assert.equal(createRes.json().role, "owner");
});

test("requests without a token are 401", async () => {
  const res = await app.inject({ method: "GET", url: "/api/notes" });
  assert.equal(res.statusCode, 401);
});

// permission matrix: one test per row
type Case = {
  as: "stranger" | "viewer" | "editor" | "owner";
  user: User;
  method: "GET" | "PATCH" | "PUT" | "DELETE";
  url: string;
  payload?: object;
  status: number;
};

const share = { email: randomEmail(), role: "viewer" };

const cases: Case[] = [
  // stranger
  { as: "stranger", user: stranger, method: "GET", url: note, status: 404 },
  {
    as: "stranger",
    user: stranger,
    method: "PATCH",
    url: note,
    payload: { title: "x" },
    status: 404,
  },
  { as: "stranger", user: stranger, method: "DELETE", url: note, status: 404 },
  { as: "stranger", user: stranger, method: "GET", url: members, status: 404 },
  {
    as: "stranger",
    user: stranger,
    method: "PUT",
    url: members,
    payload: share,
    status: 404,
  },

  // viewer
  { as: "viewer", user: viewer, method: "GET", url: note, status: 200 },
  { as: "viewer", user: viewer, method: "GET", url: members, status: 200 },
  {
    as: "viewer",
    user: viewer,
    method: "PATCH",
    url: note,
    payload: { title: "x" },
    status: 403,
  },
  { as: "viewer", user: viewer, method: "DELETE", url: note, status: 403 },
  {
    as: "viewer",
    user: viewer,
    method: "PUT",
    url: members,
    payload: share,
    status: 403,
  },
  {
    as: "viewer",
    user: viewer,
    method: "DELETE",
    url: `${members}/${editor.id}`,
    status: 403,
  },

  // editor
  {
    as: "editor",
    user: editor,
    method: "PATCH",
    url: note,
    payload: { title: "by editor" },
    status: 204,
  },
  { as: "editor", user: editor, method: "DELETE", url: note, status: 403 },
  {
    as: "editor",
    user: editor,
    method: "PUT",
    url: members,
    payload: share,
    status: 403,
  },
  {
    as: "editor",
    user: editor,
    method: "DELETE",
    url: `${members}/${editor.id}`,
    status: 403,
  },

  // owner
  { as: "owner", user: owner, method: "GET", url: note, status: 200 },
  {
    as: "owner",
    user: owner,
    method: "PATCH",
    url: note,
    payload: { title: "by owner" },
    status: 204,
  },
  {
    as: "owner",
    user: owner,
    method: "GET",
    url: "/api/notes/not-a-uuid",
    status: 400,
  },
  {
    as: "owner",
    user: owner,
    method: "PATCH",
    url: note,
    payload: { title: "x".repeat(201) },
    status: 400,
  },
  {
    as: "owner",
    user: owner,
    method: "PUT",
    url: members,
    payload: { email: stranger.email, role: "owner" },
    status: 400,
  },
  {
    as: "owner",
    user: owner,
    method: "PUT",
    url: members,
    payload: { email: owner.email, role: "viewer" },
    status: 400,
  },
  {
    as: "owner",
    user: owner,
    method: "PUT",
    url: members,
    payload: share,
    status: 400,
  }, // unknown email
  {
    as: "owner",
    user: owner,
    method: "DELETE",
    url: `${members}/not-a-uuid`,
    status: 400,
  },
];

for (const c of cases) {
  test(`${c.as} ${c.method} ${c.url.replace(noteId, ":id")} -> ${c.status}`, async () => {
    const res = await app.inject({
      method: c.method,
      url: c.url,
      headers: c.user.auth,
      payload: c.payload,
    });
    assert.equal(res.statusCode, c.status);
  });
}

// after the matrix:

test("each user sees the note in their list with their role", async () => {
  const roleIn = async (user: User) => {
    const res = await app.inject({
      method: "GET",
      url: "/api/notes",
      headers: user.auth,
    });
    return res.json().find((n: { id: string }) => n.id === noteId)?.role;
  };
  assert.equal(await roleIn(owner), "owner");
  assert.equal(await roleIn(editor), "editor");
  assert.equal(await roleIn(viewer), "viewer");
  assert.equal(await roleIn(stranger), undefined);
});

test("get returns the latest title and the caller's role", async () => {
  const res = await app.inject({
    method: "GET",
    url: note,
    headers: editor.auth,
  });
  assert.equal(res.json().title, "by owner");
  assert.equal(res.json().role, "editor");
});

test("members lists editor and viewer with emails", async () => {
  const res = await app.inject({
    method: "GET",
    url: members,
    headers: owner.auth,
  });
  const list = res
    .json()
    .map((m: { email: string; role: string }) => `${m.email}:${m.role}`)
    .sort();
  assert.deepEqual(
    list,
    [`${editor.email}:editor`, `${viewer.email}:viewer`].sort(),
  );
});

test("sharing again changes the role", async () => {
  const promote = await app.inject({
    method: "PUT",
    url: members,
    headers: owner.auth,
    payload: { email: viewer.email, role: "editor" },
  });
  assert.equal(promote.statusCode, 204);
  const patch = await app.inject({
    method: "PATCH",
    url: note,
    headers: viewer.auth,
    payload: { title: "by former viewer" },
  });
  assert.equal(patch.statusCode, 204);
});

test("unsharing removes access", async () => {
  const remove = await app.inject({
    method: "DELETE",
    url: `${members}/${viewer.id}`,
    headers: owner.auth,
  });
  assert.equal(remove.statusCode, 204);
  const get = await app.inject({
    method: "GET",
    url: note,
    headers: viewer.auth,
  });
  assert.equal(get.statusCode, 404);
});

test("deleting the note removes it for everyone", async () => {
  const del = await app.inject({
    method: "DELETE",
    url: note,
    headers: owner.auth,
  });
  assert.equal(del.statusCode, 204);
  const get = await app.inject({
    method: "GET",
    url: note,
    headers: editor.auth,
  });
  assert.equal(get.statusCode, 404);
});
