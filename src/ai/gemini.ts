// Google Gemini API クライアント（ブラウザから直接呼び出し）。
// 文章生成・画像生成の両方に対応。APIキーは各職員の端末内から渡される。

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export class GeminiError extends Error {}

export type DraftPage = {
  text: string;
  illustrationPrompt: string; // イラスト生成用の説明
};

export type StoryDraft = {
  title: string;
  pages: DraftPage[];
  afterword: string; // 「おうちの方へ」あとがき
};

// ---- 文章生成（構成された絵本のたたき台をJSONで得る） ----
export async function generateStoryTextWithGemini(
  theme: string,
  pageCount: number,
  model: string,
  apiKey: string
): Promise<StoryDraft> {
  const prompt = [
    "あなたは、幼児〜小学校低学年向けの人気絵本作家です。",
    "次のテーマで、心に残る『物語絵本』を作ってください。単なる説明や標語の羅列ではなく、主人公が登場する一つのお話にします。",
    `テーマ:「${theme}」`,
    `ページ数: 本編を ちょうど ${pageCount} ページ にしてください。`,
    "",
    "【物語の作り方】",
    "- 主人公に親しみやすい名前をつける（例: たっくん、みおちゃん など）。",
    "- 起承転結のある一つの物語にする: 日常 → できごと・ちょっとした困りごと → 気づき → 行動・変化 → あたたかいまとめ。",
    "- 具体的な場面・セリフ・登場人物の気持ちを描く。ものを擬人化して気持ちを表すのも効果的（例: おもちゃが「さむいよ」と言う）。",
    "- 『〜しましょう』のような説明・命令口調の連発は避け、物語の流れの中で自然に伝える。",
    "- 安全・思いやり・達成感など、子どもが心から『そうしたい』と思える動機を、物語を通じて感じられるようにする。",
    "- 最後は肯定的で温かい終わり方にする。",
    "",
    "【各ページの作り方】",
    "- text: そのページの本文。2〜4行の短い文でリズムよく。ひらがな中心（対象年齢に合わせ漢字は最小限）。改行は \\n で表す。",
    "- illustration: そのページの挿絵の場面描写。登場人物・表情・動作・背景が目に浮かぶように具体的に（日本語）。物語全体で主人公の見た目が一貫するよう、特徴も書く。",
    "",
    "【その他】",
    "- title: 絵本のやさしいタイトル。",
    "- afterword: 保護者・支援者向けの『おうちの方へ』のあとがき。この絵本のねらい（例: 安全・思いやり・達成感などの視点）と、読み聞かせ後の声かけの例を、やさしい文章で200〜300字程度。",
  ].join("\n");

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          afterword: { type: "STRING" },
          pages: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING" },
                illustration: { type: "STRING" },
              },
              required: ["text", "illustration"],
            },
          },
        },
        required: ["title", "pages", "afterword"],
      },
    },
  };

  const res = await fetch(
    `${ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    throw new GeminiError(await describeError(res));
  }
  const data = await res.json();
  const textPart = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textPart) throw new GeminiError("AIから文章を取得できませんでした。");
  let parsed: {
    title?: string;
    afterword?: string;
    pages?: { text: string; illustration: string }[];
  };
  try {
    parsed = JSON.parse(textPart);
  } catch {
    throw new GeminiError("AIの応答を解釈できませんでした。");
  }
  const pages = (parsed.pages ?? []).map((p) => ({
    text: p.text ?? "",
    illustrationPrompt: p.illustration ?? "",
  }));
  if (pages.length === 0) throw new GeminiError("AIがページを生成しませんでした。");
  return { title: parsed.title || theme, pages, afterword: parsed.afterword ?? "" };
}

// ---- 画像生成（1ページ分の挿絵を Data URL で得る） ----
export async function generateIllustrationWithGemini(
  illustrationPrompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const prompt = [
    "子ども向け絵本の1シーンの挿絵を1枚描いてください。",
    "画風: 色鉛筆とクレヨンで手描きしたような、やわらかく温かいタッチ。",
    "パステル調のやさしい色合い、ふんわりした輪郭、紙や画材の質感を感じる仕上がり。",
    "かわいらしく親しみやすい絵柄で、特別支援教育のソーシャルストーリー向け。",
    "人物の表情や動作が分かりやすいこと。",
    "背景は白または淡い色でシンプルに。",
    "文字・ロゴ・吹き出し・枠線・透かしは入れないでください。",
    "写真のようなリアル調ではなく、手描きの絵本イラストにしてください。",
    `内容: ${illustrationPrompt}`,
  ].join("\n");

  // Imagen 系モデルは :predict（別方式）、Gemini 系は :generateContent
  if (/imagen/i.test(model)) {
    return generateWithImagenPredict(prompt, model, apiKey);
  }
  return generateWithGenerateContent(prompt, model, apiKey);
}

// Gemini 画像モデル（例: gemini-2.5-flash-image）用
async function generateWithGenerateContent(
  prompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };
  const res = await fetch(
    `${ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new GeminiError(await describeError(res));
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    if (inline?.data) {
      const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
      return `data:${mime};base64,${inline.data}`;
    }
  }
  throw new GeminiError("AIから画像を取得できませんでした。");
}

// Imagen モデル（例: imagen-3.0-generate-002）用
async function generateWithImagenPredict(
  prompt: string,
  model: string,
  apiKey: string
): Promise<string> {
  const body = {
    instances: [{ prompt }],
    parameters: { sampleCount: 1, aspectRatio: "4:3" },
  };
  const res = await fetch(
    `${ENDPOINT}/${encodeURIComponent(model)}:predict?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new GeminiError(await describeError(res));
  const data = await res.json();
  const pred = data?.predictions?.[0];
  const b64 = pred?.bytesBase64Encoded ?? pred?.image?.imageBytes;
  if (b64) {
    const mime = pred?.mimeType ?? "image/png";
    return `data:${mime};base64,${b64}`;
  }
  throw new GeminiError("AIから画像を取得できませんでした。");
}

export type ModelInfo = {
  name: string; // "models/" を除いた短い名前
  methods: string[]; // 対応メソッド
  likelyImage: boolean; // 画像生成っぽいか
};

// 利用可能なモデル一覧を取得する（設定画面でモデル名を選ぶために使用）
export async function listModels(apiKey: string): Promise<ModelInfo[]> {
  const res = await fetch(
    `${ENDPOINT}?key=${encodeURIComponent(apiKey)}&pageSize=1000`,
    { method: "GET" }
  );
  if (!res.ok) throw new GeminiError(await describeError(res));
  const data = await res.json();
  const models: ModelInfo[] = (data?.models ?? []).map((m: any) => {
    const name = String(m.name ?? "").replace(/^models\//, "");
    const methods: string[] = m.supportedGenerationMethods ?? [];
    const likelyImage =
      /image|imagen/i.test(name) || /image/i.test(m.description ?? "");
    return { name, methods, likelyImage };
  });
  return models;
}

// APIキーの疎通確認（軽い文章生成を1回投げる）
export async function testApiKey(model: string, apiKey: string): Promise<void> {
  const res = await fetch(
    `${ENDPOINT}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "こんにちは" }] }] }),
    }
  );
  if (!res.ok) throw new GeminiError(await describeError(res));
}

async function describeError(res: Response): Promise<string> {
  let detail = "";
  try {
    const j = await res.json();
    detail = j?.error?.message ?? "";
  } catch {
    // ignore
  }
  if (res.status === 400 && /API key not valid/i.test(detail)) {
    return "APIキーが正しくありません。設定を確認してください。";
  }
  if (res.status === 403) {
    return "APIキーの権限がありません（403）。キーやAPIの有効化を確認してください。";
  }
  if (res.status === 404) {
    return `モデルが見つかりません（404）。モデル名を確認してください。${detail ? " / " + detail : ""}`;
  }
  if (res.status === 429) {
    return "利用上限に達しました（429）。しばらく待って再試行してください。";
  }
  return `AIの呼び出しに失敗しました（${res.status}）。${detail ? " " + detail : ""}`;
}
