import { useEffect, useRef, useState } from "react";

type Props = {
  pageId: string; // ページ切替検知用
  value: string | null; // 現在のイラスト(Data URL)
  onChange: (dataUrl: string | null) => void;
};

const CANVAS_W = 800;
const CANVAS_H = 600;

const COLORS = [
  "#e57373", // あか
  "#ffb74d", // だいだい
  "#fff176", // きいろ
  "#81c784", // みどり
  "#64b5f6", // あお
  "#ba68c8", // むらさき
  "#a1887f", // ちゃいろ
  "#333333", // くろ
];

type Tool = "brush" | "eraser";

export default function DrawingCanvas({ pageId, value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const loadedPageId = useRef<string | null>(null);

  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(24);
  const [tool, setTool] = useState<Tool>("brush");

  // ページ切替時にキャンバスへ現在の画像を読み込む
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      img.src = value;
    }
    loadedPageId.current = pageId;
    // pageId が変わったときのみ再読込（描画中のonChangeでは再読込しない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  // 柔らかいブラシ: 半透明の放射グラデーション円をジッター付きでスタンプ
  function stamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const r = size / 2;
    if (tool === "eraser") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    const jitter = r * 0.25;
    const jx = x + (Math.random() - 0.5) * jitter;
    const jy = y + (Math.random() - 0.5) * jitter;
    const grad = ctx.createRadialGradient(jx, jy, 0, jx, jy, r);
    grad.addColorStop(0, hexToRgba(color, 0.28));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(jx, jy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLine(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = canvasRef.current!.getContext("2d")!;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const step = Math.max(1, size / 6);
    const steps = Math.max(1, Math.floor(dist / step));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      stamp(ctx, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = getPos(e);
    last.current = p;
    drawLine(p, p);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const p = getPos(e);
    drawLine(last.current, p);
    last.current = p;
  }

  function commit() {
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL("image/png"));
  }

  function handlePointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    commit();
  }

  function handleClear() {
    if (!confirm("絵をぜんぶ消しますか？")) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    onChange(null); // クリア = イラストなし
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        // contain 配置
        const scale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (CANVAS_W - dw) / 2, (CANVAS_H - dh) / 2, dw, dh);
        commit();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div className="drawing" data-testid="drawing">
      <div className="draw-tools">
        <div className="color-palette" data-testid="color-palette">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${color === c && tool === "brush" ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => {
                setColor(c);
                setTool("brush");
              }}
              data-testid="color-swatch"
              aria-label={`色 ${c}`}
            />
          ))}
        </div>

        <label className="tool-item">
          太さ
          <input
            type="range"
            min={6}
            max={60}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            data-testid="brush-size"
          />
        </label>

        <button
          className={`btn ${tool === "eraser" ? "btn-primary" : ""}`}
          onClick={() => setTool(tool === "eraser" ? "brush" : "eraser")}
          data-testid="eraser"
        >
          {tool === "eraser" ? "消しゴム中" : "消しゴム"}
        </button>

        <button className="btn" onClick={handleClear} data-testid="clear-canvas">
          ぜんぶ消す
        </button>

        <label className="btn" data-testid="upload-label">
          画像をのせる
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleUpload}
            data-testid="upload-image"
            style={{ display: "none" }}
          />
        </label>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="canvas"
        data-testid="canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
