# SocialStory Book MVP 実装計画書

## 0. 概要
要件定義書（`要件定義書.md`）の **フェーズ1（MVP: FR-1〜FR-8）** を実装するための計画書。

- ゴール: 「場面を入力 → 柔らかい絵と文で絵本を作る → PDF出力」がブラウザ内で完結する。
- 完成の定義: 要件定義書「9. 受け入れ基準」を満たし、Playwright E2Eテストが通ること。

---

## 1. 技術スタック
| 分類 | 採用技術 | 理由 |
|------|----------|------|
| 言語 | TypeScript | 型安全・保守性 |
| UIライブラリ | React 18 | コンポーネント分割が容易 |
| ビルド | Vite | 高速・軽量なブラウザアプリ構成 |
| 描画 | HTML5 Canvas + Pointer Events | 柔らかいブラシ描画・タッチ対応 |
| PDF | jsPDF | クライアント完結でPDF生成 |
| 日本語PDF対策 | 各ページをCanvasで画像合成しjsPDFへ | フォント埋め込み不要で文字化けを回避 |
| 保存 | localStorage | オフライン・外部送信なし |
| テスト | Playwright | E2E自動テスト |

> 補足: jsPDF標準フォントは日本語非対応のため、**各ページを一旦Canvasに描画（日本語はブラウザフォントで描画可）してPNG化し、jsPDFに画像として貼る**方式を採用。フォントファイル埋め込み不要で確実に日本語表示できる。

---

## 2. ディレクトリ構成
```
social-story-book/
├─ docs/
│  ├─ 要件定義書.md
│  ├─ 実装計画書_MVP.md
│  └─ テスト仕様書.md
├─ src/
│  ├─ main.tsx            # エントリ
│  ├─ App.tsx             # 画面ルーティング(list/editor/preview)
│  ├─ types.ts            # Book / Page 型
│  ├─ storage.ts          # localStorage CRUD
│  ├─ pageRender.ts       # ページ→Canvas画像合成（プレビュー/PDF共用）
│  ├─ pdf.ts              # jsPDF出力
│  ├─ components/
│  │  ├─ BookList.tsx     # 一覧・新規作成・削除
│  │  ├─ Editor.tsx       # エディタ全体
│  │  ├─ DrawingCanvas.tsx# 柔らかいブラシ描画・画像アップロード
│  │  ├─ PageStrip.tsx    # ページ追加/削除/並び替え/選択
│  │  └─ Preview.tsx      # 絵本プレビュー
│  └─ styles.css
├─ tests/e2e/             # Playwrightテスト
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ playwright.config.ts
```

---

## 3. 実装ステップ

### STEP 1: プロジェクト初期化
- Vite + React + TS 構成のファイルを作成。
- `npm install` で依存導入（react, react-dom, jspdf, vite, typescript, @playwright/test）。

### STEP 2: データ層（FR-1, FR-6.2）
- `types.ts`: `Book` / `Page` 型を定義。
- `storage.ts`: `loadBooks / saveBooks / createBook / deleteBook / upsertBook` を実装。
- ID生成は `crypto.randomUUID()`。

### STEP 3: ブック一覧（FR-1）
- `BookList.tsx`: 一覧表示・新規作成・開く・削除（確認ダイアログ）。

### STEP 4: エディタ骨組み（FR-2, FR-3）
- `Editor.tsx`: タイトル/場面入力、ページ一覧(`PageStrip`)、選択ページ編集。
- `PageStrip.tsx`: ページ追加・削除（最低1枚）・前後入替・選択。

### STEP 5: 描画（FR-4, FR-5）
- `DrawingCanvas.tsx`:
  - Pointer Eventsで描画。
  - 柔らかいブラシ = 半透明の円スタンプを軌跡に沿って重ね、微小ジッターを加える。
  - 色パレット、太さスライダー、消しゴム（destination-out）、クリア（確認）。
  - 画像アップロード（FileReader→Data URL→キャンバスにcontain描画）。
  - 変更確定時に `toDataURL()` でページ画像を更新。

### STEP 6: プレビュー & ページ合成（FR-7, FR-8基盤）
- `pageRender.ts`: `renderPageToCanvas(page, opts)` を実装。
  - 背景（やさしい色）→ イラストをcontain配置 → 文章を大きな文字で折り返し描画（日本語は文字単位で改行）。
- `Preview.tsx`: `renderPageToCanvas` を使い1ページずつ表示、ページ送り。

### STEP 7: PDF出力（FR-8）
- `pdf.ts`: 全ページを `renderPageToCanvas` でPNG化し、jsPDF（A4横）へ1ページずつ貼付、`title.pdf` で保存。

### STEP 8: スタイル・仕上げ（NFR-1）
- 大きめボタン・やさしい配色・日本語ラベル。
- 主要要素に `data-testid` を付与（NFR-6）。

### STEP 9: テスト（別ドキュメント）
- テスト仕様書に基づきPlaywright E2Eを実装（`tests/e2e`）。

---

## 4. 柔らかいブラシの実装方針
- ブラシ1点 = 半径Rの放射グラデーション円（中心不透明→外周透明）を、線の軌跡上に細かい間隔でスタンプ。
- 各スタンプに ±数px のランダムジッターと低alpha（例 0.15〜0.3）を与え、重ね塗りで色鉛筆/クレヨンのムラを再現。
- `globalCompositeOperation`:
  - 描画: `source-over`
  - 消しゴム: `destination-out`

---

## 5. PDF/日本語対策の要点
- jsPDFへ直接テキストを書くと日本語が文字化けするため使用しない。
- Canvasの `fillText` はブラウザの日本語フォントで描画できるため、
  ページ全体（背景＋絵＋文）をCanvasに描いてPNG化し、`addImage` で貼る。
- 出力解像度: A4横 297×210mm を約150dpi（≈1754×1240px）で合成。

---

## 6. リスクと対策
| リスク | 対策 |
|--------|------|
| localStorage容量超過 | MVPは小規模利用前提。将来クラウド保存（フェーズ3）。 |
| html2canvas等の描画差異 | 外部レンダリングを使わず自前Canvas合成で回避。 |
| タッチ端末での描画 | Pointer Eventsで統一対応。 |

---

## 7. 完了チェックリスト
- [ ] STEP1 プロジェクトが起動する（`npm run dev`）。
- [ ] STEP2-4 ブック作成・保存・ページ操作ができる。
- [ ] STEP5 描画・色/太さ/消しゴム/クリア・画像アップロードができる。
- [ ] STEP6-7 プレビュー・PDF出力（日本語OK）ができる。
- [ ] STEP9 Playwright E2Eが全て通る。
