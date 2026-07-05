import { Page, expect } from "@playwright/test";

// 各テスト開始時にクリーンな状態にする
export async function gotoClean(page: Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

// 新規ブックを作成してエディタに入る
export async function createBook(page: Page) {
  await page.getByTestId("create-book").click();
  await expect(page.getByTestId("editor")).toBeVisible();
}

// confirm() ダイアログを常に承認する
export function acceptDialogs(page: Page) {
  page.on("dialog", (d) => d.accept());
}

// テスト用の小さなPNG（赤い1x1）
export const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function tinyPngBuffer(): Buffer {
  return Buffer.from(TINY_PNG_BASE64, "base64");
}
