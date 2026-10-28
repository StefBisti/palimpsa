import pg from "pg";
import { env } from "./env.ts";

export const db = new pg.Pool({ connectionString: env.DATABASE_URL });
db.on("error", (err) => console.error(err));

await db.query("SELECT 1");

export type Role = "owner" | "editor" | "viewer";

export async function roleFor(
  noteId: string,
  userId: string,
): Promise<Role | null> {
  const { rows } = await db.query<{ role: Role }>(
    `SELECT CASE WHEN n.owner_id = $2 THEN 'owner' ELSE m.role END AS role
    FROM notes n LEFT JOIN note_members m ON m.note_id = n.id AND m.user_id = $2
    WHERE n.id = $1
    `,
    [noteId, userId],
  );
  return rows[0]?.role ?? null;
}
