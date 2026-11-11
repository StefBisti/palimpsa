import { after, test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import * as Y from "yjs";
import { buildServer } from "../src/app.ts";
import { db } from "../src/db.ts";
import { connect, createNote, createUser, share, until } from "./helpers.ts";

const server = buildServer({ quiet: true });
await server.listen();
const url = `ws://127.0.0.1:${server.address.port}`;

const [owner, editor, viewer, stranger] = await Promise.all([
  createUser(),
  createUser(),
  createUser(),
  createUser(),
]);
const noteId = await createNote(owner.id);
await share(noteId, editor.id, "editor");
await share(noteId, viewer.id, "viewer");

const ownerConn = await connect(url, noteId, owner.token);
const editorConn = await connect(url, noteId, editor.token);
const viewerConn = await connect(url, noteId, viewer.token);

after(async () => {
  for (const c of [ownerConn, editorConn, viewerConn]) c.provider.destroy();
  await server.destroy();
  await db.end();
});

test("owner and editor get read-write, viewer gets readonly", () => {
  assert.equal(ownerConn.scope, "read-write");
  assert.equal(editorConn.scope, "read-write");
  assert.equal(viewerConn.scope, "readonly");
});

test("rejects a stranger, a bad token and a bad document name", async () => {
  await assert.rejects(connect(url, noteId, stranger.token));
  await assert.rejects(connect(url, noteId, "garbage"));
  await assert.rejects(connect(url, "not-a-uuid", owner.token));
});

test("edits sync between users", async () => {
  editorConn.doc.getText("t").insert(0, "hello");
  await until(() => ownerConn.doc.getText("t").toJSON() === "hello");
  await until(() => viewerConn.doc.getText("t").toJSON() === "hello");
});

test("viewer edits are dropped by the server", async () => {
  viewerConn.doc.getText("t").insert(0, "hacked ");
  await sleep(300);
  assert.equal(ownerConn.doc.getText("t").toJSON(), "hello");
});

test("shutdown saves the doc, and it loads again on reconnect", async () => {
  await server.destroy();

  const { rows } = await db.query<{ ydoc: Buffer }>("SELECT ydoc FROM notes WHERE id = $1", [noteId]);
  const saved = new Y.Doc();
  Y.applyUpdate(saved, rows[0]!.ydoc);
  assert.equal(saved.getText("t").toJSON(), "hello");

  const restarted = buildServer({ quiet: true });
  await restarted.listen();
  const conn = await connect(`ws://127.0.0.1:${restarted.address.port}`, noteId, owner.token);
  assert.equal(conn.doc.getText("t").toJSON(), "hello");
  conn.provider.destroy();
  await restarted.destroy();
});
