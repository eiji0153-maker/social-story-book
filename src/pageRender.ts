// ページ（イラスト＋文章）を1枚のCanvasに合成する。
// プレビューとPDF出力で共用。日本語はブラウザフォントで描画するため
// jsPDFのフォント問題を回避できる（実装計画書 5章）。

import type { Page } from "./types";

export type RenderOptions = {
  width: number; // 出力Canvas幅(px)
  height: number; // 出力Canvas高さ(px)
  pageNumber?: number; // ページ番号（任意）
};

// A4横 約150dpi 相当の既定サイズ
export const A4_LANDSCAPE = { width: 1754, height: 1240 };

// 画像を読み込む
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// 日本語テキストを幅に合わせて文字単位で折り返す
function wrapTextByChar(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  // 明示的な改行を尊重
  for (const paragraph of text.split("\n")) {
    if (paragraph === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const ch of paragraph) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current !== "") {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current !== "") lines.push(current);
  }
  return lines;
}

// ページを与えられたCanvasに描画する
export async function renderPageToCanvas(
  page: Page,
  canvas: HTMLCanvasElement,
  opts: RenderOptions
): Promise<void> {
  const { width, height } = opts;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // 背景（やさしいクリーム色）
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, width, height);

  // レイアウト: 上70%にイラスト、下30%に文章
  const pad = Math.round(width * 0.04);
  const imageAreaH = Math.round(height * 0.66);
  const textAreaY = imageAreaH;
  const textAreaH = height - imageAreaH;

  // イラスト枠（やわらかい角丸の白背景）
  const frameX = pad;
  const frameY = pad;
  const frameW = width - pad * 2;
  const frameH = imageAreaH - pad * 2;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, frameX, frameY, frameW, frameH, 24);
  ctx.fill();

  // イラストを枠内にcontain配置
  if (page.imageDataUrl) {
    try {
      const img = await loadImage(page.imageDataUrl);
      const scale = Math.min(frameW / img.width, frameH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = frameX + (frameW - dw) / 2;
      const dy = frameY + (frameH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    } catch {
      // 読み込み失敗時は空の枠のまま
    }
  }

  // 文章
  const fontSize = Math.round(textAreaH * 0.22);
  ctx.fillStyle = "#333333";
  ctx.font = `${fontSize}px "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif`;
  ctx.textBaseline = "top";
  const textMaxWidth = width - pad * 2;
  const lines = wrapTextByChar(ctx, page.text || "", textMaxWidth);
  const lineHeight = Math.round(fontSize * 1.35);
  let ty = textAreaY + Math.round(textAreaH * 0.08);
  for (const line of lines) {
    ctx.fillText(line, pad, ty);
    ty += lineHeight;
    if (ty > height - lineHeight) break; // はみ出し防止
  }

  // ページ番号
  if (opts.pageNumber != null) {
    ctx.fillStyle = "#bbbbbb";
    ctx.font = `${Math.round(fontSize * 0.5)}px sans-serif`;
    ctx.textBaseline = "bottom";
    ctx.fillText(String(opts.pageNumber), width - pad, height - pad * 0.4);
  }
}

// 「おうちの方へ」あとがきページ（テキスト中心）を描画する
export function renderAfterwordToCanvas(
  afterword: string,
  canvas: HTMLCanvasElement,
  opts: RenderOptions
): void {
  const { width, height } = opts;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, width, height);

  const pad = Math.round(width * 0.08);

  // 見出し
  const headSize = Math.round(height * 0.06);
  ctx.fillStyle = "#f57f43";
  ctx.font = `bold ${headSize}px "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText("おうちの方へ", pad, pad);

  // 区切り線
  ctx.strokeStyle = "#e6e1d6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, pad + headSize * 1.5);
  ctx.lineTo(width - pad, pad + headSize * 1.5);
  ctx.stroke();

  // 本文
  const fontSize = Math.round(height * 0.035);
  ctx.fillStyle = "#444444";
  ctx.font = `${fontSize}px "Yu Gothic UI", "Hiragino Sans", "Noto Sans JP", sans-serif`;
  const lines = wrapTextByChar(ctx, afterword || "", width - pad * 2);
  const lineHeight = Math.round(fontSize * 1.7);
  let ty = pad + headSize * 2.2;
  for (const line of lines) {
    ctx.fillText(line, pad, ty);
    ty += lineHeight;
    if (ty > height - pad) break;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
