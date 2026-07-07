// AI設定（Gemini APIキー・モデル名）を localStorage で管理する。
// キーは各職員の端末内にのみ保存され、外部には送信されない（Gemini呼び出し時を除く）。

export type AiSettings = {
  apiKey: string;
  textModel: string; // 文章生成モデル
  imageModel: string; // 画像生成モデル
  pageCount: number; // 生成ページ数
};

const KEY = "socialstory.ai.settings";

// モデル名は将来変わる可能性があるため設定画面から変更可能にしている
export const DEFAULT_SETTINGS: AiSettings = {
  apiKey: "",
  textModel: "gemini-2.5-flash",
  imageModel: "gemini-3.1-flash-image", // Nano Banana 2（画像生成）

  pageCount: 5,
};

export function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: AiSettings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function hasApiKey(s: AiSettings): boolean {
  return s.apiKey.trim().length > 0;
}
