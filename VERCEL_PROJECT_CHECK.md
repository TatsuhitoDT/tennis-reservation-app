# Vercelプロジェクト確認・削除ガイド

## 正しいプロジェクトの判定基準

以下の**3つの条件をすべて満たす**プロジェクトが正しいプロジェクトです：

### 条件1: GitHubリポジトリ
- **値**: `TatsuhitoDT/tennis-reservation-app`
- **確認場所**: Settings → Git → Connected Git Repository

### 条件2: 最新のコミット
- **値**: `269a536` (完全なハッシュ: `269a536596fa7cc2766a69d1f5201723c923f3ee`)
- **コミットメッセージ**: "Trigger Vercel deployment - Fix build error"
- **確認場所**: Deployments タブ → 最新のデプロイのコミットハッシュ

### 条件3: Root Directory
- **値**: `tennis-app`
- **確認場所**: Settings → General → Root Directory

---

## 削除すべきプロジェクトの判定

**上記の3つの条件をすべて満たさないプロジェクトは、すべて削除してください。**

### 削除手順

各プロジェクトで：

1. プロジェクトを開く
2. Settings タブを開く
3. 一番下までスクロール
4. 「Delete Project」セクションを開く
5. プロジェクト名を入力して確認
6. 「Delete」をクリック

---

## 確認チェックリスト

各プロジェクトに対して、以下を確認してください：

| プロジェクト名 | GitHubリポジトリ | 最新コミット | Root Directory | 判定 |
|---------------|----------------|------------|---------------|------|
| `tennis-reservation-app-fg4m` | ? | ? | ? | ? |
| `tennis-court-reservation-app` | ? | ? | ? | ? |
| `tennis-reservation-app` | ? | ? | ? | ? |
| `tennis-court-reservation` | ? | ? | ? | ? |
| `tennis-reservation-app-1rqt` | ? | ? | ? | ? |

**判定基準**: 3つの条件をすべて満たすプロジェクトが1つだけあるべきです。それ以外はすべて削除してください。

---

## 正しいプロジェクトの確認方法

1. **GitHubリポジトリの確認**
   - Settings → Git → Connected Git Repository
   - `TatsuhitoDT/tennis-reservation-app` と表示されているか

2. **最新コミットの確認**
   - Deployments タブを開く
   - 最新のデプロイのコミットハッシュが `269a536` か確認
   - または、コミットメッセージが "Trigger Vercel deployment - Fix build error" か確認

3. **Root Directoryの確認**
   - Settings → General → Root Directory
   - `tennis-app` と表示されているか

---

## 削除後の確認

正しいプロジェクト1つだけが残ったら：

1. そのプロジェクトで最新のコミット `269a536` がデプロイされているか確認
2. デプロイが成功しているか確認（Status: Ready）
3. アプリケーションが正常に動作するか確認
