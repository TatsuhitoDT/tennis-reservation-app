# テニスコート予約システム

## セットアップ

### 1. Node.jsインストール
https://nodejs.org/ からLTS版をインストール

### 2. 依存関係インストール
```bash
cd tennis-app
npm install
```

### 3. 環境変数設定
`.env.local` ファイルにSupabaseの認証情報を設定（設定済み）

### 4. Supabaseテーブル作成
`doc/02_database_setup.sql` をSupabaseのSQL Editorで実行

### 5. 開発サーバー起動
```bash
npm run dev
```

http://localhost:3000 でアプリが起動します。

## 技術スタック

- **Frontend**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS + Material Design 3
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Calendar**: FullCalendar

## カラーパレット

| 用途 | HEX | Pantone |
|------|-----|---------|
| Primary | #16145F | 2765 |
| Primary Light | #0067B1 | 293 |
| Accent | #00A5E3 | 7460 |
| Outline | #B6B8BA | 422 |
| Highlight | #E72241 | 1925 |
