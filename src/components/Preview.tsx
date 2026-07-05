import { useEffect, useRef, useState } from "react";
import type { Book } from "../types";
import {
  renderPageToCanvas,
  renderAfterwordToCanvas,
  A4_LANDSCAPE,
} from "../pageRender";

type Props = {
  book: Book;
  onClose: () => void;
};

export default function Preview({ book, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);
  const hasAfterword = !!(book.afterword && book.afterword.trim());
  const total = book.pages.length + (hasAfterword ? 1 : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { width: A4_LANDSCAPE.width, height: A4_LANDSCAPE.height };
    if (hasAfterword && index === book.pages.length) {
      renderAfterwordToCanvas(book.afterword!, canvas, opts);
    } else {
      renderPageToCanvas(book.pages[index], canvas, {
        ...opts,
        pageNumber: index + 1,
      });
    }
  }, [book, index, hasAfterword]);

  return (
    <div className="preview-overlay" data-testid="preview">
      <div className="preview-box">
        <canvas ref={canvasRef} className="preview-canvas" data-testid="preview-canvas" />
        <div className="preview-controls">
          <button
            className="btn"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            data-testid="preview-prev"
          >
            ◀ まえ
          </button>
          <span data-testid="preview-page-indicator">
            {index + 1} / {total}
          </span>
          <button
            className="btn"
            disabled={index >= total - 1}
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            data-testid="preview-next"
          >
            つぎ ▶
          </button>
          <button className="btn btn-primary" onClick={onClose} data-testid="preview-close">
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
