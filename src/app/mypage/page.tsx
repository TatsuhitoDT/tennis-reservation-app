"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserReservations, type Reservation, type Profile } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { User, Calendar, Clock, Edit, ArrowRight, Calendar as CalendarIcon } from "lucide-react";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        loadProfile(session.user.id);
        loadReservations(session.user.id);
      }
    });
  }, [router]);

  const loadProfile = async (userId: string) => {
    try {
      const { getProfile } = await import("@/lib/supabase");
      const data = await getProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadReservations = async (userId: string) => {
    try {
      const data = await getUserReservations(userId);
      setReservations(data);
    } catch (error) {
      console.error("Failed to load reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center text-on-background/70">読み込み中...</div>
        </main>
      </div>
    );
  }

  const upcomingReservations = reservations
    .filter((r) => new Date(r.booking_date) >= new Date())
    .slice(0, 3);
  const thisMonthCount = reservations.filter((r) => {
    const date = new Date(r.booking_date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const nextReservation = upcomingReservations[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">マイページ</h2>
          <p className="text-on-background/70">
            プロフィール情報と予約状況を確認できます。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* プロフィール情報 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <User className="w-5 h-5" />
                プロフィール情報
              </h3>
              <button
                onClick={() => router.push("/member/profile")}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                編集
              </button>
            </div>
            {profile && (
              <div className="space-y-2 text-on-background/80">
                <div>
                  <span className="text-sm text-on-background/60">氏名:</span>
                  <p className="font-medium">{profile.full_name || "未設定"}</p>
                </div>
                {profile.email && (
                  <div>
                    <span className="text-sm text-on-background/60">メール:</span>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 予約状況サマリー */}
          <div className="card">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 mb-4">
              <CalendarIcon className="w-5 h-5" />
              予約状況サマリー
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-on-background/60">今月の予約数:</span>
                <p className="text-2xl font-bold text-primary">{thisMonthCount}件</p>
              </div>
              {nextReservation && (
                <div>
                  <span className="text-sm text-on-background/60">次の予約:</span>
                  <p className="font-medium">
                    {formatDate(nextReservation.booking_date)} {formatTime(nextReservation.start_time)}-{formatTime(nextReservation.end_time)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 最近の予約 */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              <Clock className="w-5 h-5" />
              最近の予約
            </h3>
            <button
              onClick={() => router.push("/member/reservations")}
              className="text-primary-accent hover:text-primary-accent/80 flex items-center gap-1 text-sm"
            >
              すべて見る
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingReservations.length === 0 ? (
            <div className="text-center py-8 text-on-background/70">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-outline" />
              <p className="mb-4">予約がありません</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-primary"
              >
                予約カレンダーへ
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-surface rounded-lg border border-outline/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-medium text-primary">
                        {formatDate(reservation.booking_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-on-background/70 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/member/reservations/${reservation.id}`)}
                      className="btn-secondary text-sm"
                    >
                      詳細
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="card hover:shadow-lg transition-shadow text-left"
          >
            <CalendarIcon className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-bold text-primary mb-1">予約カレンダー</h4>
            <p className="text-sm text-on-background/70">新しい予約を作成</p>
          </button>
          <button
            onClick={() => router.push("/member/reservations")}
            className="card hover:shadow-lg transition-shadow text-left"
          >
            <Clock className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-bold text-primary mb-1">予約履歴</h4>
            <p className="text-sm text-on-background/70">すべての予約を確認</p>
          </button>
          <button
            onClick={() => router.push("/member/profile")}
            className="card hover:shadow-lg transition-shadow text-left"
          >
            <User className="w-6 h-6 text-primary mb-2" />
            <h4 className="font-bold text-primary mb-1">プロフィール編集</h4>
            <p className="text-sm text-on-background/70">情報を変更</p>
          </button>
        </div>
      </main>
    </div>
  );
}
