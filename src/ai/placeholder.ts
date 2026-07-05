// AIキーが無い/画像生成に失敗した場合の、オフラインの代替イラスト生成。
// やわらかいパステルの背景＋テーマに合う絵文字を描いて、それらしい挿絵にする。

const KEYWORD_EMOJI: [RegExp, string][] = [
  [/給食|きゅうしょく|食事|ごはん|食べ/, "🍽️"],
  [/かたづけ|片付|そうじ|掃除|せいり|整理/, "🧹"],
  [/友達|ともだち|なかま|仲間/, "🧒"],
  [/泣|なき|かなし|悲し/, "😢"],
  [/おこ|怒|いかり/, "😠"],
  [/あいさつ|挨拶|こんにちは|おはよう/, "👋"],
  [/て(を)?あら|手洗|うがい/, "🧼"],
  [/トイレ|といれ/, "🚻"],
  [/がっこう|学校|きょうしつ|教室/, "🏫"],
  [/せんせい|先生/, "👩‍🏫"],
  [/じゅんばん|順番|ならぶ|並/, "🚸"],
  [/きもち|気持|かんじょう|感情/, "💗"],
  [/あそ|遊/, "🧸"],
  [/ねる|寝|すいみん|睡眠/, "😴"],
  [/やくそく|約束|ルール/, "📗"],
];

const BG_PAIRS: [string, string][] = [
  ["#fde2e4", "#fff1e6"],
  ["#e2f0cb", "#f0fff0"],
  ["#dbeafe", "#eef6ff"],
  ["#f3e8ff", "#fdf2ff"],
  ["#fff4d6", "#fffbe8"],
];

function pickEmoji(text: string): string {
  for (const [re, emoji] of KEYWORD_EMOJI) {
    if (re.test(text)) return emoji;
  }
  return "🌈";
}

// index で背景色を少しずつ変える
export function makePlaceholderImage(text: string, index = 0): string {
  const W = 800;
  const H = 600;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const [c1, c2] = BG_PAIRS[index % BG_PAIRS.length];
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // やわらかい円をいくつか散らす
  ctx.globalAlpha = 0.35;
  const dots = ["#ffffff", "#ffe0ec", "#e0f0ff", "#fff6cc"];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = dots[i % dots.length];
    const x = (i * 137) % W;
    const y = (i * 91) % H;
    ctx.beginPath();
    ctx.arc(x, y, 60 + (i % 3) * 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 中央に絵文字
  const emoji = pickEmoji(text);
  ctx.font = "260px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, W / 2, H / 2);

  return canvas.toDataURL("image/png");
}
