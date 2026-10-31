import Fastify from "fastify";
import authRoutes from "./routes/auth.ts";
import cookie from "@fastify/cookie";
import z from "zod";
import notesRoutes from "./routes/notes.ts";
import { db } from "./db.ts";
import rateLimit from "@fastify/rate-limit";

export function buildApp() {
  const app = Fastify({ logger: true, trustProxy: "uniquelocal" });
  app.decorateRequest("userId", "");

  app.register(cookie);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof z.ZodError) {
      return reply
        .code(400)
        .send({ error: "invalid input", issues: err.issues });
    }
    throw err;
  });

  app.register(rateLimit, { global: false });

  app.register(
    async (api) => {
      api.get("/health", async () => {
        await db.query("SELECT 1");
        return { ok: true };
      });
      api.register(authRoutes, { prefix: "/auth" });
      api.register(notesRoutes, { prefix: "/notes" });
    },
    { prefix: "/api" },
  );

  return app;
}
