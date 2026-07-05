import type { Page } from "../types";

type Props = {
  pages: Page[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
};

export default function PageStrip({
  pages,
  currentIndex,
  onSelect,
  onAdd,
  onDelete,
  onMove,
}: Props) {
  return (
    <div className="page-strip" data-testid="page-strip">
      <div className="page-thumbs">
        {pages.map((page, i) => (
          <div
            key={page.id}
            className={`page-thumb ${i === currentIndex ? "active" : ""}`}
            data-testid="page-thumb"
            data-active={i === currentIndex}
            onClick={() => onSelect(i)}
          >
            <div className="page-thumb-preview">
              {page.imageDataUrl ? (
                <img src={page.imageDataUrl} alt="" />
              ) : (
                <span className="page-thumb-empty">白紙</span>
              )}
            </div>
            <div className="page-thumb-no">{i + 1}</div>
            <div className="page-thumb-actions">
              <button
                className="mini"
                disabled={i === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(i, -1);
                }}
                data-testid="move-left"
                aria-label="前へ"
              >
                ◀
              </button>
              <button
                className="mini"
                disabled={i === pages.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(i, 1);
                }}
                data-testid="move-right"
                aria-label="後ろへ"
              >
                ▶
              </button>
              <button
                className="mini danger"
                disabled={pages.length <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`${i + 1}ページ目を削除しますか？`)) onDelete(i);
                }}
                data-testid="delete-page"
                aria-label="削除"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        <button className="add-page" onClick={onAdd} data-testid="add-page">
          ＋<br />ページ追加
        </button>
      </div>
    </div>
  );
}
