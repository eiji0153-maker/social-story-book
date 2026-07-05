import { useState } from "react";
import type { Book } from "../types";
import type { AiSettings } from "../ai/config";
import { hasApiKey } from "../ai/config";
import { generateBook, type Progress } from "../ai/generate";

type Props = {
  settings: AiSettings;
  onCreated: (book: Book, warnings: string[]) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
};

const EXAMPLES = [
  "給食が終わったら、自分の食器を棚に戻す",
  "友達が泣いていたら、声をかける",
  "はじめての場所に行くときの流れ",
  "順番を待つ",
];

export default function NewBook({ settings, onCreated, onCancel, onOpenSettings }: Props) {
  const [theme, setTheme] = useState("");
  const [pageCount, setPageCount] = useState(settings.pageCount);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keyPresent = hasApiKey(settings);

  async function handleGenerate() {
    if (!keyPresent) {
      setError("AIキーが未設定です。右上の「⚙ AI設定」でGemini APIキーを登録してください。");
      onOpenSettings();
      return;
    }
    if (!theme.trim()) {
      setError("テーマを入力してください。");
      return;
    }
    setError(null);
    setGenerating(true);
    setProgress({ phase: "text", current: 0, total: pageCount, message: "準備しています…" });
    try {
      const { book, warnings } = await generateBook(
        theme.trim(),
        { ...settings, pageCount },
        (p) => setProgress(p)
      );
      onCreated(book, warnings);
    } catch (e) {
      setError((e as Error).message || "生成に失敗しました。");
      setGenerating(false);
    }
  }

  return (
    <main className="new-book" data-testid="new-book">
      <div className="toolbar">
        <button className="btn" onClick={onCancel} data-testid="new-book-cancel">
          ← 一覧へ
        </button>
      </div>

      <div className="new-book-card">
        <h2>✨ テーマから絵本をつくる</h2>
        <p className="settings-hint">
          子どもに伝えたい「場面」や「テーマ」を入力すると、各ページの文章とイラストを自動で作ります。
          <br />
          <b>子どもの名前など個人情報は入力しないでください。</b>
        </p>

        <label className="field">
          テーマ・伝えたい場面
          <textarea
            value={theme}
            placeholder="例: 給食が終わったら、自分の食器を棚に戻す"
            onChange={(e) => setTheme(e.target.value)}
            rows={2}
            data-testid="theme-input"
            disabled={generating}
          />
        </label>

        <div className="examples">
          <span>例:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="chip"
              onClick={() => setTheme(ex)}
              disabled={generating}
              data-testid="example-chip"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="settings-row">
          <label className="field">
            ページ数
            <input
              type="number"
              min={1}
              max={12}
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
              data-testid="new-page-count"
              disabled={generating}
            />
          </label>
        </div>

        <div
          className={`ai-status ${keyPresent ? "on" : "off"}`}
          data-testid="ai-status"
        >
          {keyPresent ? (
            <>🟢 AI生成: 有効（文章・イラストを Gemini で作成／色鉛筆・クレヨン風）</>
          ) : (
            <>
              🔴 AIキーが未設定です。自動生成には Gemini APIキーの設定が必要です。
              <button className="link-btn" onClick={onOpenSettings} data-testid="open-settings-inline">
                AI設定を開く
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="test-result" data-testid="new-book-error">
            ✗ {error}
          </p>
        )}

        {generating && progress && (
          <div className="progress" data-testid="progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    progress.total ? (progress.current / progress.total) * 100 : 0
                  }%`,
                }}
              />
            </div>
            <p>{progress.message}</p>
          </div>
        )}

        <div className="preview-controls">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
            disabled={generating}
            data-testid="generate"
          >
            {generating ? "作成中…" : "🪄 絵本をつくる"}
          </button>
        </div>
      </div>
    </main>
  );
}
