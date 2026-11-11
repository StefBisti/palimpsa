import { Server } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { Database } from "@hocuspocus/extension-database";
import z from "zod";
import { load, roleFor, save } from "./db.ts";
import { verifyAccess } from "./tokens.ts";

export function buildServer({ port = 0, quiet = false } = {}) {
  return new Server({
    port,
    quiet,
    stopOnSignals: false, // server.ts handles signals, so it can close the db pool after the final save
    debounce: 2000, // save 2s after the last change
    maxDebounce: 10000, // but at least every 10s while people keep typing
    extensions: [
      ...(quiet ? [] : [new Logger({ onRequest: false })]),
      new Database({
        fetch: async ({ documentName }) => load(documentName),
        store: async ({ documentName, state }) => save(documentName, state),
      }),
    ],
    onAuthenticate: async ({ token, documentName, connectionConfig }) => {
      const userId = await verifyAccess(token);
      if (!z.uuid().safeParse(documentName).success) {
        throw new Error("bad document name");
      }
      const role = await roleFor(documentName, userId);
      if (!role) throw new Error("no access");
      if (role === "viewer") connectionConfig.readOnly = true;
      return { userId };
    },
  });
}
