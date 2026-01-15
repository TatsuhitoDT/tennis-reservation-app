"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addWeeks, startOfWeek, addDays, parseISO } from "date-fns";
import { ja } from "date-fns/locale/ja";
import {
  getReservationsByDate,
  createReservation,
  type Reservation,
} from "@/lib/supabase";
import { isBookableDate, generateTimeSlots, formatTime } from "@/lib/dateUtils";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

interface BookingCalendarProps {
  userId: string;
}

export default function BookingCalendar({ userId }: BookingCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Record<string, Reservation[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const loadReservations = useCallback(async () => {
    const dates = weekDays.map((d) => format(d, "yyyy-MM-dd"));
    const allReservations: Record<string, Reservation[]> = {};

    for (const date of dates) {
      try {
        const res = await getReservationsByDate(date);
        allReservations[date] = res;
      } catch (err) {
        console.error(`Failed to load reservations for ${date}:`, err);
        allReservations[date] = [];
      }
    }

    setReservations(allReservations);
  }, [weekDays]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleTimeSlotClick = async (date: string, time: string) => {
    if (!isBookableDate(date)) {
      setError("土曜・日曜・祝日のみ予約可能です");
      return;
    }

    setSelectedDate(date);
    setSelectedTime(time);
    setError(null);

    // 予約作成
    try {
      setLoading(true);
      const endTime = `${(parseInt(time.split(":")[0]) + 1).toString().padStart(2, "0")}:00`;
      
      await createReservation(userId, date, time, endTime);
      
      // リロード
      await loadReservations();
      setSelectedDate(null);
      setSelectedTime(null);
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

  const timeSlots = generateTimeSlots();

  return (
    <div className="card">
      {/* 週ナビゲーション */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, -1))}
          className="px-4 py-2 rounded-lg hover:bg-surface transition-colors"
        >
          ← 前週
        </button>
        <h3 className="text-lg font-bold text-primary">
          {format(weekStart, "yyyy年M月d日", { locale: ja })} 〜
          {format(addDays(weekStart, 6), "M月d日", { locale: ja })}
        </h3>
        <button
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
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
                  const isSelected =
                    selectedDate === dateStr && selectedTime === time;

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
