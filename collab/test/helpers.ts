import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { SignJWT } from "jose";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { db } from "../src/db.ts";
import { env } from "../src/env.ts";

const accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export async function createUser() {
  const { rows } = await db.query<{ id: string }>(
    "INSERT INTO users (email, password_hash) VALUES ($1, 'x') RETURNING id",
    [`${randomUUID()}@test.io`],
  );
  const id = rows[0]!.id;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setExpirationTime("10m")
    .sign(accessKey);
  return { id, token };
}

export async function createNote(ownerId: string) {
  const { rows } = await db.query<{ id: string }>(
    "INSERT INTO notes (title, owner_id) VALUES ('test', $1) RETURNING id",
    [ownerId],
  );
  return rows[0]!.id;
}

export async function share(noteId: string, userId: string, role: "editor" | "viewer") {
  await db.query(
    "INSERT INTO note_members (note_id, user_id, role) VALUES ($1, $2, $3)",
    [noteId, userId, role],
  );
}

// connects like the browser does; resolves once synced, rejects if auth fails
export function connect(url: string, name: string, token: string) {
  const doc = new Y.Doc();
  let scope = "";
  return new Promise<{ provider: HocuspocusProvider; doc: Y.Doc; scope: string }>(
    (resolve, reject) => {
      const provider = new HocuspocusProvider({
        url,
        name,
        token,
        document: doc,
        onAuthenticated: (data) => (scope = data.scope),
        onSynced: () => resolve({ provider, doc, scope }),
        onAuthenticationFailed: ({ reason }) => {
          provider.destroy();
          reject(new Error(reason));
        },
      });
    },
  );
}

// waits until check() is true, fails after 3s
export async function until(check: () => boolean) {
  for (let i = 0; i < 60; i++) {
    if (check()) return;
    await sleep(50);
  }
  throw new Error("timed out");
}
