// localStorage を使ったブックの永続化（要件定義書 FR-1 / 6.2）

import type { Book } from "./types";

const STORAGE_KEY = "socialstory.books";

export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Book[];
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    if (e instanceof DOMException && /quota/i.test(e.name + e.message)) {
      throw new Error(
        "保存容量（約5MB）を超えました。不要な絵本を削除するか、この絵本をPDFに出力して残してください。"
      );
    }
    throw e;
  }
}

// 1冊を新規追加または上書き保存する
export function upsertBook(book: Book): Book[] {
  const books = loadBooks();
  const updated: Book = { ...book, updatedAt: Date.now() };
  const idx = books.findIndex((b) => b.id === book.id);
  if (idx >= 0) {
    books[idx] = updated;
  } else {
    books.push(updated);
  }
  saveBooks(books);
  return books;
}

export function deleteBook(id: string): Book[] {
  const books = loadBooks().filter((b) => b.id !== id);
  saveBooks(books);
  return books;
}
