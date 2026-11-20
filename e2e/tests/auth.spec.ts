import { expect, test } from "@playwright/test";
import { PASSWORD } from "./helpers.ts";

test("sign up, stay logged in after reload, log out", async ({ page }) => {
  const email = `new-${Date.now()}@e2e.test`;

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("link", { name: "Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText(email)).toBeVisible();

  // the access token is only in memory, so this checks the session is restored from the refresh cookie
  await page.reload();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
