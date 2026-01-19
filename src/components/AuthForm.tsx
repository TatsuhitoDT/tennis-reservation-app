"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setAlreadyRegisteredEmail(null);

    try {
      if (mode === "signup") {
        if (!privacyAccepted) {
          setError("プライバシーポリシーへの同意が必要です");
          setLoading(false);
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              full_name_kana: fullNameKana,
              phone: phone,
            },
          },
        });

        // 登録済みメール: エラー「User already registered」または identities が空
        const isAlreadyRegistered =
          (signUpError?.message && /already|registered|既に登録/i.test(signUpError.message)) ||
          (data?.user && (!data.user.identities || data.user.identities.length === 0));

        if (isAlreadyRegistered) {
          setAlreadyRegisteredEmail(email);
          setError(null);
          setMessage(null);
          setLoading(false);
          return;
        }

        if (signUpError) throw signUpError;

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
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // ログイン成功時はページをリロードしてダッシュボードへ
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      const msg = err?.message || "エラーが発生しました";
      if (mode === "signup" && /Email address .+ is invalid/i.test(msg)) {
        setError("登録済のメールアドレスです。パスワードが不明の場合はリセットしてください。");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
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

          {error && (
            <div className="bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm">
              {error}
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
