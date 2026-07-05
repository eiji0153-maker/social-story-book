// アプリのデータモデル定義（要件定義書 6.1）

export type Page = {
  id: string;
  text: string;
  imageDataUrl: string | null; // イラスト（PNG Data URL）
  illustrationPrompt?: string; // イラスト再生成用の説明（AI生成時に付与）
};

export type Book = {
  id: string;
  title: string;
  scene: string; // 想定場面メモ
  pages: Page[];
  createdAt: number;
  updatedAt: number;
};

export function createEmptyPage(): Page {
  return {
    id: crypto.randomUUID(),
    text: "",
    imageDataUrl: null,
  };
}

export function createEmptyBook(): Book {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "あたらしい えほん",
    scene: "",
    pages: [createEmptyPage()],
    createdAt: now,
    updatedAt: now,
  };
}
