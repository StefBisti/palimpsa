import { SignJWT, jwtVerify } from "jose";
import { env } from "./env.ts";

const accessKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshKey = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

async function sign(
  userId: string,
  key: Uint8Array,
  ttl: string,
): Promise<string> {
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(key);
}

async function verify(token: string, key: Uint8Array): Promise<string> {
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  });
  if (!payload.sub) throw new Error("userId not set");
  return payload.sub;
}

export const signAccess = (userId: string) => sign(userId, accessKey, "10m");
export const signRefresh = (userId: string) => sign(userId, refreshKey, "7d");

export const verifyAccess = (token: string) => verify(token, accessKey);
export const verifyRefresh = (token: string) => verify(token, refreshKey);
