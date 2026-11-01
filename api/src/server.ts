import { env } from "./env.ts";
import { db } from "./db.ts";
import { buildApp } from "./app.ts";

const app = buildApp();

// resolves when the server is up - it doesn't block. The open socket is the one that keeps the process alive
await app.listen({ host: "0.0.0.0", port: env.PORT });

async function shutdown() {
  await app.close();
  await db.end();
  process.exit(0);
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
