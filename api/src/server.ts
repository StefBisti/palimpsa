import Fastify from "fastify";
import { env } from "./env.ts";
import { db } from "./db.ts";
import authRoutes from "./routes/auth.ts";
import cookie from "@fastify/cookie";
import z from "zod";

const app = Fastify({ logger: true });

app.register(cookie);

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof z.ZodError) {
    return reply.code(400).send({ error: "invalid input", issues: err.issues });
  }
  throw err;
});

app.register(
  async (api) => {
    api.get("/health", async () => {
      await db.query("SELECT 1");
      return { ok: true };
    });
    api.register(authRoutes, { prefix: "/auth" });
  },
  { prefix: "/api" },
);

await app.listen({ host: "0.0.0.0", port: env.PORT });

async function shutdown() {
  await app.close();
  await db.end();
  process.exit(0);
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
