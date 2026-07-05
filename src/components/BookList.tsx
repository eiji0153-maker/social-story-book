import type { Book } from "../types";

type Props = {
  books: Book[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function BookList({ books, onCreate, onOpen, onDelete }: Props) {
  return (
    <main className="book-list" data-testid="book-list">
      <div className="toolbar">
        <button
          className="btn btn-primary btn-lg"
          onClick={onCreate}
          data-testid="create-book"
        >
          ＋ あたらしい えほんを つくる
        </button>
      </div>

      {books.length === 0 ? (
        <p className="empty" data-testid="empty-message">
          まだ えほんが ありません。上のボタンから つくってみましょう。
        </p>
      ) : (
        <ul className="book-cards">
          {books
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((book) => (
              <li key={book.id} className="book-card" data-testid="book-card">
                <button
                  className="book-card-main"
                  onClick={() => onOpen(book.id)}
                  data-testid="open-book"
                >
                  <span className="book-card-title">{book.title}</span>
                  {book.scene && (
                    <span className="book-card-scene">場面: {book.scene}</span>
                  )}
                  <span className="book-card-meta">
                    {book.pages.length}ページ ・ {formatDate(book.updatedAt)}
                  </span>
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm(`「${book.title}」を削除しますか？`)) {
                      onDelete(book.id);
                    }
                  }}
                  data-testid="delete-book"
                >
                  削除
                </button>
              </li>
            ))}
        </ul>
      )}
    </main>
  );
}
