"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { type Reservation } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { Calendar, Clock, Edit, Save, X } from "lucide-react";
import BookingCalendar from "@/components/BookingCalendar";

export default function ReservationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const reservationId = params.id as string;
  const isEditMode = searchParams.get("edit") === "true";

  const [user, setUser] = useState<any>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(isEditMode);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<{ start: string; end: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReservation = useCallback(async () => {
    try {
      setLoading(true);
      const { getReservationById } = await import("@/lib/supabase");
      const data = await getReservationById(reservationId);
      setReservation(data);
      setSelectedDate(data.booking_date);
    } catch (error) {
      console.error("Failed to load reservation:", error);
      setError("予約情報の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        loadReservation();
      }
    });
  }, [router, reservationId, loadReservation]);

  const canModify = (bookingDate: string) => {
    const date = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const handleUpdate = async () => {
    if (!reservation || !selectedTime || !user) return;

    try {
      setSaving(true);
      setError(null);

      const { updateReservation } = await import("@/lib/supabase");
      await updateReservation(
        reservation.id,
        selectedDate,
        selectedTime.start,
        selectedTime.end
      );

      router.push("/member/reservations");
    } catch (error: any) {
      setError(error.message || "予約の変更に失敗しました");
    } finally {
      setSaving(false);
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

  if (!reservation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="card text-center py-12">
            <p className="text-on-background/70 mb-4">予約が見つかりません</p>
            <button onClick={() => router.push("/member/reservations")} className="btn-primary">
              予約履歴に戻る
            </button>
          </div>
        </main>
      </div>
    );
  }

  const canModifyReservation = canModify(reservation.booking_date);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">予約詳細</h2>
          {canModifyReservation && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              予約を変更
            </button>
          )}
        </div>

        {error && (
          <div className="card bg-highlight/10 border border-highlight text-highlight mb-6">
            {error}
          </div>
        )}

        {!editing ? (
          /* 詳細表示モード */
          <div className="card space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold text-primary">
                {formatDate(reservation.booking_date)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-on-background/70">
              <Clock className="w-5 h-5" />
              <span className="text-lg">
                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
              </span>
            </div>
            {(reservation as any).reservation_number && (
              <div className="pt-4 border-t border-outline/20">
                <span className="text-sm text-on-background/60">予約番号:</span>
                <p className="font-mono text-lg font-bold text-primary">
                  {(reservation as any).reservation_number}
                </p>
              </div>
            )}
            <div className="pt-4 border-t border-outline/20">
              <span className="text-sm text-on-background/60">作成日時:</span>
              <p className="text-on-background/80">
                {new Date(reservation.created_at).toLocaleString("ja-JP")}
              </p>
            </div>
            {!canModifyReservation && (
              <div className="pt-4 border-t border-outline/20">
                <p className="text-sm text-on-background/60">
                  当日以降の予約は変更・キャンセルできません
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 変更モード */
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-primary mb-4">予約日時を変更</h3>
              <div className="mb-4">
                <p className="text-sm text-on-background/60 mb-2">現在の予約:</p>
                <p className="font-medium">
                  {formatDate(reservation.booking_date)} {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-on-background/60 mb-2">新しい予約:</p>
                {selectedTime ? (
                  <p className="font-medium text-primary-accent">
                    {formatDate(selectedDate)} {formatTime(selectedTime.start)} - {formatTime(selectedTime.end)}
                  </p>
                ) : (
                  <p className="text-on-background/60">日時を選択してください</p>
                )}
              </div>
            </div>

            <div className="card">
              <BookingCalendar
                userId={user?.id}
                selectionMode={true}
                onTimeSelect={(date, start, end) => {
                  setSelectedDate(date);
                  setSelectedTime({ start, end });
                }}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleUpdate}
                disabled={!selectedTime || saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "変更中..." : "変更を確定"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setSelectedTime(null);
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                キャンセル
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
