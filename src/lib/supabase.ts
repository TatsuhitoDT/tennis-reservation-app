import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 環境変数のチェック（ビルド時と実行時の両方で）
if (typeof window === "undefined") {
  // サーバーサイド（ビルド時）のチェック
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
    );
  }
}

// クライアントサイドでのチェック
if (typeof window !== "undefined" && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    "Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// 型定義
export type Profile = {
  id: string;
  full_name: string | null;
  full_name_kana?: string | null;
  email: string | null;
  phone?: string | null;
  created_at: string;
  updated_at: string;
};

export type Court = {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Reservation = {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  contact_notes?: string | null;
  reservation_number?: string | null;
  created_at: string;
  court?: Court; // JOIN時のみ
};

// コート一覧取得
export async function getCourts() {
  const { data, error } = await supabase
    .from("courts")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;
  return data as Court[];
}

// 予約取得（日付・コート指定）
export async function getReservationsByDate(date: string, courtId?: string) {
  let query = supabase
    .from("reservations")
    .select("*, court:courts(*)")
    .eq("booking_date", date);

  if (courtId) {
    query = query.eq("court_id", courtId);
  }

  const { data, error } = await query.order("start_time");

  if (error) throw error;
  return data as Reservation[];
}

// 予約作成
export async function createReservation(
  userId: string,
  courtId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const { data, error } = await supabase
    .from("reservations")
    .insert({
      user_id: userId,
      court_id: courtId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
    })
    .select("*, court:courts(*)")
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
    .select("*, court:courts(*)")
    .eq("user_id", userId)
    .gte("booking_date", new Date().toISOString().split("T")[0])
    .order("booking_date")
    .order("start_time");

  if (error) throw error;
  return data as Reservation[];
}

// ユーザーの全予約取得（過去含む）
export async function getAllUserReservations(userId: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*, court:courts(*)")
    .eq("user_id", userId)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) throw error;
  return data as Reservation[];
}

// 予約取得（ID指定）
export async function getReservationById(reservationId: string) {
  const { data, error } = await supabase
    .from("reservations")
    .select("*, court:courts(*)")
    .eq("id", reservationId)
    .single();

  if (error) throw error;
  return data as Reservation;
}

// 予約更新
export async function updateReservation(
  reservationId: string,
  courtId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
) {
  const { data, error } = await supabase
    .from("reservations")
    .update({
      court_id: courtId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
    })
    .eq("id", reservationId)
    .select("*, court:courts(*)")
    .single();

  if (error) throw error;
  return data as Reservation;
}

// プロフィール取得
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

// プロフィール更新
export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string;
    full_name_kana?: string;
    phone?: string;
  }
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}
