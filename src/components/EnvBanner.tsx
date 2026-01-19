"use client";

import { isSupabaseConfigured } from "@/lib/supabase";

export default function EnvBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="w-full bg-amber-500/90 text-black text-center py-2 px-4 text-sm">
      Supabase の環境変数が未設定です。ログイン・予約は利用できません。
      <span className="ml-2 font-medium">
        Vercel → Settings → Environment Variables で NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定し、Redeploy してください。
      </span>
    </div>
  );
}
