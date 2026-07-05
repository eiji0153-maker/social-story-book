import { useState } from "react";
import type { Book, Page } from "../types";
import { createEmptyPage } from "../types";
import type { AiSettings } from "../ai/config";
import { regenerateIllustration } from "../ai/generate";
import DrawingCanvas from "./DrawingCanvas";
import PageStrip from "./PageStrip";
import Preview from "./Preview";
import { exportBookToPdf } from "../pdf";

type Props = {
  initialBook: Book;
  settings: AiSettings;
  onSave: (book: Book) => void;
  onBack: () => void;
};

export default function Editor({ initialBook, settings, onSave, onBack }: Props) {
  const [book, setBook] = useState<Book>(initialBook);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const current = book.pages[currentIndex];

  function update(mutator: (b: Book) => Book) {
    setBook((b) => mutator(b));
    setSaved(false);
  }

  function updatePage(index: number, patch: Partial<Page>) {
    update((b) => {
      const pages = b.pages.slice();
      pages[index] = { ...pages[index], ...patch };
      return { ...b, pages };
    });
  }

  function handleAddPage() {
    update((b) => ({ ...b, pages: [...b.pages, createEmptyPage()] }));
    setCurrentIndex(book.pages.length); // 追加した末尾へ
  }

  function handleDeletePage(index: number) {
    update((b) => {
      if (b.pages.length <= 1) return b;
      const pages = b.pages.filter((_, i) => i !== index);
      return { ...b, pages };
    });
    setCurrentIndex((ci) => Math.max(0, Math.min(ci, book.pages.length - 2)));
  }

  function handleMovePage(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= book.pages.length) return;
    update((b) => {
      const pages = b.pages.slice();
      [pages[index], pages[target]] = [pages[target], pages[index]];
      return { ...b, pages };
    });
    setCurrentIndex(target);
  }

  function handleSave() {
    onSave(book);
    setSaved(true);
  }

  async function handlePdf() {
    onSave(book);
    await exportBookToPdf(book);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const dataUrl = await regenerateIllustration(current, settings);
      updatePage(currentIndex, { imageDataUrl: dataUrl });
    } catch (e) {
      alert("イラストの生成に失敗しました: " + (e as Error).message);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <main className="editor" data-testid="editor">
      <div className="editor-topbar">
        <button className="btn" onClick={onBack} data-testid="back-to-list">
          ← 一覧へ
        </button>
        <div className="editor-actions">
          <button
            className="btn"
            onClick={() => setShowPreview(true)}
            data-testid="open-preview"
          >
            👁 プレビュー
          </button>
          <button className="btn" onClick={handlePdf} data-testid="export-pdf">
            ⬇ PDF出力
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            data-testid="save-book"
          >
            {saved ? "保存しました" : "保存"}
          </button>
        </div>
      </div>

      <div className="editor-meta">
        <label className="field">
          タイトル
          <input
            type="text"
            value={book.title}
            onChange={(e) => update((b) => ({ ...b, title: e.target.value }))}
            data-testid="book-title"
          />
        </label>
        <label className="field">
          想定する場面（メモ）
          <input
            type="text"
            value={book.scene}
            placeholder="例: 給食のかたづけ"
            onChange={(e) => update((b) => ({ ...b, scene: e.target.value }))}
            data-testid="book-scene"
          />
        </label>
      </div>

      <PageStrip
        pages={book.pages}
        currentIndex={currentIndex}
        onSelect={setCurrentIndex}
        onAdd={handleAddPage}
        onDelete={handleDeletePage}
        onMove={handleMovePage}
      />

      <div className="editor-page">
        <div className="editor-page-head">
          <div className="editor-page-no" data-testid="current-page-no">
            {currentIndex + 1} / {book.pages.length} ページ
          </div>
          <button
            className="btn"
            onClick={handleRegenerate}
            disabled={regenerating}
            data-testid="regenerate-illustration"
            title="このページのイラストをAI（またはキー未設定時は代替）で作り直します"
          >
            {regenerating ? "作成中…" : "🪄 イラストを作り直す"}
          </button>
        </div>
        <DrawingCanvas
          pageId={current.id}
          value={current.imageDataUrl}
          onChange={(dataUrl) => updatePage(currentIndex, { imageDataUrl: dataUrl })}
        />
        <label className="field field-text">
          文章
          <textarea
            value={current.text}
            placeholder="例: きゅうしょくが おわったら、じぶんの おさらを たなに もどします。"
            onChange={(e) => updatePage(currentIndex, { text: e.target.value })}
            data-testid="page-text"
            rows={3}
          />
        </label>
      </div>

      {showPreview && (
        <Preview book={book} onClose={() => setShowPreview(false)} />
      )}
    </main>
  );
}
