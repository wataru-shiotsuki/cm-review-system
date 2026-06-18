# CM考査 自動化システム — フロントエンド

React 19 + TypeScript + Vite 製の、絵コンテ考査システムのUI。

## 構成

- **src/App.tsx**: ルート。PDF選択 → 絵コンテアップロード → 考査実行
- **src/components/GuidelineSelector.tsx**: ガイドラインPDFのチェックボックス選択 + トークン使用量バー
- **src/components/UploadZone.tsx**: 絵コンテのドラッグ&ドロップ
- **src/components/VerdictBanner.tsx**: 🔴放送不可 / 🟡修正推奨 / 🟢問題なし の合否バナー
- **src/components/CutView.tsx**: カット番号別の指摘グループ表示
- **src/components/IssueCard.tsx**: 単一指摘の表示カード
- **src/utils/cutAnalysis.ts**: カット番号抽出・合否判定のロジック
- **src/types.ts**: API 型定義

## 開発

```bash
npm install
npm run dev   # http://localhost:5173
npm run build # 型チェック + 本番ビルド
```

## バックエンド連携

`vite.config.ts` で以下を localhost:8000 にプロキシ:

- `/api/*` — REST API (health, guidelines, review)
- `/guidelines/*` — ガイドラインPDFの直接配信

バックエンドが起動していない時は `ERR_CONNECTION_REFUSED` になる。`../backend/` を先に起動すること。
