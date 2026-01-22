"use client";

import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);

  // メール確認・パスワードリセットメールのリンクから戻ってきた場合を処理
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.replace("#", "") || "";
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    
    // パスワードリセット（type=recovery）
    if (type === "recovery" && access_token && refresh_token) {
      setRecovering(true);
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(() => {
          setShowSetPassword(true);
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        })
        .catch((err: unknown) => {
          console.error("recovery setSession:", err);
          setSetPasswordError("セッションの復元に失敗しました。リンクの有効期限が切れている可能性があります。");
          setRecovering(false);
        });
    }
    
    // メール確認（type=signup）
    if (type === "signup" && access_token && refresh_token) {
      setRecovering(true);
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(async () => {
          // セッション設定後、ダッシュボードへリダイレクト
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          router.push("/dashboard");
        })
        .catch((err: unknown) => {
          console.error("signup setSession:", err);
          setSetPasswordError("メール確認に失敗しました。リンクの有効期限が切れている可能性があります。");
          setRecovering(false);
        });
    }
    
    // メールアドレス変更確認（type=email_change）
    if (type === "email_change" && access_token && refresh_token) {
      setRecovering(true);
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(async () => {
          // セッション設定後、profilesテーブルのemailも更新
          try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (currentUser && currentUser.email) {
              const { updateProfile } = await import("@/lib/supabase");
              await updateProfile(currentUser.id, {
                email: currentUser.email,
              });
            }
          } catch (err) {
            console.error("Failed to update profile email:", err);
          }
          // プロフィールページへリダイレクト
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          router.push("/member/profile");
        })
        .catch((err: unknown) => {
          console.error("email_change setSession:", err);
          setSetPasswordError("メールアドレス変更の確認に失敗しました。リンクの有効期限が切れている可能性があります。");
          setRecovering(false);
        });
    }
  }, [router]);

  // 既にログインしており、パスワード設定不要な場合はダッシュボードへ（recovery 処理中は待機）
  useEffect(() => {
    if (showSetPassword || recovering) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, [router, showSetPassword, recovering]);

  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("newPassword") as HTMLInputElement)?.value;
    const confirm = (form.elements.namedItem("confirmPassword") as HTMLInputElement)?.value;
    if (!password || password.length < 6) {
      setSetPasswordError("パスワードは6文字以上で入力してください。");
      return;
    }
    if (password !== confirm) {
      setSetPasswordError("パスワードが一致しません。");
      return;
    }
    setSetPasswordLoading(true);
    setSetPasswordError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (err: any) {
      setSetPasswordError(err.message || "パスワードの更新に失敗しました。");
    } finally {
      setSetPasswordLoading(false);
    }
  };

  if (showSetPassword) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="card">
              <h1 className="text-xl font-bold text-primary mb-2">新しいパスワードを設定</h1>
              <p className="text-sm text-on-background/70 mb-6">新しいパスワードを入力してください。</p>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2">新しいパスワード</label>
                  <input type="password" name="newPassword" className="input" placeholder="••••••••" required minLength={6} autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2">パスワード（確認）</label>
                  <input type="password" name="confirmPassword" className="input" placeholder="••••••••" required minLength={6} autoComplete="new-password" />
                </div>
                {setPasswordError && (
                  <div className="bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm">{setPasswordError}</div>
                )}
                <button type="submit" disabled={setPasswordLoading} className="btn-primary w-full">
                  {setPasswordLoading ? "設定中..." : "パスワードを設定"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {setPasswordError && !showSetPassword && (
            <div className="mb-4 bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm">
              {setPasswordError}
            </div>
          )}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              テニスコート予約
            </h1>
            <p className="text-on-background/70">
              ログインまたは新規登録して予約を開始
            </p>
          </div>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
