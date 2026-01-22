"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import BookingCalendar from "@/components/BookingCalendar";
import { NOTICE_ITEMS } from "@/lib/constants";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-on-background/70">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-2">
            予約カレンダー
          </h2>
          <p className="text-on-background/70">
            土曜・日曜・祝日のみ予約可能です。1日2枠・1週間（表示の7日）で2枠まで。枠を選んで「予約を確定」を押してください。選択の解除は枠を再クリックしてください。
          </p>
          <div className="mt-3 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 text-left">
            <h3 className="text-sm font-bold text-primary mb-2">注意事項</h3>
            <ul className="space-y-1 text-sm text-primary">
              {NOTICE_ITEMS.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-accent">・</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-sm text-primary font-medium">
            ※予約の完了・変更・キャンセル時にメール通知は送信されません。内容はマイページ・予約履歴でご確認ください。
          </p>
        </div>
        <BookingCalendar userId={user?.id} />
      </main>
    </div>
  );
}
