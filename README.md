# Gmail キャッチアップツール

1時間単位でユーザー氏名を含むメールを監視し、Web管理画面で確認できるGmail効率化ツール

## 📋 主要機能

- **1時間単位スケジュール監視**: 設定した時間から1時間間隔でメール監視
- **正規表現検索**: ユーザー氏名の正規表現パターンでメール内容を検索
- **Web管理画面**: React/TypeScript製の直感的な管理インターフェース
- **リアルタイム通知**: 該当メール発見時の即座通知（該当なしの場合は通知しない）
- **パターンカスタマイズ**: 複数の検索パターンを登録・管理可能
- **履歴管理**: キャッチしたメールの履歴表示・検索

## 🚀 使用方法

### 基本セットアップ

```bash
# プロジェクトディレクトリに移動
cd Gmail_tool

# 全依存関係インストール
npm run install:all

# 環境設定ファイル作成
cp backend/.env.example backend/.env

# Gmail API認証情報設定
# backend/config/credentials.json に Gmail API キーを配置
```

### 実行方法

```bash
# 開発モード（フロントエンド・バックエンド同時起動）
npm run dev

# 個別起動
npm run backend:dev   # バックエンドのみ
npm run frontend:dev  # フロントエンドのみ
```

### Gmail API認証

1. **認証URL取得**: http://localhost:3000 でアクセス後、認証設定
2. **トークン保存**: Googleアカウント認証完了後、自動でトークン保存
3. **監視開始**: スケジュール設定で監視を有効化

## 🏗️ プロジェクト構造

```
Gmail_tool/
├── backend/                 # Node.js API サーバー
│   ├── src/
│   │   ├── server.js       # Express サーバー
│   │   ├── gmailService.js # Gmail API 連携
│   │   ├── scheduler.js    # 時間ベース監視システム
│   │   └── database.js     # SQLite データベース管理
│   ├── config/             # 設定ファイル（認証情報等）
│   └── package.json
├── frontend/               # React TypeScript UI
│   ├── src/
│   │   ├── components/     # UI コンポーネント
│   │   ├── services/       # API通信サービス
│   │   ├── types/          # TypeScript型定義
│   │   └── App.tsx
│   └── package.json
└── package.json            # ルートパッケージ設定
```

## ⚙️ 機能詳細

### スケジュール監視
- **開始時刻設定**: 任意の時刻から監視開始
- **間隔設定**: 1-24時間の間隔で設定可能
- **自動実行**: node-schedule による正確な定時実行

### 検索パターン
- **正規表現対応**: 柔軟なパターンマッチング
- **複数パターン**: 無制限のパターン登録
- **有効/無効切替**: パターンごとの個別制御

### Web管理画面
- **メール一覧**: キャッチしたメールの表示・検索
- **パターン管理**: 検索パターンの追加・編集・削除
- **スケジュール設定**: 監視スケジュールの設定・制御

## 🔧 開発・運用

### 依存関係

**バックエンド**
```bash
express cors dotenv googleapis node-schedule sqlite3 axios
```

**フロントエンド**
```bash
react react-dom typescript @mui/material @mui/icons-material axios
```

### 設定ファイル

**backend/.env**
```
PORT=3001
NODE_ENV=development
```

**backend/config/credentials.json**
```json
{
  "web": {
    "client_id": "your_gmail_client_id",
    "client_secret": "your_gmail_client_secret",
    "redirect_uris": ["http://localhost:3001/auth/callback"]
  }
}
```

## ⚠️ 重要な注意事項

- **Gmail API制限**: 1日あたりのクォータ制限に注意
- **認証管理**: OAuth 2.0トークンの適切な保存・更新が必要
- **プライバシー**: メール内容は検索用途のみに使用、適切な暗号化推奨
- **バックアップ**: 設定・パターン情報の定期バックアップ実施
- **セキュリティ**: HTTPS使用、APIキーの環境変数管理必須

## 📊 使用例

### 検索パターン例
```
田中|tanaka|Tanaka     # 複数表記対応
山田.*太郎             # 姓名間の文字許可
(?i)suzuki            # 大文字小文字無視
```

### スケジュール例
- 平日9:00-18:00 (1時間間隔)
- 週末のみ (3時間間隔)
- 24時間監視 (2時間間隔)