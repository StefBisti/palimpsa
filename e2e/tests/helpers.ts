import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";

export const AUTH_DIR = join(import.meta.dirname, "..", ".auth");
export const ownerState = join(AUTH_DIR, "owner.json");
export const friendState = join(AUTH_DIR, "friend.json");
export const PASSWORD = "e2e-password";

// written by auth.setup.ts; read inside tests, because test files load before setup runs
export function users(): { owner: string; friend: string } {
  return JSON.parse(readFileSync(join(AUTH_DIR, "users.json"), "utf8"));
}

export async function newNote(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New note" }).click();
  await expect(page).toHaveURL(/\/notes\/[0-9a-f-]{36}$/);
  return page.url();
}

export async function share(page: Page, email: string, role: "Can edit" | "Can view") {
  await page.getByRole("button", { name: "Share" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("email@example.com").fill(email);
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: role }).click();
  await dialog.getByRole("button", { name: "Add" }).click();
  await expect(dialog.getByText(email)).toBeVisible();
  await page.keyboard.press("Escape");
}

