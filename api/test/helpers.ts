import { randomUUID } from "node:crypto";
import { db } from "../src/db.ts";
import { signAccess } from "../src/tokens.ts";

export const randomEmail = () => `${randomUUID()}@test.io`;

// insert user directly in db, no rate-limiting
export async function createUser() {
  const email = randomEmail();
  const { rows } = await db.query<{ id: string }>(
    "INSERT INTO users (email, password_hash) VALUES ($1, 'x') RETURNING id",
    [email],
  );
  const id = rows[0]!.id;
  return {
    id,
    email,
    auth: { authorization: `Bearer ${await signAccess(id)}` },
  };
}

export type User = Awaited<ReturnType<typeof createUser>>;
