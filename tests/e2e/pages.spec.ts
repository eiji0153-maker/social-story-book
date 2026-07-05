import { test, expect } from "@playwright/test";
import { gotoClean, createBook, acceptDialogs } from "./helpers";

test.describe("FR-3 ページ管理 / FR-6 文章入力", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page);
    await createBook(page);
  });

  test("T-3-1 ページ追加でページ数が増える", async ({ page }) => {
    await expect(page.getByTestId("page-thumb")).toHaveCount(1);
    await page.getByTestId("add-page").click();
    await expect(page.getByTestId("page-thumb")).toHaveCount(2);
    await expect(page.getByTestId("current-page-no")).toContainText("2 / 2");
  });

  test("T-3-2 サムネイルでページを切り替えられる", async ({ page }) => {
    await page.getByTestId("add-page").click();
    await page.getByTestId("page-thumb").first().click();
    await expect(page.getByTestId("current-page-no")).toContainText("1 / 2");
    await expect(
      page.getByTestId("page-thumb").first()
    ).toHaveAttribute("data-active", "true");
  });

  test("T-3-3 ページ削除でページ数が減る", async ({ page }) => {
    acceptDialogs(page);
    await page.getByTestId("add-page").click();
    await expect(page.getByTestId("page-thumb")).toHaveCount(2);
    await page.getByTestId("delete-page").nth(1).click();
    await expect(page.getByTestId("page-thumb")).toHaveCount(1);
  });

  test("T-3-4 1ページのとき削除は無効", async ({ page }) => {
    await expect(page.getByTestId("delete-page")).toBeDisabled();
  });

  test("T-3-5 ページを後ろへ移動すると順序が入れ替わる", async ({ page }) => {
    // 1ページ目に文章を入れて識別可能にする
    await page.getByTestId("page-text").fill("いちばんめ");
    await page.getByTestId("add-page").click();
    await page.getByTestId("page-thumb").first().click();
    // 1ページ目を後ろへ
    await page.getByTestId("move-right").first().click();
    // 現在ページは移動先(2ページ目)になり、文章が保持される
    await expect(page.getByTestId("current-page-no")).toContainText("2 / 2");
    await expect(page.getByTestId("page-text")).toHaveValue("いちばんめ");
  });

  test("T-6-1/T-6-2 文章入力とページ間の保持", async ({ page }) => {
    await page.getByTestId("page-text").fill("ともだちが ないていたら、こえを かけます。");
    await page.getByTestId("add-page").click();
    await page.getByTestId("page-text").fill("2まいめの ぶんしょう");
    // 1ページ目に戻る
    await page.getByTestId("page-thumb").first().click();
    await expect(page.getByTestId("page-text")).toHaveValue(
      "ともだちが ないていたら、こえを かけます。"
    );
  });
});
