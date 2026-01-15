"use client";

import { Calendar, LogOut, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
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

  return (
    <header className="bg-primary text-on-primary py-4 px-6 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8" />
          <h1 className="text-xl font-bold">テニスコート予約</h1>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/my-bookings")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary-light transition-colors text-sm"
            >
              <User className="w-4 h-4" />
              マイ予約
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-primary-light transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
