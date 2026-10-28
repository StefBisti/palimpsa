import type { FastifyPluginAsync } from "fastify";
import z from "zod";
import { authHook } from "../auth-hook.ts";
import { db, roleFor, type Role } from "../db.ts";

const NoteParams = z.object({ id: z.uuid() });
const NoteBody = z.object({ title: z.string().trim().max(200) });

const MemberBody = z.object({
  email: z.email(),
  role: z.enum(["editor", "viewer"]),
});
const MemberParams = z.object({
  id: z.uuid(),
  userId: z.uuid(),
});

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

  // get notes owned or view/edit by user
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

  // create new note with title and owner id
  app.post("/", async (req, reply) => {
    const { title } = NoteBody.parse(req.body);
    const { rows } = await db.query(
      "INSERT INTO notes (title, owner_id) VALUES ($1, $2) RETURNING id, title, updated_at",
      [title, req.userId],
    );
    reply.code(201);
    return { ...rows[0], role: "owner" };
  });

  // get note with id if user is owner / editor / viewer. If not, they get "note not found"
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

  // change title of note with id, if user is owner or editor
  app.patch("/:id", async (req, reply) => {
    const { id } = NoteParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner", "editor"]);
    const { title } = NoteBody.parse(req.body);
    await db.query("UPDATE notes SET title = $2 WHERE id = $1", [id, title]);
    return reply.code(204).send();
  });

  // delete note with id if user is owner
  app.delete("/:id", async (req, reply) => {
    const { id } = NoteParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner"]);
    await db.query("DELETE FROM notes WHERE id = $1", [id]);
    return reply.code(204).send();
  });

  // upsert role for another email to a note if user is owner
  app.put("/:id/members", async (req, reply) => {
    const { id } = NoteParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner"]);
    const { email, role } = MemberBody.parse(req.body);
    const { rows } = await db.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    const user = rows[0];
    if (!user) {
      throw Object.assign(new Error("user not found"), { statusCode: 400 });
    }
    if (user.id === req.userId) {
      throw Object.assign(new Error("you already own this note"), {
        statusCode: 400,
      });
    }
    await db.query(
      `INSERT INTO note_members (note_id, user_id, role) VALUES ($1, $2, $3)
      ON CONFLICT (note_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [id, user.id, role],
    );
    return reply.code(204).send();
  });

  // remove userId from members (only if the calling user is owner)
  app.delete("/:id/members/:userId", async (req, reply) => {
    const { id, userId } = MemberParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner"]);
    await db.query(
      "DELETE FROM note_members WHERE note_id = $1 AND user_id = $2",
      [id, userId],
    );
    return reply.code(204).send();
  });

  // list members as any role
  app.get("/:id/members", async (req) => {
    const { id } = NoteParams.parse(req.params);
    await requireNoteRole(id, req.userId, ["owner", "editor", "viewer"]);
    const { rows } = await db.query(
      `SELECT u.id, u.email, m.role
      FROM note_members m JOIN users u ON u.id = m.user_id
      WHERE m.note_id = $1
      ORDER BY u.email`,
      [id],
    );
    return rows;
  });
};

export default notesRoutes;
