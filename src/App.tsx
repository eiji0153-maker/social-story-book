import { useEffect, useState } from "react";
import type { Book } from "./types";
import { createEmptyBook } from "./types";
import { loadBooks, upsertBook, deleteBook } from "./storage";
import type { AiSettings } from "./ai/config";
import { loadSettings } from "./ai/config";
import BookList from "./components/BookList";
import Editor from "./components/Editor";
import NewBook from "./components/NewBook";
import Settings from "./components/Settings";

type View = "list" | "editor" | "newbook";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSettings>(loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setBooks(loadBooks());
  }, []);

  const editingBook = books.find((b) => b.id === editingId) ?? null;

  function handleCreateEmpty() {
    const book = createEmptyBook();
    const next = upsertBook(book);
    setBooks(next);
    setEditingId(book.id);
    setView("editor");
  }

  function handleStartNew() {
    setView("newbook");
  }

  function handleGenerated(book: Book, warnings: string[]) {
    const next = upsertBook(book);
    setBooks(next);
    setEditingId(book.id);
    setView("editor");
    if (warnings.length > 0) {
      alert("絵本ができました。\n\n【お知らせ】\n" + warnings.join("\n"));
    }
  }

  function handleOpen(id: string) {
    setEditingId(id);
    setView("editor");
  }

  function handleDelete(id: string) {
    setBooks(deleteBook(id));
  }

  function handleSave(book: Book) {
    setBooks(upsertBook(book));
  }

  function handleBackToList() {
    setBooks(loadBooks());
    setEditingId(null);
    setView("list");
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📖 SocialStory Book</h1>
        <span className="app-subtitle">ソーシャルストーリー絵本メーカー</span>
        <button
          className="btn header-settings"
          onClick={() => setShowSettings(true)}
          data-testid="open-settings"
        >
          ⚙ AI設定
        </button>
      </header>

      {view === "list" && (
        <BookList
          books={books}
          onStartNew={handleStartNew}
          onCreateEmpty={handleCreateEmpty}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      )}

      {view === "newbook" && (
        <NewBook
          settings={settings}
          onCreated={handleGenerated}
          onCancel={handleBackToList}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {view === "editor" && editingBook && (
        <Editor
          key={editingBook.id}
          initialBook={editingBook}
          settings={settings}
          onSave={handleSave}
          onBack={handleBackToList}
        />
      )}

      {showSettings && (
        <Settings
          initial={settings}
          onClose={(saved) => {
            setSettings(saved);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
