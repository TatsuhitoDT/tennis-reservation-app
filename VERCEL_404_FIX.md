# 404: NOT_FOUND の対処（tennis-court-reservation-app.vercel.app）

## デプロイ状況・アプリURL（確認済み）

| 項目 | 内容 |
|------|------|
| **プロジェクト名** | tennis-court-reservation-app |
| **アプリURL** | https://tennis-court-reservation-app.vercel.app |
| **Git リポジトリ** | TatsuhitoDT/tennis-reservation-app |
| **Deployments** | Ready（d693da0, 089d1f8 など成功） |
| **本番** | 最新の Ready が Production に割当 |
| **404 の原因** | Root Directory に `tennis-app` 等が入っていると、リポジトリにそのフォルダがなく 404 になる |

→ **Root Directory を空にして Redeploy** すれば 404 は解消する想定です。

---

## コミットメッセージの文字化け

Vercel の Deployments では**日本語のコミットメッセージが文字化け**することがあります。  
**対処**: 今後は **英語** でコミットメッセージを書いてください。例: `Footer: add privacy policy link, signup: privacy checkbox`

---

## 原因

**https://tennis-court-reservation-app.vercel.app/** で 404 になる主な理由：

1. **別プロジェクトを開いている**  
   正しく動いているのは `TatsuhitoDT/tennis-reservation-app` に紐づいたプロジェクトです。  
   `tennis-court-reservation-app` は古い・別用途のプロジェクトの可能性が高いです。

2. **Root Directory の誤り**  
   リポジトリ `tennis-reservation-app` では、**アプリのルート＝リポジトリのルート**です。  
   Root Directory に `tennis-app` などのサブフォルダを指定していると、そのフォルダが存在せず 404 になります。

3. **ビルド失敗・未デプロイ**  
   ビルドに失敗している、または一度もデプロイが成功していない場合も 404 になります。

---

## 対処手順

### Step 1: 正しい Vercel プロジェクトを確認する

1. Vercel ダッシュボード: https://vercel.com/dashboard
2. プロジェクト一覧で、以下を**両方**満たすものを探す：
   - **Settings → Git → Connected Git Repository** が  
     `TatsuhitoDT/tennis-reservation-app`
   - **Deployments** に、最近の **Ready（成功）** デプロイがある

3. そのプロジェクトの **Overview** に表示されている **「Visit」やドメイン**（例: `〇〇〇.vercel.app`）を開く。  
   → ここが実際に使う本番 URL です。

**重要**: プロジェクト名（`tennis-court-reservation-app` など）ではなく、  
**「どの GitHub リポジトリに接続しているか」** と **「最新デプロイが成功しているか」** で判断してください。

---

### Step 2: `tennis-court-reservation-app` を修正するか削除するか

#### A) この URL を使い続けたい場合（プロジェクトを直す）

1. Vercel で **tennis-court-reservation-app** を開く  
2. **Settings → Git**
   - **Connected Git Repository**: `TatsuhitoDT/tennis-reservation-app` になっているか確認  
   - 違う場合は「Edit」で `tennis-reservation-app` を選び直す  

3. **Settings → General → Root Directory**
   - **空（未入力）** にする。  
     `tennis-app` などが入っていたら削除して「Save」  
   - リポジトリ `tennis-reservation-app` のルートがそのまま Next.js のルートです。

4. **Deployments** で **「Redeploy」** を実行し、ビルドが成功するか確認。

#### B) このプロジェクトは使わない場合（削除して整理）

1. **tennis-court-reservation-app** を開く  
2. **Settings** を開き、一番下の **「Delete Project」**  
3. プロジェクト名を入力して削除  
4. **Step 1** で見つけた「正しいプロジェクト」の URL だけを使う。

---

### Step 3: 正しいプロジェクトの Root Directory を確認

`TatsuhitoDT/tennis-reservation-app` に接続しているプロジェクトで：

- **Settings → General → Root Directory**
- **空（未入力）** であること。  
  - このリポジトリでは、`package.json` や `src/` がルートにあります。  
  - `tennis-app` というフォルダは存在しないため、指定すると 404 になります。

---

## 正しい設定のまとめ（tennis-reservation-app 用）

| 項目 | 設定値 |
|------|--------|
| **Git リポジトリ** | `TatsuhitoDT/tennis-reservation-app` |
| **Root Directory** | **空のまま**（何も入力しない） |
| **Framework** | Next.js（自動検出） |
| **Build Command** | `npm run build` |
| **Output Directory** | （デフォルトのまま） |

---

## それでも 404 になる場合

1. **Deployments** の最新のデプロイで **「Building」ではなく「Ready」** になっているか確認。  
   - 失敗している場合は、そのデプロイの **Build Logs** でエラーを確認。  

2. 開いている URL が、そのプロジェクトの **Domains**（Settings → Domains）に登録されているか確認。  
   - Overview の「Visit」リンクの URL をそのまま使うのが確実です。

3. ブラウザのシークレットウィンドウや別ブラウザで、  
   **Overview の「Visit」の URL** を直接開き直して確認。

---

*このファイルは 404 対応用のメモです。問題が解消したあとで削除してかまいません。*
