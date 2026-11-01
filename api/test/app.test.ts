import { after, test } from "node:test";
import { buildApp } from "../src/app.ts";
import { db } from "../src/db.ts";
import assert from "node:assert/strict";

const app = buildApp({ logger: false });
after(async () => {
  await app.close();
  await db.end();
});

test("health returns ok", async () => {
  const res = await app.inject({ method: "GET", url: "/api/health" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true });
});

// an empty body fails validation (400) without running argon2, but still counts toward the rate limit
const hit = (url: string, remoteAddress: string, forwardedFor?: string) =>
  app.inject({
    method: "POST",
    url,
    remoteAddress,
    payload: {},
    headers: forwardedFor ? { "x-forwarded-for": forwardedFor } : {},
  });

for (const [url, ip] of [
  ["/api/auth/login", "203.0.113.1"],
  ["/api/auth/register", "203.0.113.2"],
]) {
  test(`${url} is limited to 5 requests per minute per IP`, async () => {
    for (let i = 0; i < 5; i++) {
      assert.equal((await hit(url, ip)).statusCode, 400);
    }
    const blocked = await hit(url, ip);
    assert.equal(blocked.statusCode, 429);
    assert.ok(blocked.headers["retry-after"]);
  });
}

test("X-Forwarded-For from a public address is ignored", async () => {
  // a client faking a new IP on every request is still limited by its real address
  for (let i = 0; i < 5; i++) {
    await hit("/api/auth/login", "203.0.113.3", `198.51.100.${i}`);
  }
  const blocked = await hit("/api/auth/login", "203.0.113.3", "198.51.100.99");
  assert.equal(blocked.statusCode, 429);
});

test("X-Forwarded-For from a private proxy address is trusted", async () => {
  // behind a proxy on a private network, the limit applies to the forwarded client IP
  for (let i = 0; i < 5; i++) {
    await hit("/api/auth/login", "10.0.0.1", "198.51.100.200");
  }
  assert.equal(
    (await hit("/api/auth/login", "10.0.0.1", "198.51.100.200")).statusCode,
    429,
  );
  assert.equal(
    (await hit("/api/auth/login", "10.0.0.1", "198.51.100.201")).statusCode,
    400,
  );
});
