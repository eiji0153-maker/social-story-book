import { test, expect } from "@playwright/test";
import { gotoClean, createBook, acceptDialogs, tinyPngBuffer } from "./helpers";

test.describe("FR-4 描画 / FR-5 画像アップロード", () => {
  test.beforeEach(async ({ page }) => {
    await gotoClean(page);
    await createBook(page);
  });

  test("T-4-1 キャンバスにドラッグすると画像ができる", async ({ page }) => {
    const canvas = page.getByTestId("canvas");
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 160, { steps: 10 });
    await page.mouse.move(box.x + 260, box.y + 80, { steps: 10 });
    await page.mouse.up();
    // 描画後、サムネイルに画像が表示される
    await expect(page.getByTestId("page-thumb").locator("img")).toBeVisible();
  });

  test("T-4-2 色スウォッチを選ぶとアクティブになる", async ({ page }) => {
    const blue = page.getByTestId("color-swatch").nth(4);
    await blue.click();
    await expect(blue).toHaveClass(/active/);
  });

  test("T-4-3 太さスライダーを変更できる", async ({ page }) => {
    const slider = page.getByTestId("brush-size");
    await slider.fill("40");
    await expect(slider).toHaveValue("40");
  });

  test("T-4-4 消しゴムモードに切り替わる", async ({ page }) => {
    const eraser = page.getByTestId("eraser");
    await eraser.click();
    await expect(eraser).toHaveText("消しゴム中");
  });

  test("T-4-5 ぜんぶ消すでキャンバスが白紙に戻る", async ({ page }) => {
    acceptDialogs(page);
    const canvas = page.getByTestId("canvas");
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + 160, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByTestId("page-thumb").locator("img")).toBeVisible();

    await page.getByTestId("clear-canvas").click();
    // クリア後はサムネイルが「白紙」表示に戻る
    await expect(page.getByTestId("page-thumb").locator("img")).toHaveCount(0);
  });

  test("T-5-1 画像アップロードでイラストが反映される", async ({ page }) => {
    await page.getByTestId("upload-image").setInputFiles({
      name: "test.png",
      mimeType: "image/png",
      buffer: tinyPngBuffer(),
    });
    await expect(page.getByTestId("page-thumb").locator("img")).toBeVisible();
  });
});
