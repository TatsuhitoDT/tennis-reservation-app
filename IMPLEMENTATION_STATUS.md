# テニスコート予約システム - 実装状況

コードベースから確認した実装状況です。（最終確認: 2025年）

---

## 1. ページ構成

| パス | ファイル | 実装 |
|------|----------|------|
| `/` | `app/page.tsx` | ✅ トップページ（ヒーロー、特徴、利用ルール、ログインボタン） |
| `/login` | `app/login/page.tsx` | ✅ ログイン・新規登録（AuthForm、未ログイン時リダイレクト） |
| `/dashboard` | `app/dashboard/page.tsx` | ✅ 予約カレンダー（要ログイン） |
| `/mypage` | `app/mypage/page.tsx` | ✅ マイページ（プロフィール・マイ予約タブ、要ログイン） |
| `/member/reservations` | `app/member/reservations/page.tsx` | ✅ 予約履歴一覧（フィルター、詳細・変更・キャンセル、要ログイン） |
| `/member/reservations/[id]` | `app/member/reservations/[id]/page.tsx` | ✅ 予約詳細・変更（要ログイン） |
| `/privacy-policy` | `app/privacy-policy/page.tsx` | ✅ プライバシーポリシー |
| `/member/profile` | `app/member/profile/page.tsx` | ✅ プロフィール（参照のみ、mypageからリンク） |

---

## 2. レイアウト・共通

| 項目 | 実装 |
|------|------|
| `layout.tsx` | ✅ `Footer` を全ページに表示。`EnvBanner`（Supabase 未設定時のみ表示） |
| `Footer` | ✅ 「運営会社 iPark Institute Co., Ltd.」「プライバシーポリシー」リンク（`/privacy-policy`） |
| `Header` | ✅ ロゴ（`/logo-white.svg`）、タイトル、タブ（トップ・予約カレンダー・マイページ）、ログアウト |
| `globals.css` | ✅ テーマ（primary-accent 等） |

※ トップページの二重フッターは解消済み（ページ内 `<footer>` を削除し、レイアウトの `Footer` のみ使用）。

---

## 3. 認証（Supabase Auth）

| 機能 | 実装場所 | 内容 |
|------|----------|------|
| ログイン | AuthForm | ✅ `signInWithPassword` |
| 新規登録 | AuthForm | ✅ `signUp`、`options.data` に full_name, full_name_kana, phone |
| プロフィール補完 | AuthForm | ✅ 登録後 `profiles` の有無を確認し、なければ `insert` |
| メール認証 | Supabase | 仕様上、Supabase Auth の標準機能に依存 |

---

## 4. プライバシーポリシー

| 機能 | 実装 |
|------|------|
| 専用ページ `/privacy-policy` | ✅ 湘南アイパーク (https://www.shonan-ipark.com/privacy-policy/) に基づく6項目、metadata、元ポリシーへのリンク |
| 新規登録時の同意 | ✅ チェックボックス（`privacyAccepted`）、未同意時は送信不可＋「プライバシーポリシーへの同意が必要です」、`/privacy-policy` へのリンク |
| フッターリンク | ✅ `Footer` から `/privacy-policy` へのリンク（全ページ） |

---

## 5. コート2面対応

| 項目 | 実装 |
|------|------|
| `getCourts()` | ✅ `courts` 取得（`is_active: true`） |
| `Court` 型 | ✅ `id`, `name`, `display_name`, `is_active` |
| `Reservation` 型 | ✅ `court_id`, `court?`（JOIN 用） |
| `getReservationsByDate(date, courtId?)` | ✅ `court_id` でフィルター、`court:courts(*)` |
| `createReservation(..., courtId, ...)` | ✅ `court_id` を渡して挿入 |
| `updateReservation(..., courtId, ...)` | ✅ `court_id` を更新 |
| BookingCalendar | ✅ コート選択、**月曜始まり**の週表示、**枠を選択→「予約を確定」**。1日2枠・1週間（表示7日）2枠まで。選択の再押下でキャンセル。`selectionMode` 時は 1 枠選択＋再押下で解除、`onTimeSelect(null,null,null)` |
| 予約詳細 `[id]` | ✅ コート表示、変更時にコート選択・`BookingCalendar` に `selectedCourtId` |
| 予約一覧 | ✅ `reservation.court?.display_name` を表示 |

---

## 6. 予約ルール

| ルール | 実装 |
|--------|------|
| 土曜・日曜・祝日のみ | ✅ `dateUtils.isBookableDate` → `isWeekend` or `isHoliday`（2025年祝日リスト）、BookingCalendar で使用 |
| 9:00〜17:00、1時間単位 | ✅ `dateUtils.generateTimeSlots()`（9〜16時）、BookingCalendar |
| 1日2枠・1週間2枠 | ✅ 選択時に 1 日 2 枠まで（既存予約＋選択数を考慮）、表示 7 日で合計 2 枠まで。枠選択はトグル（再押下でキャンセル）。「予約を確定」で一括作成。DB の `check_daily_limit` も継続。 |
| 1日2時間まで（DB） | ✅ DB の `check_daily_limit` トリガー（同一コート・同日）。クライアント側は上記の 1 日 2 枠で整合。 |
| 前日までキャンセル可能（当日は不可） | ✅ `canModify(bookingDate)`: `date > tomorrow`。mypage、`member/reservations`、`member/reservations/[id]` で使用し、キャンセル・変更ボタンの表示を制御 |

---

## 7. マイページ・予約管理

| 機能 | 実装 |
|------|------|
| プロフィール表示・編集 | ✅ mypage のプロフィールタブ（`getProfile`, `updateProfile`）、氏名・カナ・電話・メール（メールは編集不可） |
| 予約一覧（mypage） | ✅ マイ予約タブ、今後の予約／過去の予約、`/member/reservations/[id]` へのリンク、キャンセル（`canModify` で制御） |
| 予約一覧（/member/reservations） | ✅ フィルター（すべて・今月・来月・過去）、詳細・変更・キャンセル（`canModify`）、コート名表示 |
| 予約詳細・変更 | ✅ 日付・コート・時間表示、`?edit=true` で変更モード、`BookingCalendar` で再選択、`updateReservation` |
| キャンセル | ✅ `cancelReservation`。mypage と `/member/reservations` の両方で利用、`canModify` で制御 |

---

## 8. UI・その他

| 項目 | 実装 |
|------|------|
| ヘッダー | ✅ `bg-primary-accent`、`/logo-white.svg`、白文字、ログアウト・タブ |
| 新規登録の入力例・プレースホルダー | ✅ お名前等は初期値で例を表示（グレー）、フォーカスでクリア。プレースホルダーは `placeholder:text-outline` で統一。フィールド先頭のアイコンはなし（AuthForm） |
| 静的アセット | ✅ `public/logo-white.svg` あり |

---

## 9. Supabase / 環境変数

| 項目 | 内容 |
|------|------|
| `supabase.ts` | ✅ `createClient`、`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`。未設定時は `console.error` でログ、`EnvBanner` で画面上部に警告表示 |
| 想定テーブル | `profiles`, `reservations`, `courts`（`doc/02_database_setup.sql`, `doc/03_reservations_update_policy.sql`, `doc/05_database_update_for_courts.sql` 等を参照） |

---

## 10. 注意・要確認

1. **`/member/profile`**  
   mypage のプロフィールタブから「詳細編集ページへ」で `/member/profile` にリンク済み。

2. **予約変更の RLS**  
   予約変更を動かすには `doc/03_reservations_update_policy.sql` を Supabase で実行し、`Users can update own reservations` ポリシーを追加すること。

---

## 11. 未実装（仕様で除外済みのもの）

- 予約完了・変更・キャンセル・リマインド等のメール送信（Supabase Auth の認証メール以外）
- 決済・有料機能
- ゲスト予約（会員登録なしでの予約）

---

## 12. メール送付されないことの注意表示

予約の完了・変更・キャンセル時にメールは送信されないため、以下の画面に注意文を表示している。

| 画面 | 注意文 |
|------|--------|
| 予約カレンダー（dashboard） | 予約の完了・変更・キャンセル時にメール通知は送信されません。内容はマイページ・予約履歴でご確認ください。 |
| 予約履歴 | 予約の完了・変更・キャンセル時にメール通知は送信されません。 |
| 予約詳細（詳細表示） | 予約の変更・キャンセル時にメール通知は送信されません。 |
| 予約詳細（変更モード） | 変更確定後もメール通知は送信されません。予約履歴でご確認ください。 |
| マイページ（マイ予約タブ） | 予約の完了・変更・キャンセル時にメール通知は送信されません。内容は予約履歴でご確認ください。 |

---

以上、実装状況の確認結果です。
