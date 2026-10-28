import { jwtVerify } from "jose";
import { env } from "./env.ts";

const accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export async function verifyAccess(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, accessKey, {
    algorithms: ["HS256"],
  });
  if (!payload.sub) throw new Error("userId not set");
  return payload.sub;
}
