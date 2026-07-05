// テーマから絵本(Book)を自動生成するオーケストレーション。
// 文章・イラストとも Google Gemini で生成する（APIキー必須）。
// 画像生成が一部ページで失敗した場合のみ、絵本を壊さないための代替イラストに切り替える。

import type { Book, Page } from "../types";
import type { AiSettings } from "./config";
import { hasApiKey } from "./config";
import {
  generateStoryTextWithGemini,
  generateIllustrationWithGemini,
  GeminiError,
} from "./gemini";
import { makePlaceholderImage } from "./placeholder";

export type Progress = {
  phase: "text" | "image" | "done";
  current: number;
  total: number;
  message: string;
};

export type GenerateResult = {
  book: Book;
  warnings: string[]; // 生成中に起きた非致命的な問題（代替イラストへの切替など）
};

export async function generateBook(
  theme: string,
  settings: AiSettings,
  onProgress?: (p: Progress) => void
): Promise<GenerateResult> {
  if (!hasApiKey(settings)) {
    throw new GeminiError(
      "AIキーが設定されていません。右上の「⚙ AI設定」でGemini APIキーを登録してください。"
    );
  }

  const warnings: string[] = [];
  const pageCount = Math.max(1, Math.min(12, settings.pageCount));

  // 1) 文章を Gemini で生成
  onProgress?.({ phase: "text", current: 0, total: pageCount, message: "文章をつくっています…" });
  const draft = await generateStoryTextWithGemini(
    theme,
    pageCount,
    settings.textModel,
    settings.apiKey
  );

  // 2) 各ページのイラストを Gemini で生成（色鉛筆・クレヨン風）
  const pages: Page[] = [];
  const total = draft.pages.length;
  for (let i = 0; i < total; i++) {
    const dp = draft.pages[i];
    onProgress?.({
      phase: "image",
      current: i + 1,
      total,
      message: `イラストを生成しています… (${i + 1}/${total})`,
    });

    let imageDataUrl: string;
    try {
      imageDataUrl = await generateIllustrationWithGemini(
        dp.illustrationPrompt || dp.text,
        settings.imageModel,
        settings.apiKey
      );
    } catch (e) {
      // 絵本を壊さないため、失敗ページのみ代替イラストに切替
      warnings.push(
        `${i + 1}ページ目のイラスト生成に失敗し、代替イラストを使いました（${(e as Error).message}）`
      );
      imageDataUrl = makePlaceholderImage(dp.illustrationPrompt || dp.text, i);
    }

    pages.push({
      id: crypto.randomUUID(),
      text: dp.text,
      imageDataUrl,
      illustrationPrompt: dp.illustrationPrompt,
    });
  }

  onProgress?.({ phase: "done", current: total, total, message: "できあがりました！" });

  const now = Date.now();
  const book: Book = {
    id: crypto.randomUUID(),
    title: draft.title || theme || "あたらしい えほん",
    scene: theme,
    pages,
    afterword: draft.afterword,
    createdAt: now,
    updatedAt: now,
  };
  return { book, warnings };
}

// 1ページ分のイラストだけ Gemini で再生成する（編集画面から利用）
export async function regenerateIllustration(
  page: Page,
  settings: AiSettings
): Promise<string> {
  if (!hasApiKey(settings)) {
    throw new GeminiError(
      "AIキーが設定されていません。右上の「⚙ AI設定」でGemini APIキーを登録してください。"
    );
  }
  return generateIllustrationWithGemini(
    page.illustrationPrompt || page.text,
    settings.imageModel,
    settings.apiKey
  );
}
