import { Server } from "@hocuspocus/server";
import { Logger } from "@hocuspocus/extension-logger";
import { env } from "./env.ts";

const server = new Server({ port: env.PORT, extensions: [new Logger()] });
server.listen();
