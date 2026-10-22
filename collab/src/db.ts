import pg from "pg";
import { env } from "./env.ts";
import retry from "./retry.ts";

export const db = new pg.Pool({ connectionString: env.DATABASE_URL });
db.on("error", (err, _) => console.error(err));

await retry("postgres", () => db.query("SELECT 1"));

export async function load(id: string): Promise<Uint8Array | null> {
  const { rows } = await db.query<{ ydoc: Buffer | null }>(
    "SELECT ydoc FROM notes WHERE id = $1",
    [id],
  );
  return rows[0]?.ydoc ?? null;
}

export async function save(id: string, doc: Uint8Array): Promise<void> {
  await db.query(
    `INSERT INTO notes (id, ydoc, updated_at) VALUES ($1, $2, now())
    ON CONFLICT (id) DO UPDATE SET ydoc = EXCUDED.ydoc, updated_at = now()`,
    [id, doc],
  );
}
