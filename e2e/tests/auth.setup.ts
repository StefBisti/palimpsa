import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, request, test as setup } from "@playwright/test";
import { AUTH_DIR, PASSWORD } from "./helpers.ts";

setup("create users", async ({ baseURL }) => {
  const run = Date.now();
  const users = { owner: `owner-${run}@e2e.test`, friend: `friend-${run}@e2e.test` };
  mkdirSync(AUTH_DIR, { recursive: true });

  for (const [name, email] of Object.entries(users)) {
    // one context per user, so their cookies don't overwrite each other
    const api = await request.newContext({ baseURL });
    const credentials = { data: { email, password: PASSWORD } };
    expect((await api.post("/api/auth/register", credentials)).status()).toBe(201);
    expect((await api.post("/api/auth/login", credentials)).ok()).toBe(true);
    await api.storageState({ path: join(AUTH_DIR, `${name}.json`) }); // saves the refresh cookie
    await api.dispose();
  }

  writeFileSync(join(AUTH_DIR, "users.json"), JSON.stringify(users));
});

