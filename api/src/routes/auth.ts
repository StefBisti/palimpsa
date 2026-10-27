import type { FastifyPluginAsync } from "fastify";
import z from "zod";
import { env } from "../env.ts";
import { hash, verify } from "argon2";
import type { CookieSerializeOptions } from "@fastify/cookie";
import { db } from "../db.ts";
import pg from "pg";
import { signAccess, signRefresh, verifyRefresh } from "../tokens.ts";

const Credentials = z.object({
  email: z.email(),
  password: z.string().min(8).max(64),
});

const REFRESH_COOKIE = "refresh_token";

const cookieOpts: CookieSerializeOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.COOKIE_SECURE,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60,
};

const noPassHash = await hash("under8"); // no password can be "under8" because it's under 8 chars

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", async (req, reply) => {
    const { email, password } = Credentials.parse(req.body);
    const passwordHash = await hash(password);
    try {
      const { rows } = await db.query<{ id: string }>(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        [email.toLowerCase(), passwordHash],
      );
      reply.code(201);
      return { id: rows[0]?.id };
    } catch (err) {
      if (err instanceof pg.DatabaseError && err.code === "23505") {
        reply.code(409).send({ error: "email already registered" });
      }
      throw err;
    }
  });

  app.post("/login", async (req, reply) => {
    const { email, password } = Credentials.parse(req.body);
    const { rows } = await db.query<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()],
    );
    const user = rows[0]; // undefined if it doesn't exist
    const ok = await verify(user?.password_hash ?? noPassHash, password); // always runs, user undefined or not
    if (!user || !ok) {
      return reply.code(401).send({ error: "invalid email or password" });
    }
    reply.setCookie(REFRESH_COOKIE, await signRefresh(user.id), cookieOpts);
    return { accessToken: await signAccess(user.id) };
  });

  app.post("/refresh", async (req, reply) => {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) return reply.code(401).send({ error: "not logged in" });

    let userId: string;
    try {
      userId = await verifyRefresh(token);
    } catch {
      return reply.code(401).send({ error: "not logged in" });
    }
    return { accessToken: await signAccess(userId) };
  });

  app.post("/logout", async (_req, reply) => {
    reply.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    return reply.code(204).send();
  });
};

export default authRoutes;
