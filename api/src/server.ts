import Fastify from "fastify";
import { env } from "./env.ts";
import { db } from "./db.ts";

const app = Fastify({ logger: true });

app.register(
  async (api) => {
    api.get("/health", async () => {
      await db.query("SELECT 1");
      return { ok: true };
    });
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
