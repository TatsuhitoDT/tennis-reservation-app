"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSent(false);

    try {
      const redirectTo =
        (typeof window !== "undefined" ? window.location.origin : "") + "/login";
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (err) throw err;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "送信に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="card">
          <h1 className="text-xl font-bold text-primary mb-2">
            パスワードをリセット
          </h1>
          <p className="text-sm text-on-background/70 mb-6">
            登録済みのメールアドレスを入力してください。リセット用のリンクをお送りします。
          </p>

          {sent ? (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-lg text-sm">
                リセット用のメールを送信しました。届いたリンクからパスワードを再設定してください。
              </div>
              <Link
                href="/login"
                className="block text-center text-primary-accent hover:underline font-medium"
              >
                ログインへ戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-background mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="example@company.com"
                  required
                />
              </div>
              {error && (
                <div className="bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "送信中..." : "送信する"}
              </button>
              <p className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-primary-accent hover:underline"
                >
                  ログインへ戻る
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
