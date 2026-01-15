import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義
export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
};

// 予約取得（日付指定）
export async function getReservationsByDate(date: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("booking_date", date)
    .order("start_time");

  if (error) throw error;
  return data as Reservation[];
}

// 予約作成
export async function createReservation(
  userId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      user_id: userId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Reservation;
}

// 予約キャンセル
export async function cancelReservation(reservationId: string) {
  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("id", reservationId);

  if (error) throw error;
}

// ユーザーの予約取得
export async function getUserReservations(userId: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .gte("booking_date", new Date().toISOString().split("T")[0])
    .order("booking_date")
    .order("start_time");

  if (error) throw error;
  return data as Reservation[];
}
