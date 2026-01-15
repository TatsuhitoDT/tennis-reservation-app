"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserReservations, cancelReservation, type Reservation } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { Calendar, Clock, X, Trash2 } from "lucide-react";

export default function MyBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        loadReservations(session.user.id);
      }
    });
  }, [router]);

  const loadReservations = async (userId: string) => {
    try {
      setLoading(true);
      const data = await getUserReservations(userId);
      setReservations(data);
    } catch (error) {
      console.error("Failed to load reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;

    try {
      setCancelling(reservationId);
      await cancelReservation(reservationId);
      if (user) {
        await loadReservations(user.id);
      }
    } catch (error: any) {
      alert(error.message || "キャンセルに失敗しました");
    } finally {
      setCancelling(null);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">マイ予約</h2>
          <p className="text-on-background/70">
            現在の予約一覧です。キャンセルは前日まで可能です。
          </p>
        </div>

        {reservations.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-outline mx-auto mb-4" />
            <p className="text-on-background/70 mb-4">予約がありません</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-primary"
            >
              予約カレンダーへ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => {
              const reservationDate = new Date(reservation.booking_date);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const canCancel = reservationDate > today;

              return (
                <div key={reservation.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-lg font-bold text-primary">
                          {formatDate(reservation.booking_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-on-background/70">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(reservation.start_time)} -{" "}
                          {formatTime(reservation.end_time)}
                        </span>
                      </div>
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        disabled={cancelling === reservation.id}
                        className="btn-danger flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {cancelling === reservation.id ? "処理中..." : "キャンセル"}
                      </button>
                    )}
                    {!canCancel && (
                      <div className="px-4 py-2 rounded-lg bg-outline/20 text-outline text-sm">
                        キャンセル不可
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
