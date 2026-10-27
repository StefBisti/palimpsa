import type { FastifyPluginAsync } from "fastify";
import z from "zod";
import { authHook } from "../auth-hook.ts";
import { db, roleFor, type Role } from "../db.ts";

const NoteParams = z.object({ id: z.uuid() });
const NoteBody = z.object({ title: z.string().trim().max(200) });

async function requireNoteRole(
  noteId: string,
  userId: string,
  allowed: Role[],
): Promise<Role> {
  const role = await roleFor(noteId, userId);
  if (!role) {
    throw Object.assign(new Error("note not found"), { statusCode: 404 });
  }
  if (!allowed.includes(role)) {
    throw Object.assign(new Error("forbidden"), { statusCode: 403 });
  }
  return role;
}

const notesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", authHook);

  app.get("/", async (req) => {
    const { rows } = await db.query(
      `SELECT id, title, updated_at, 'owner' AS role FROM notes WHERE owner_id = $1
      UNION ALL
      SELECT n.id, n.title, n.updated_at, m.role
      FROM notes n JOIN note_members m ON m.note_id = n.id
      WHERE m.user_id = $1
      ORDER BY updated_at DESC`,
      [req.userId],
    );
    return rows;
  });

  app.post("/", async (req, reply) => {
    const { title } = NoteBody.parse(req.body);
    const { rows } = await db.query(
      "INSERT INTO notes (title, owner_id) VALUES ($1, $2) RETURNING id, title, updated_at",
      [title, req.userId],
    );
    reply.code(201);
    return { ...rows[0], role: "owner" };
  });

  app.get("/:id", async (req) => {
    const { id } = NoteParams.parse(req.params);
    const role = await requireNoteRole(id, req.userId, [
      "owner",
      "editor",
      "viewer",
    ]);
    const { rows } = await db.query(
      "SELECT id, title, updated_at FROM notes WHERE id = $1",
      [id],
    );
    return { ...rows[0], role };
  });

  app.patch("/:id", async (req, reply) => {
    const { id } = NoteParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner", "editor"]);
    const { title } = NoteBody.parse(req.body);
    await db.query("UPDATE notes SET title = $2 WHERE id = $1", [id, title]);
    return reply.code(204).send();
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = NoteParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner"]);
    await db.query("DELETE FROM notes WHERE id = $1", [id]);
    return reply.code(204).send();
  });
};

export default notesRoutes;
