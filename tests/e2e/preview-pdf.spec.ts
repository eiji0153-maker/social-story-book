import { test, expect } from "@playwright/test";
import { gotoClean, createBook } from "./helpers";

test.describe("FR-7 プレビュー / FR-8 PDF出力", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page);
    await createBook(page);
  });

  test("T-7-1 プレビューを開くとキャンバスが表示される", async ({ page }) => {
    await page.getByTestId("page-text").fill("きゅうしょくの おかたづけ");
    await page.getByTestId("open-preview").click();
    await expect(page.getByTestId("preview")).toBeVisible();
    await expect(page.getByTestId("preview-canvas")).toBeVisible();
  });

  test("T-7-2/T-7-3 ページ送りとまえボタンの無効", async ({ page }) => {
    await page.getByTestId("add-page").click(); // 2ページに
    await page.getByTestId("open-preview").click();
    await expect(page.getByTestId("preview-page-indicator")).toHaveText("1 / 2");
    await expect(page.getByTestId("preview-prev")).toBeDisabled();
    await page.getByTestId("preview-next").click();
    await expect(page.getByTestId("preview-page-indicator")).toHaveText("2 / 2");
    await expect(page.getByTestId("preview-next")).toBeDisabled();
  });

  test("T-7-4 とじるでプレビューが閉じる", async ({ page }) => {
    await page.getByTestId("open-preview").click();
    await expect(page.getByTestId("preview")).toBeVisible();
    await page.getByTestId("preview-close").click();
    await expect(page.getByTestId("preview")).toHaveCount(0);
  });

  test("T-8-1/T-8-2 PDF出力でタイトル名のファイルがダウンロードされる", async ({
    page,
  }) => {
    await page.getByTestId("book-title").fill("きゅうしょくの おかたづけ");
    await page.getByTestId("page-text").fill("おさらを たなに もどします。");

    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("export-pdf").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("きゅうしょくの おかたづけ.pdf");
  });
});
