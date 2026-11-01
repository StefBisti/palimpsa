import { after, test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";
import { db } from "../src/db.ts";
import { randomEmail } from "./helpers.ts";

const app = buildApp({ logger: false });
after(async () => {
  await app.close();
  await db.end();
});

const email = randomEmail();
const password = "password123";
let accessToken = "";
let refreshToken = "";

// tests run in order, so some tests use what previous tests have already done

test("register creates a user with a hashed password", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email, password },
  });
  assert.equal(res.statusCode, 201);
  assert.equal(typeof res.json().id, "string");

  const { rows } = await db.query<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id = $1",
    [res.json().id],
  );
  assert.ok(rows[0]?.password_hash.startsWith("$argon2id$"));
});

test("register rejects a duplicate email, case-insensitive", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email: email.toUpperCase(), password },
  });
  assert.equal(res.statusCode, 409);
});

test("register rejects invalid input", async () => {
  const badEmailRes = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email: "email", password },
  });
  assert.equal(badEmailRes.statusCode, 400);

  const shortPasswordRes = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email: randomEmail(), password: "under8" },
  });
  assert.equal(shortPasswordRes.statusCode, 400);
});

test("login returns an access token and sets the refresh cookie", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
  });
  assert.equal(res.statusCode, 200);
  accessToken = res.json().accessToken;
  assert.ok(accessToken);

  const cookie = res.cookies.find((c) => c.name === "refresh_token");
  assert.ok(cookie);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, "Strict");
  assert.equal(cookie.path, "/api/auth");
  refreshToken = cookie.value;
});

test("login gives the same 401 for a wrong password and an unknown email", async () => {
  const wrongPasswordRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password: "wrongpassword" },
  });
  assert.equal(wrongPasswordRes.statusCode, 401);

  const unknownEmailRes = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: randomEmail(), password: "wrongpassword" },
  });
  assert.equal(unknownEmailRes.statusCode, 401);

  assert.deepEqual(wrongPasswordRes.json(), unknownEmailRes.json());
});

test("refresh with the cookie returns a new access token", async () => {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/refresh",
    cookies: { refresh_token: refreshToken },
  });
  assert.equal(res.statusCode, 200);
  assert.ok(res.json().accessToken);
});

test("refresh without a valid cookie is unauthorized", async () => {
  const noneRes = await app.inject({
    method: "POST",
    url: "/api/auth/refresh",
  });
  const randomRes = await app.inject({
    method: "POST",
    url: "/api/auth/refresh",
    cookies: { refresh_token: "random" },
  });

  assert.equal(noneRes.statusCode, 401);
  assert.equal(randomRes.statusCode, 401);
});

test("me returns the logged-in user", async () => {
  const res = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().email, email);
});

test("me rejects a missing token, a wrong access token or the refresh token", async () => {
  const noneRes = await app.inject({ method: "GET", url: "/api/auth/me" });
  assert.equal(noneRes.statusCode, 401);

  const wrongRes = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer wrong` },
  });
  assert.equal(wrongRes.statusCode, 401);

  const refreshRes = await app.inject({
    method: "GET",
    url: "/api/auth/me",
    headers: { authorization: `Bearer ${refreshToken}` },
  });
  assert.equal(refreshRes.statusCode, 401);
});

test("logout clears the refresh cookie", async () => {
  const res = await app.inject({ method: "POST", url: "/api/auth/logout" });
  assert.equal(res.statusCode, 204);

  const cookie = res.cookies.find((c) => c.name === "refresh_token");
  assert.equal(cookie?.value, "");
  assert.equal(cookie?.maxAge, 0);
});
