# SocialStory Book（ソーシャルストーリー絵本メーカー）

特別支援教育の職員が、想定した場面を **柔らかいタッチのイラスト＋やさしい文章** で
オリジナル絵本にして **PDF出力** できる、ブラウザ完結のツール（MVP）。

- データはブラウザ内（localStorage）に保存。外部送信なし・オフライン動作。
- 日本語はCanvas合成で描画するため、PDFでも文字化けしません。

## 使い方（開発）

```bash
cd social-story-book
npm install
npm run dev          # http://localhost:5173
```

1. 「あたらしい えほんをつくる」→ タイトル・場面を入力
2. ページごとに絵を描く（色・太さ・消しゴム・画像アップロード）＋文章を入力
3. 「ページ追加」で場面を増やす／並び替え・削除も可能
4. 「プレビュー」で絵本表示 →「PDF出力」でダウンロード

## テスト（Playwright）

```bash
npx playwright install chromium   # 初回のみ
npm run test:e2e                  # 全E2Eテスト実行
npm run test:e2e:ui               # UIモード
```

## ドキュメント
- `docs/要件定義書.md` … 全要件（機能/非機能/データ/受け入れ基準）
- `docs/実装計画書_MVP.md` … MVP実装計画
- `docs/テスト仕様書.md` … 「何をしたら、どうなるべきか」一覧
- E2Eテスト … `tests/e2e/`

## 技術スタック
React 18 / TypeScript / Vite / HTML5 Canvas / jsPDF / Playwright

## 今後の拡張（フェーズ2以降）
- 音声録音・再生、ふりがな自動付与、ソーシャルストーリー用テンプレート
- 動画埋め込み、AIによる挿絵/文章の自動生成、クラウド共有・TTS
