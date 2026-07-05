import { useEffect, useState } from "react";
import type { Book } from "./types";
import { createEmptyBook } from "./types";
import { loadBooks, upsertBook, deleteBook } from "./storage";
import BookList from "./components/BookList";
import Editor from "./components/Editor";

type View = "list" | "editor";

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setBooks(loadBooks());
  }, []);

  const editingBook = books.find((b) => b.id === editingId) ?? null;

  function handleCreate() {
    const book = createEmptyBook();
    const next = upsertBook(book);
    setBooks(next);
    setEditingId(book.id);
    setView("editor");
  }

  function handleOpen(id: string) {
    setEditingId(id);
    setView("editor");
  }

  function handleDelete(id: string) {
    const next = deleteBook(id);
    setBooks(next);
  }

  function handleSave(book: Book) {
    const next = upsertBook(book);
    setBooks(next);
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
      </header>

      {view === "list" && (
        <BookList
          books={books}
          onCreate={handleCreate}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      )}

      {view === "editor" && editingBook && (
        <Editor
          key={editingBook.id}
          initialBook={editingBook}
          onSave={handleSave}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
}
