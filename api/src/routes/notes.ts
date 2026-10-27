import type { FastifyPluginAsync } from "fastify";
import { authHook } from "../auth-hook.ts";

const notesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", authHook);
  app.get("/", async (req) => ({ userId: req.userId }));
};

export default notesRoutes;
