# 🚀 Vercelデプロイ用クイックガイド

## 初回デプロイ手順

### 1. GitHubリポジトリを作成
- https://github.com で新しいリポジトリを作成
- リポジトリ名: `tennis-reservation-app`（任意）

### 2. Gitでプッシュ

```powershell
# プロジェクトディレクトリに移動
cd c:\Dev\vault\tennis-reservation\tennis-app

# Gitを初期化
git init

# ファイルを追加
git add .

# コミット
git commit -m "Initial commit: Tennis reservation app MVP"

# GitHubリポジトリに接続（your-usernameを実際のユーザー名に変更）
git remote add origin https://github.com/your-username/tennis-reservation-app.git

# ブランチ名をmainに
git branch -M main

# プッシュ（GitHubの認証が必要）
git push -u origin main
```

**⚠️ 注意**: 初回プッシュ時、GitHubの認証が必要です
- GitHub → Settings → Developer settings → Personal access tokens
- 新しいトークンを作成（`repo`権限）
- パスワードの代わりにトークンを使用

### 3. Vercelでデプロイ

1. **https://vercel.com** にログイン
2. **「Add New...」** → **「Project」**
3. GitHubリポジトリを選択
4. **重要**: **Root Directory** を `tennis-app` に設定
5. **Environment Variables** を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
6. **「Deploy」** をクリック

### 4. Supabaseの設定

デプロイ後、Supabaseダッシュボードで：
- Authentication → URL Configuration
- Site URL: VercelのURLを設定
- Redirect URLs: `https://your-app.vercel.app/**` を追加

詳細は `doc/03_vercel_deployment_guide.md` を参照してください。
