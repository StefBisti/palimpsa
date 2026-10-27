import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccess } from "./tokens.ts";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

export async function authHook(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "unauthorized" });
  }
  try {
    req.userId = await verifyAccess(header.slice(7));
  } catch {
    return reply.code(401).send({ error: "unauthorized" });
  }
}
