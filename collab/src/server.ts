import { buildServer } from "./app.ts";
import { db } from "./db.ts";
import { env } from "./env.ts";

const server = buildServer({ port: env.PORT });
await server.listen();

async function shutdown() {
  await server.destroy(); // closes connections, saves every open doc
  await db.end();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
