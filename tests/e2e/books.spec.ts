import { test, expect } from "@playwright/test";
import { gotoClean, createBook, acceptDialogs } from "./helpers";

test.describe("FR-1 ブック管理 / FR-2 想定場面", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page);
  });

  test("T-1-1 初回は空メッセージが表示される", async ({ page }) => {
    await expect(page.getByTestId("empty-message")).toBeVisible();
  });

  test("T-1-2 新規作成でエディタに遷移し初期タイトルが入る", async ({ page }) => {
    await createBook(page);
    await expect(page.getByTestId("book-title")).toHaveValue("あたらしい えほん");
  });

  test("T-1-3 一覧へ戻るとブックが1件表示される", async ({ page }) => {
    await createBook(page);
    await page.getByTestId("back-to-list").click();
    await expect(page.getByTestId("book-card")).toHaveCount(1);
  });

  test("T-1-4 一覧からブックを開ける", async ({ page }) => {
    await createBook(page);
    await page.getByTestId("back-to-list").click();
    await page.getByTestId("open-book").click();
    await expect(page.getByTestId("editor")).toBeVisible();
  });

  test("T-1-5 ブックを削除すると一覧から消える", async ({ page }) => {
    acceptDialogs(page);
    await createBook(page);
    await page.getByTestId("back-to-list").click();
    await expect(page.getByTestId("book-card")).toHaveCount(1);
    await page.getByTestId("delete-book").click();
    await expect(page.getByTestId("book-card")).toHaveCount(0);
    await expect(page.getByTestId("empty-message")).toBeVisible();
  });

  test("T-2-1/T-2-2/T-2-3 タイトル・場面を入力し保存→再読込で復元", async ({ page }) => {
    await createBook(page);
    await page.getByTestId("book-title").fill("きゅうしょくの おかたづけ");
    await page.getByTestId("book-scene").fill("給食のかたづけ");
    await page.getByTestId("save-book").click();

    await page.reload();
    await expect(page.getByTestId("book-card")).toHaveCount(1);
    await page.getByTestId("open-book").click();
    await expect(page.getByTestId("book-title")).toHaveValue("きゅうしょくの おかたづけ");
    await expect(page.getByTestId("book-scene")).toHaveValue("給食のかたづけ");
  });

  test("T-1-6 保存後の再読み込みでブックが残る", async ({ page }) => {
    await createBook(page);
    await page.getByTestId("save-book").click();
    await expect(page.getByTestId("save-book")).toHaveText("保存しました");
    await page.reload();
    await expect(page.getByTestId("book-card")).toHaveCount(1);
  });
});
