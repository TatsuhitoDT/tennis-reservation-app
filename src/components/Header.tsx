"use client";

import { Calendar, LogOut, User, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/mypage") {
      return pathname === "/mypage" || pathname.startsWith("/member");
    }
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header className="bg-primary text-on-primary shadow-lg">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* ロゴとログアウト */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <h1 className="text-xl font-bold">テニスコート予約</h1>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary-light transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          )}
        </div>

        {/* タブナビゲーション */}
        {user && (
          <nav className="flex gap-2 border-b border-primary-light/30">
            <button
              onClick={() => router.push("/dashboard")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                isActive("/dashboard")
                  ? "border-on-primary text-on-primary"
                  : "border-transparent text-on-primary/70 hover:text-on-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                予約カレンダー
              </div>
            </button>
            <button
              onClick={() => router.push("/mypage")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                isActive("/mypage")
                  ? "border-on-primary text-on-primary"
                  : "border-transparent text-on-primary/70 hover:text-on-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                マイページ
              </div>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
