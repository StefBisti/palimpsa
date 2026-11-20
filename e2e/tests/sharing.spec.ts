import { expect, test } from "@playwright/test";
import { friendState, newNote, ownerState, share, users } from "./helpers.ts";

test.use({ storageState: ownerState });

test("editor: both users see each other's changes and carets live", async ({ page, browser }) => {
  const { friend } = users();
  const url = await newNote(page);
  await share(page, friend, "Can edit");

  // a second browser, logged in as the friend (manual contexts don't get baseURL, so the url is absolute)
  const friendContext = await browser.newContext({ storageState: friendState });
  const friendPage = await friendContext.newPage();
  await friendPage.goto(url);

  const ownerEditor = page.locator(".tiptap");
  const friendEditor = friendPage.locator(".tiptap");

  await ownerEditor.click();
  await ownerEditor.pressSequentially("from owner");
  await expect(friendEditor).toContainText("from owner");

  await friendEditor.click();
  await friendPage.keyboard.press("ControlOrMeta+End");
  await friendPage.keyboard.type(" and friend");
  await expect(ownerEditor).toContainText("from owner and friend");

  await expect(page.locator(".collaboration-carets__label", { hasText: friend })).toBeVisible();

  await friendContext.close();
});

test("viewer: sees the note live but can't edit it", async ({ page, browser }) => {
  const { friend } = users();
  const url = await newNote(page);
  await share(page, friend, "Can view");

  const friendContext = await browser.newContext({ storageState: friendState });
  const friendPage = await friendContext.newPage();
  await friendPage.goto(url);

  const ownerEditor = page.locator(".tiptap");
  const friendEditor = friendPage.locator(".tiptap");

  await ownerEditor.click();
  await ownerEditor.pressSequentially("read this");
  await expect(friendEditor).toContainText("read this");

  await expect(friendPage.getByText("view only")).toBeVisible();
  await expect(friendEditor).toHaveAttribute("contenteditable", "false");
  await expect(friendPage.getByLabel("Title")).not.toBeEditable();
  await expect(friendPage.getByRole("button", { name: "Bold" })).toBeHidden(); // no toolbar
  await expect(friendPage.getByRole("button", { name: "Share" })).toBeHidden();

  await friendContext.close();
});
