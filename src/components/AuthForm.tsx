"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { EMAIL_IPARK_PORTAL_NOTICE } from "@/lib/constants";

type AuthMode = "login" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("山田 太郎");
  const [fullNameKana, setFullNameKana] = useState("ヤマダ タロウ");
  const [phone, setPhone] = useState("090-1234-5678");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyRegisteredEmail, setAlreadyRegisteredEmail] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState<string | null>(null);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setAlreadyRegisteredEmail(null);
    setEmailNotConfirmed(null);

    try {
      if (mode === "signup") {
        if (!privacyAccepted) {
          setError("プライバシーポリシーへの同意が必要です");
          setLoading(false);
          return;
        }
        // メール確認後のリダイレクト先
        // SupabaseのRedirect URLsに設定されている必要がある
        const redirectTo =
          process.env.NEXT_PUBLIC_APP_URL 
            ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
            : (typeof window !== "undefined" ? window.location.origin : "") + "/login";
        console.log("[新規登録] 開始:", email);
        console.log("[新規登録] リダイレクト先:", redirectTo);
        
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              full_name: fullName,
              full_name_kana: fullNameKana,
              phone: phone,
            },
          },
        });

        console.log("[新規登録] レスポンス:", { 
          user: data?.user?.id, 
          session: !!data?.session, 
          error: signUpError?.message 
        });

        // 登録済みメール: エラー「User already registered」「Email address ... is invalid」または identities が空
        const isAlreadyRegistered =
          (signUpError?.message && /already|registered|既に登録/i.test(signUpError.message)) ||
          (signUpError?.message && /Email address .+ is invalid/i.test(signUpError.message)) ||
          (signUpError?.message && /A user with this email address has already been registered/i.test(signUpError.message)) ||
          (data?.user && (!data.user.identities || data.user.identities.length === 0));

        if (isAlreadyRegistered) {
          setAlreadyRegisteredEmail(email);
          setError(null);
          setMessage(null);
          setLoading(false);
          return;
        }

        if (signUpError) {
          // エラーメッセージを日本語に変換
          let errorMessage = signUpError.message;
          if (/A user with this email address has already been registered/i.test(errorMessage)) {
            errorMessage = "このメールアドレスは既に登録されています。";
          } else if (/already|registered/i.test(errorMessage)) {
            errorMessage = "このメールアドレスは既に登録されています。";
          } else if (/error.*sending.*confirmation.*email|Error sending confirmation email/i.test(errorMessage)) {
            errorMessage = "認証メールの送信に失敗しました。Supabaseのメール設定を確認してください。";
          } else if (/smtp|SMTP/i.test(errorMessage)) {
            errorMessage = "メールサーバーの設定に問題があります。管理者にお問い合わせください。";
          } else if (/template|Template/i.test(errorMessage)) {
            errorMessage = "メールテンプレートの設定に問題があります。Supabaseの設定を確認してください。";
          }
          throw new Error(errorMessage);
        }

        if (data.user) {
          // プロフィールが作成されているか確認し、なければ作成
          try {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", data.user.id)
              .single();

            // プロフィールが存在しない場合は作成
            if (profileError || !profileData) {
              const { error: insertError } = await supabase
                .from("profiles")
                .insert({
                  id: data.user.id,
                  full_name: fullName,
                  full_name_kana: fullNameKana,
                  email: email,
                  phone: phone,
                });

              if (insertError) {
                console.error("プロフィール作成エラー:", insertError);
                // エラーがあっても続行（トリガーが後で作成する可能性がある）
              }
            }
          } catch (err) {
            console.error("プロフィール確認エラー:", err);
            // エラーがあっても続行
          }

          setMessage("アカウントを作成しました。メールを確認してください。");
          // 認証メール再送信のためのメールアドレスを保存
          setEmailNotConfirmed(email);
        }
      } else {
        const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // ログイン失敗時、削除済みユーザーまたはメール未認証の可能性をチェック
        if (signInError) {
          // メールアドレスでprofilesテーブルを検索（先に確認）
          let profileExists = false;
          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", email)
              .single();
            profileExists = !!profileData;
          } catch (err) {
            // プロフィールが存在しない場合も続行
            console.error("プロフィール確認エラー:", err);
          }

          // メール未認証エラーのチェック
          if (signInError.message && /email.*not.*confirm|Email not confirmed/i.test(signInError.message)) {
            if (profileExists) {
              // プロフィールが存在する場合、メール未認証の可能性が高い
              setEmailNotConfirmed(email);
              setError(null);
              setMessage(null);
              setLoading(false);
              return;
            }
          }

          // profilesに存在しない場合、削除済みユーザーの可能性
          if (!profileExists) {
            // auth.usersに存在するか確認（Admin APIは使えないので、別の方法で確認）
            // ログインエラーが「Invalid login credentials」の場合、auth.usersに存在する可能性がある
            if (signInError.message && /invalid.*credentials/i.test(signInError.message)) {
              setError("このアカウントは登録が完了していません。新規登録を行ってください。");
              setLoading(false);
              return;
            }
          }
          
          // 通常のログインエラー
          throw signInError;
        }

        // ログイン成功後、プロフィールの存在確認
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", user.id)
              .single();

            // プロフィールが存在しない場合（削除済みユーザー）
            if (profileError || !profileData) {
              // ログアウト
              await supabase.auth.signOut();
              setError("このアカウントは登録が完了していません。新規登録を行ってください。");
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("プロフィール確認エラー:", err);
          // エラーがあっても続行（通常のログインフロー）
        }

        // ログイン成功時はページをリロードしてダッシュボードへ
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      // エラーメッセージを日本語に変換
      let errorMessage = err?.message || "エラーが発生しました";
      
      // メール未認証エラーの場合、プロフィールの存在を確認して再送信ボタンを表示
      if (/email.*not.*confirm|Email not confirmed/i.test(errorMessage)) {
        // プロフィールが存在するか確認
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single();

          if (profileData) {
            // プロフィールが存在する場合、メール未認証の可能性が高い
            setEmailNotConfirmed(email);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (profileErr) {
          console.error("プロフィール確認エラー:", profileErr);
        }
        // プロフィールが存在しない場合、通常のエラーメッセージを表示
        errorMessage = "メールアドレスが確認されていません。認証メールを再送信してください。";
      } else if (/error.*sending.*confirmation.*email|Error sending confirmation email/i.test(errorMessage)) {
        errorMessage = "認証メールの送信に失敗しました。Supabaseのメール設定を確認してください。";
      } else if (/A user with this email address has already been registered/i.test(errorMessage)) {
        errorMessage = "このメールアドレスは既に登録されています。";
      } else if (/already been registered|already registered/i.test(errorMessage)) {
        errorMessage = "このメールアドレスは既に登録されています。";
      } else if (/smtp|SMTP/i.test(errorMessage)) {
        errorMessage = "メールサーバーの設定に問題があります。管理者にお問い合わせください。";
      } else if (/template|Template/i.test(errorMessage)) {
        errorMessage = "メールテンプレートの設定に問題があります。Supabaseの設定を確認してください。";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 認証メールを再送信
  const handleResendConfirmation = async (emailToResend?: string) => {
    const targetEmail = emailToResend || emailNotConfirmed;
    if (!targetEmail) {
      setError("メールアドレスが指定されていません。");
      return;
    }

    setResendingConfirmation(true);
    setError(null);
    setMessage(null);

    try {
      const redirectTo =
        process.env.NEXT_PUBLIC_APP_URL 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
          : (typeof window !== "undefined" ? window.location.origin : "") + "/login";
      
      console.log("[認証メール再送信] 開始:", targetEmail);
      console.log("[認証メール再送信] リダイレクト先:", redirectTo);
      
      // Supabaseのresendメソッドを使用して認証メールを再送信
      // このメソッドは即座にメール送信リクエストをSupabaseに送信します
      const { data, error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      console.log("[認証メール再送信] レスポンス:", { data, error: resendError });

      if (resendError) {
        console.error("[認証メール再送信] エラー:", resendError);
        throw resendError;
      }

      // メール送信リクエストは成功しました
      // メールは通常数秒〜数分以内に届きます
      console.log("[認証メール再送信] 成功");
      setMessage("認証メールを送信しました。通常、数秒〜数分以内にメールが届きます。メールボックス（迷惑メールフォルダも含む）をご確認ください。届かない場合は、Supabaseの設定を確認してください。");
      if (emailNotConfirmed) {
        setEmailNotConfirmed(null);
      }
    } catch (err: any) {
      console.error("[認証メール再送信] 例外:", err);
      // エラーメッセージを日本語に変換
      let errorMessage = err?.message || "認証メールの再送信に失敗しました";
      
      // 英語のエラーメッセージを日本語に変換
      if (/error.*sending.*confirmation.*email|Error sending confirmation email/i.test(errorMessage)) {
        errorMessage = "認証メールの送信に失敗しました。Supabaseのメール設定を確認してください。";
      } else if (/email.*not.*found|Email not found/i.test(errorMessage)) {
        errorMessage = "このメールアドレスは登録されていません。新規登録を行ってください。";
      } else if (/rate.*limit|too many requests/i.test(errorMessage)) {
        errorMessage = "送信回数が多すぎます。しばらく待ってから再度お試しください。";
      } else if (/email.*disabled|Email disabled/i.test(errorMessage)) {
        errorMessage = "メール送信機能が無効になっています。管理者にお問い合わせください。";
      } else if (/smtp|SMTP/i.test(errorMessage)) {
        errorMessage = "メールサーバーの設定に問題があります。管理者にお問い合わせください。";
      } else if (/template|Template/i.test(errorMessage)) {
        errorMessage = "メールテンプレートの設定に問題があります。Supabaseの設定を確認してください。";
      }
      
      setError(errorMessage);
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
              setMessage(null);
              setAlreadyRegisteredEmail(null);
              setEmailNotConfirmed(null);
              setFullName("山田 太郎");
              setFullNameKana("ヤマダ タロウ");
              setPhone("090-1234-5678");
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "login"
                ? "bg-primary text-on-primary"
                : "bg-surface text-on-background/70 hover:bg-surface/80"
            }`}
          >
            <LogIn className="w-4 h-4 inline mr-2" />
            ログイン
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setError(null);
              setMessage(null);
              setAlreadyRegisteredEmail(null);
              setEmailNotConfirmed(null);
              setFullName("山田 太郎");
              setFullNameKana("ヤマダ タロウ");
              setPhone("090-1234-5678");
              setPrivacyAccepted(false);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "signup"
                ? "bg-primary text-on-primary"
                : "bg-surface text-on-background/70 hover:bg-surface/80"
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            新規登録
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-on-background mb-2">
                  お名前 <span className="text-highlight">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    if (fullName === "山田 太郎") {
                      setFullName("");
                    }
                    setFullName(e.target.value);
                  }}
                  onFocus={(e) => {
                    setFocusedField("fullName");
                    if (e.target.value === "山田 太郎") {
                      setFullName("");
                    }
                  }}
                  onBlur={() => setFocusedField(null)}
                  className={`input ${fullName === "山田 太郎" ? "text-outline" : ""}`}
                  placeholder="山田 太郎"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-background mb-2">
                  お名前（カナ） <span className="text-highlight">*</span>
                </label>
                <input
                  type="text"
                  value={fullNameKana}
                  onChange={(e) => {
                    if (fullNameKana === "ヤマダ タロウ") {
                      setFullNameKana("");
                    }
                    setFullNameKana(e.target.value);
                  }}
                  onFocus={(e) => {
                    setFocusedField("fullNameKana");
                    if (e.target.value === "ヤマダ タロウ") {
                      setFullNameKana("");
                    }
                  }}
                  onBlur={() => setFocusedField(null)}
                  className={`input ${fullNameKana === "ヤマダ タロウ" ? "text-outline" : ""}`}
                  placeholder="ヤマダ タロウ"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-background mb-2">
                  電話番号 <span className="text-highlight">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    if (phone === "090-1234-5678") {
                      setPhone("");
                    }
                    setPhone(e.target.value);
                  }}
                  onFocus={(e) => {
                    setFocusedField("phone");
                    if (e.target.value === "090-1234-5678") {
                      setPhone("");
                    }
                  }}
                  onBlur={() => setFocusedField(null)}
                  className={`input ${phone === "090-1234-5678" ? "text-outline" : ""}`}
                  placeholder="090-1234-5678"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-on-background mb-2">
              メールアドレス
            </label>
            <p className="text-sm text-on-background/70 mb-1.5">
              {EMAIL_IPARK_PORTAL_NOTICE}
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="input"
              placeholder="example@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-background mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
            />
            {mode === "login" && (
              <p className="mt-1.5 text-right">
                <Link
                  href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
                  className="text-sm text-primary-accent hover:underline"
                >
                  パスワードをお忘れの方
                </Link>
              </p>
            )}
          </div>

          {mode === "signup" && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-outline/30 bg-surface/50">
              <input
                type="checkbox"
                id="privacy-accept"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 text-primary-accent border-outline rounded focus:ring-primary-accent focus:ring-2 flex-shrink-0"
                required
              />
              <label htmlFor="privacy-accept" className="text-sm text-on-background cursor-pointer">
                <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary-accent hover:underline font-medium">
                  プライバシーポリシー
                </Link>
                に同意します <span className="text-highlight">*</span>
              </label>
            </div>
          )}

          {alreadyRegisteredEmail && (
            <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg text-sm space-y-2">
              <p>このメールアドレスは既に登録されています。「ログイン」タブからログインするか、<Link href={`/forgot-password?email=${encodeURIComponent(alreadyRegisteredEmail)}`} className="text-primary-accent font-medium hover:underline">パスワードをリセット</Link>から再設定してください。</p>
              <button
                type="button"
                onClick={() => { setMode("login"); setAlreadyRegisteredEmail(null); }}
                className="text-sm font-medium text-primary-accent hover:underline"
              >
                ログインへ
              </button>
            </div>
          )}

          {emailNotConfirmed && (
            <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg text-sm space-y-2">
              <p>メールアドレスが確認されていません。認証メールを再送信してください。</p>
              <button
                type="button"
                onClick={() => handleResendConfirmation()}
                disabled={resendingConfirmation}
                className="btn-primary text-sm"
              >
                {resendingConfirmation ? "送信中..." : "認証メールを再送信"}
              </button>
              <button
                type="button"
                onClick={() => { setEmailNotConfirmed(null); setError(null); }}
                className="text-sm text-primary-accent hover:underline ml-2"
              >
                キャンセル
              </button>
            </div>
          )}

          {error && (
            <div className="bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm space-y-2">
              <p>{error}</p>
              {/メールアドレスが確認されていません|認証メールを再送信/i.test(error) && email && (
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    await handleResendConfirmation(email);
                  }}
                  disabled={resendingConfirmation}
                  className="btn-primary text-sm mt-2"
                >
                  {resendingConfirmation ? "送信中..." : "認証メールを再送信"}
                </button>
              )}
            </div>
          )}

          {message && (
            <div className="bg-primary-accent/10 border border-primary-accent text-primary-accent px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading
              ? "処理中..."
              : mode === "login"
              ? "ログイン"
              : "アカウント作成"}
          </button>
        </form>
      </div>
    </div>
  );
}
