"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { LogIn, UserPlus, Mail, Lock, Phone } from "lucide-react";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
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
      setError(err.message || "エラーが発生しました");
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
              setFullName("山田 太郎");
              setFullNameKana("ヤマダ タロウ");
              setPhone("090-1234-5678");
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
                <div className="relative">
                  {(!focusedField || focusedField !== "fullName") && fullName === "山田 太郎" && (
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-outline" />
                  )}
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
                    className={`input ${(!focusedField || focusedField !== "fullName") && fullName === "山田 太郎" ? "pl-10" : "pl-3"}`}
                    placeholder="山田 太郎"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-background mb-2">
                  お名前（カナ） <span className="text-highlight">*</span>
                </label>
                <div className="relative">
                  {(!focusedField || focusedField !== "fullNameKana") && fullNameKana === "ヤマダ タロウ" && (
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-outline" />
                  )}
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
                    className={`input ${(!focusedField || focusedField !== "fullNameKana") && fullNameKana === "ヤマダ タロウ" ? "pl-10" : "pl-3"}`}
                    placeholder="ヤマダ タロウ"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-background mb-2">
                  電話番号 <span className="text-highlight">*</span>
                </label>
                <div className="relative">
                  {(!focusedField || focusedField !== "phone") && phone === "090-1234-5678" && (
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-outline" />
                  )}
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
                    className={`input ${(!focusedField || focusedField !== "phone") && phone === "090-1234-5678" ? "pl-10" : "pl-3"}`}
                    placeholder="090-1234-5678"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-on-background mb-2">
              メールアドレス
            </label>
            <div className="relative">
              {(!focusedField || focusedField !== "email") && !email && (
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-outline" />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className={`input ${(!focusedField || focusedField !== "email") && !email ? "pl-10" : "pl-3"}`}
                placeholder="example@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-background mb-2">
              パスワード
            </label>
            <div className="relative">
              {(!focusedField || focusedField !== "password") && !password && (
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-outline" />
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className={`input ${(!focusedField || focusedField !== "password") && !password ? "pl-10" : "pl-3"}`}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

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
