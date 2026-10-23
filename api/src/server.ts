import Fastify from "fastify";
import { env } from "./env.ts";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));

await app.listen({ host: "0.0.0.0", port: env.PORT });

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, async () => {
    setTimeout(() => process.exit(1), 5000).unref();
    await app.close();
    process.exit(0);
  });
}
