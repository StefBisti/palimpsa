import { Server } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { env } from "./env.ts";
import { Database } from "@hocuspocus/extension-database";
import { db, load, save } from "./db.ts";

const server = new Server({
  port: env.PORT,
  debounce: 2000, // save 2s after the last change
  maxDebounce: 10000, // but at least every 10s while people keep typing
  extensions: [
    new Logger(),
    new Database({
      fetch: async ({ documentName }) => load(documentName),
      store: async ({ documentName, state }) => save(documentName, state),
    }),
    { onDestroy: async () => await db.end() },
  ],
});
server.listen();
