import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../app.ts";

test("register rejects invalid email", async () => {
  const app = buildApp();
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/register",
    payload: { email: "nope", password: "x" },
  });
  assert.equal(res.statusCode, 400);
  await app.close();
});
