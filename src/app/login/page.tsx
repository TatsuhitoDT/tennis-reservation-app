"use client";

import AuthForm from "@/components/AuthForm";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // 既にログインしている場合はダッシュボードへリダイレクト
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
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
  );
}
