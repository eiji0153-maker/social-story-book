import { useState } from "react";
import type { AiSettings } from "../ai/config";
import { saveSettings } from "../ai/config";
import { testApiKey, GeminiError } from "../ai/gemini";

type Props = {
  initial: AiSettings;
  onClose: (saved: AiSettings) => void;
};

export default function Settings({ initial, onClose }: Props) {
  const [s, setS] = useState<AiSettings>(initial);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function set<K extends keyof AiSettings>(key: K, value: AiSettings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  }

  function handleSave() {
    saveSettings(s);
    onClose(s);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      await testApiKey(s.textModel, s.apiKey);
      setTestResult("✓ 接続できました。キーは有効です。");
    } catch (e) {
      const msg = e instanceof GeminiError ? e.message : "接続に失敗しました。";
      setTestResult("✗ " + msg);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="preview-overlay" data-testid="settings">
      <div className="preview-box settings-box">
        <h2 style={{ margin: 0 }}>⚙ AI設定</h2>
        <p className="settings-hint">
          文章とイラストの生成には Google の Gemini API キーが必要です。キーは
          <b>この端末のブラウザ内にのみ保存</b>され、絵本づくり以外には使われません。
          キーが無いと自動生成はできません（Google AI Studio で無料取得できます）。
        </p>

        <label className="field">
          Gemini APIキー
          <input
            type="password"
            value={s.apiKey}
            placeholder="AIza... （Google AI Studio で取得）"
            onChange={(e) => set("apiKey", e.target.value)}
            data-testid="api-key"
          />
        </label>

        <div className="settings-row">
          <label className="field">
            文章モデル
            <input
              type="text"
              value={s.textModel}
              onChange={(e) => set("textModel", e.target.value)}
              data-testid="text-model"
            />
          </label>
          <label className="field">
            画像モデル
            <input
              type="text"
              value={s.imageModel}
              onChange={(e) => set("imageModel", e.target.value)}
              data-testid="image-model"
            />
          </label>
        </div>

        <div className="settings-row">
          <label className="field">
            ページ数（初期値）
            <input
              type="number"
              min={1}
              max={12}
              value={s.pageCount}
              onChange={(e) => set("pageCount", Number(e.target.value))}
              data-testid="page-count"
            />
          </label>
        </div>
        <p className="settings-hint">
          文章とイラストは、いずれも Gemini で生成します（イラストは色鉛筆・クレヨン風の絵本タッチ）。
        </p>

        {testResult && (
          <p className="test-result" data-testid="test-result">
            {testResult}
          </p>
        )}

        <div className="preview-controls">
          <button
            className="btn"
            onClick={handleTest}
            disabled={testing || !s.apiKey.trim()}
            data-testid="test-key"
          >
            {testing ? "確認中…" : "キーを確認"}
          </button>
          <button className="btn" onClick={() => onClose(initial)} data-testid="settings-cancel">
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={handleSave} data-testid="settings-save">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
