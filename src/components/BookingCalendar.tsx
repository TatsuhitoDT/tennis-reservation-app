"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addWeeks, startOfWeek, addDays } from "date-fns";
import { ja } from "date-fns/locale/ja";
import {
  getReservationsByDate,
  createReservation,
  getCourts,
  type Reservation,
  type Court,
} from "@/lib/supabase";
import { isBookableDate, generateTimeSlots, formatTime } from "@/lib/dateUtils";
import { CheckCircle, XCircle } from "lucide-react";

interface BookingCalendarProps {
  userId: string;
  onTimeSelect?: (date: string | null, startTime: string | null, endTime: string | null, courtId?: string) => void;
  selectionMode?: boolean; // trueの場合、予約作成せずに選択のみ
  selectedCourtId?: string; // 選択中のコートID（選択モード時）
}

export default function BookingCalendar({ userId, onTimeSelect, selectionMode = false, selectedCourtId }: BookingCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [courts, setCourts] = useState<Court[]>([]);
  const [reservations, setReservations] = useState<Record<string, Reservation[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 月曜始まり
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  /** 選択中の枠（確定前）。通常モード時のみ使用。1日2枠・1週間2枠の制限あり。 */
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; time: string; courtId: string }[]>([]);

  // コート一覧を読み込む
  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtsData = await getCourts();
        setCourts(courtsData);
        if (courtsData.length > 0) {
          // 選択モードの場合はselectedCourtIdを使用、それ以外は最初のコートを選択
          const initialCourtId = selectedCourtId || courtsData[0].id;
          setSelectedCourt(initialCourtId);
        }
      } catch (err) {
        console.error("Failed to load courts:", err);
      }
    };
    loadCourts();
  }, [selectedCourtId]);

  const loadReservations = useCallback(async () => {
    if (!selectedCourt) return;
    
    const dates = weekDays.map((d) => format(d, "yyyy-MM-dd"));
    const allReservations: Record<string, Reservation[]> = {};

    for (const date of dates) {
      try {
        const res = await getReservationsByDate(date, selectedCourt);
        allReservations[date] = res;
      } catch (err) {
        console.error(`Failed to load reservations for ${date}:`, err);
        allReservations[date] = [];
      }
    }

    setReservations(allReservations);
  }, [weekDays, selectedCourt]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleTimeSlotClick = (dateStr: string, time: string) => {
    if (!isBookableDate(dateStr)) {
      setError("土曜・日曜・祝日のみ予約可能です");
      return;
    }
    if (!selectedCourt) {
      setError("コートを選択してください");
      return;
    }

    // --- 選択モード（予約変更など）: 1枠のみ選択、再押下でキャンセル ---
    if (selectionMode && onTimeSelect) {
      const already = selectedDate === dateStr && selectedTime === time;
      if (already) {
        setSelectedDate(null);
        setSelectedTime(null);
        onTimeSelect(null, null, null);
        setError(null);
        return;
      }
      setSelectedDate(dateStr);
      setSelectedTime(time);
      setError(null);
      const endTime = `${(parseInt(time.split(":")[0]) + 1).toString().padStart(2, "0")}:00`;
      onTimeSelect(dateStr, time, endTime, selectedCourt);
      return;
    }

    // --- 通常モード: 選択のトグル、1日2枠・1週間2枠の制限 ---
    const key = { date: dateStr, time, courtId: selectedCourt };
    const isIn = selectedSlots.some((s) => s.date === dateStr && s.time === time && s.courtId === selectedCourt);

    if (isIn) {
      // 再押下でキャンセル
      setSelectedSlots((prev) => prev.filter((s) => !(s.date === dateStr && s.time === time && s.courtId === selectedCourt)));
      setError(null);
      return;
    }

    if (isTimeSlotBooked(dateStr, time)) {
      setError("この枠はすでに予約済みです");
      return;
    }

    // 1日2枠: 既存予約の枠数 + 同日の選択数 < 2
    const existingSlots = Math.floor(getUserBookedMinutesForDate(dateStr) / 60);
    const selectedThatDay = selectedSlots.filter((s) => s.date === dateStr).length;
    if (existingSlots + selectedThatDay >= 2) {
      setError("1日につき2枠までです");
      return;
    }

    // 1週間2枠: 選択数 < 2
    if (selectedSlots.length >= 2) {
      setError("1週間（表示の7日以内）に2枠までです");
      return;
    }

    setSelectedSlots((prev) => [...prev, key]);
    setError(null);
  };

  /** 選択枠を一括で予約作成（通常モード時のみ） */
  const handleConfirmReservations = async () => {
    if (selectedSlots.length === 0) return;
    try {
      setLoading(true);
      setError(null);
      for (const s of selectedSlots) {
        const end = `${(parseInt(s.time.split(":")[0]) + 1).toString().padStart(2, "0")}:00`;
        await createReservation(userId, s.courtId, s.date, s.time, end);
      }
      await loadReservations();
      setSelectedSlots([]);
    } catch (err: any) {
      setError(err.message || "予約に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const isTimeSlotBooked = (date: string, time: string): boolean => {
    const dateReservations = reservations[date] || [];
    return dateReservations.some(
      (r) => r.start_time.substring(0, 5) === time
    );
  };

  /** 同一コート・同日のユーザー予約の合計分数（1日2時間制限用） */
  const getUserBookedMinutesForDate = (date: string): number => {
    const dateReservations = reservations[date] || [];
    const userReservations = dateReservations.filter((r) => r.user_id === userId);
    const toMinutes = (t: string) => {
      const [h, m] = (t.substring(0, 5) || "0:0").split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    return userReservations.reduce(
      (sum, r) => sum + (toMinutes(r.end_time) - toMinutes(r.start_time)),
      0
    );
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="card">
      {/* コート選択 */}
      {courts.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-on-background mb-2">
            コート選択
          </label>
          <div className="flex gap-2">
            {courts.map((court) => (
              <button
                key={court.id}
                onClick={() => {
                  setSelectedCourt(court.id);
                  setSelectedDate(null);
                  setSelectedTime(null);
                  setSelectedSlots([]); // コート切替時は選択をリセット
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCourt === court.id
                    ? "bg-primary text-on-primary"
                    : "bg-surface text-on-background/70 hover:bg-surface/80"
                }`}
              >
                {court.display_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 週ナビゲーション */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            setCurrentWeek(addWeeks(currentWeek, -1));
            if (!selectionMode) setSelectedSlots([]);
          }}
          className="px-4 py-2 rounded-lg hover:bg-surface transition-colors"
        >
          ← 前週
        </button>
        <h3 className="text-lg font-bold text-primary">
          {format(weekStart, "yyyy年M月d日", { locale: ja })} 〜
          {format(addDays(weekStart, 6), "M月d日", { locale: ja })}
        </h3>
        <button
          onClick={() => {
            setCurrentWeek(addWeeks(currentWeek, 1));
            if (!selectionMode) setSelectedSlots([]);
          }}
          className="px-4 py-2 rounded-lg hover:bg-surface transition-colors"
        >
          次週 →
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* カレンダー */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-on-background/70">
                時間
              </th>
              {weekDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const bookable = isBookableDate(day);
                return (
                  <th
                    key={dateStr}
                    className={`p-2 text-center text-sm font-medium ${
                      bookable ? "text-primary" : "text-outline"
                    }`}
                  >
                    <div>{format(day, "M/d", { locale: ja })}</div>
                    <div className="text-xs">
                      {format(day, "E", { locale: ja })}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-t border-outline/20">
                <td className="p-2 text-sm text-on-background/70">
                  {time} - {formatTime(`${(parseInt(time.split(":")[0]) + 1).toString().padStart(2, "0")}:00`)}
                </td>
                {weekDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const bookable = isBookableDate(day);
                  const booked = isTimeSlotBooked(dateStr, time);
                  const isSelected = selectionMode
                    ? selectedDate === dateStr && selectedTime === time
                    : selectedSlots.some((s) => s.date === dateStr && s.time === time && s.courtId === selectedCourt);

                  return (
                    <td key={dateStr} className="p-2">
                      {bookable ? (
                        <button
                          onClick={() => handleTimeSlotClick(dateStr, time)}
                          disabled={booked || loading}
                          className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            booked
                              ? "bg-outline/30 text-outline cursor-not-allowed"
                              : isSelected
                              ? "bg-primary-accent text-white"
                              : "bg-primary-light/10 text-primary hover:bg-primary-light/20"
                          }`}
                        >
                          {booked ? (
                            <XCircle className="w-4 h-4 mx-auto" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mx-auto" />
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-lg bg-surface/50 text-outline text-sm text-center">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 予約を確定（通常モード時のみ） */}
      {!selectionMode && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleConfirmReservations}
            disabled={selectedSlots.length === 0 || loading}
            className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "予約作成中..." : `予約を確定（${selectedSlots.length}枠）`}
          </button>
          {selectedSlots.length > 0 && (
            <p className="text-sm text-on-background/60">
              1日2枠・1週間（表示の7日）で2枠まで。選択の解除は枠を再クリックしてください。
            </p>
          )}
        </div>
      )}

      {/* 凡例 */}
      <div className="mt-6 flex items-center gap-6 text-sm text-on-background/70">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary-light/10 border border-primary-light"></div>
          <span>予約可能</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-outline/30"></div>
          <span>予約済み</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-surface/50"></div>
          <span>予約不可</span>
        </div>
      </div>
    </div>
  );
}
