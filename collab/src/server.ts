import { Server } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { env } from "./env.ts";
import { Database } from "@hocuspocus/extension-database";
import { db, load, roleFor, save } from "./db.ts";
import { verifyAccess } from "./tokens.ts";
import z from "zod";

const server = new Server({
  port: env.PORT,
  debounce: 2000, // save 2s after the last change
  maxDebounce: 10000, // but at least every 10s while people keep typing
  extensions: [
    new Logger({ onRequest: false }),
    new Database({
      fetch: async ({ documentName }) => load(documentName),
      store: async ({ documentName, state }) => save(documentName, state),
    }),
    { onDestroy: async () => await db.end() },
  ],
  onAuthenticate: async ({ token, documentName, connectionConfig }) => {
    try {
      const userId = await verifyAccess(token);
      if (!z.uuid().safeParse(documentName).success) {
        throw new Error("bad document name");
      }
      const role = await roleFor(documentName, userId);
      if (!role) throw new Error("no access");
      if (role === "viewer") connectionConfig.readOnly = true;
      return { userId };
    } catch (err) {
      console.warn(
        `auth denied for ${documentName}: ${(err as Error).message}`,
      );
      throw err;
    }
  },
});
server.listen();
