import { expect, test } from "@playwright/test";
import { newNote, ownerState } from "./helpers.ts";

test.use({ storageState: ownerState });

test("note survives a reload, shows in the list, and can be deleted", async ({ page }) => {
  const name = `Groceries ${Date.now()}`; // unique, because retries reuse the same user
  await newNote(page);

  const title = page.getByLabel("Title");
  await title.fill(name);
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/api/notes/")),
    title.press("Enter"),
  ]);

  const editor = page.locator(".tiptap");
  await editor.click();
  await editor.pressSequentially("milk and eggs");

  await page.reload();
  await expect(title).toHaveValue(name);
  await expect(editor).toHaveText("milk and eggs");

  await page.goto("/");
  const link = page.getByRole("link", { name });
  await expect(link).toBeVisible();

  // other tests use the same owner at the same time, so only look inside this note's card
  const card = page.locator('[data-slot="card"]').filter({ has: link });
  page.once("dialog", (dialog) => void dialog.accept()); // the confirm() before deleting
  await card.getByRole("button", { name: "Delete note" }).click();
  await expect(link).toBeHidden();
});

