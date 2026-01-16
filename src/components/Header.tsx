"use client";

import Image from "next/image";
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
    if (path === "/") {
      return pathname === "/";
    }
    if (path === "/mypage") {
      return pathname === "/mypage" || pathname.startsWith("/member");
    }
    return pathname === path || pathname.startsWith(path);
  };

  return (
    <header className="bg-white text-on-background shadow-lg border-b border-outline/20">
      <div className="max-w-6xl mx-auto px-6 py-4">
        {/* ロゴとログアウト */}
        <div className="flex items-center justify-center mb-4 relative">
          <div className="flex items-center gap-3">
            <div className="relative w-32 h-16">
              <Image
                src="/ipark_logo.png"
                alt="iPark Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-xl font-bold text-primary">テニスコート予約</h1>
          </div>
          
          {user && (
            <button
              onClick={handleLogout}
              className="absolute right-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-light transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          )}

        </div>

        {/* タブナビゲーション */}
        {user && (
          <nav className="flex gap-2 border-b border-outline/20 justify-center">
            <button
              onClick={() => router.push("/")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                isActive("/")
                  ? "border-primary text-primary"
                  : "border-transparent text-on-background/70 hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                トップページ
              </div>
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                isActive("/dashboard")
                  ? "border-primary text-primary"
                  : "border-transparent text-on-background/70 hover:text-primary"
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
                  ? "border-primary text-primary"
                  : "border-transparent text-on-background/70 hover:text-primary"
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
