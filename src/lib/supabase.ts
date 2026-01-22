import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!supabaseUrl) {
  console.error('[Supabase] Missing env: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  console.error('[Supabase] Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 環境変数が設定されていない場合でも、ダミークライアントを作成してエラーを防ぐ
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient('https://placeholder.supabase.co', 'placeholder-key')

// 型定義（他のファイルで使用される可能性がある）
export type Profile = {
  id: string
  full_name: string
  full_name_kana: string
  email: string
  phone: string
  created_at: string
  updated_at: string
}

export type Reservation = {
  id: string
  user_id: string
  court_id: string
  booking_date: string
  start_time: string
  end_time: string
  created_at: string
  updated_at?: string
  court?: {
    id: string
    name: string
    display_name: string
    is_active: boolean
  }
}

export type Court = {
  id: string
  name: string
  display_name: string
  is_active: boolean
}

// データベース関数（必要に応じて他のファイルからインポートされる）
export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  if (error) {
    console.error('Error updating profile:', error)
    return false
  }
  return true
}

export async function getCourts(): Promise<Court[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) {
    console.error('Error fetching courts:', error)
    return []
  }
  return data || []
}

export async function getUserReservations(userId: string): Promise<Reservation[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .eq('user_id', userId)
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false })
  if (error) {
    console.error('Error fetching reservations:', error)
    return []
  }
  return data || []
}

export async function getAllUserReservations(userId: string): Promise<Reservation[]> {
  return getUserReservations(userId)
}

export async function getReservationById(reservationId: string): Promise<Reservation | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .eq('id', reservationId)
    .single()
  if (error) {
    console.error('Error fetching reservation:', error)
    return null
  }
  return data
}

export async function updateReservation(
  reservationId: string,
  updates: Partial<Reservation>
): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase
    .from('reservations')
    .update(updates)
    .eq('id', reservationId)
  if (error) {
    console.error('Error updating reservation:', error)
    return false
  }
  return true
}

export async function cancelReservation(reservationId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', reservationId)
  if (error) {
    console.error('Error canceling reservation:', error)
    return false
  }
  return true
}

export async function getReservationsByDate(
  date: string,
  courtId?: string
): Promise<Reservation[]> {
  if (!isSupabaseConfigured) return []
  let query = supabase
    .from('reservations')
    .select('*, court:courts(*)')
    .eq('booking_date', date)
  
  if (courtId) {
    query = query.eq('court_id', courtId)
  }
  
  const { data, error } = await query
  if (error) {
    console.error('Error fetching reservations by date:', error)
    return []
  }
  return data || []
}

export async function createReservation(
  userId: string,
  courtId: string,
  bookingDate: string,
  startTime: string,
  endTime: string
): Promise<Reservation | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      user_id: userId,
      court_id: courtId,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
    })
    .select('*, court:courts(*)')
    .single()
  if (error) {
    console.error('Error creating reservation:', error)
    throw new Error(error.message || '予約の作成に失敗しました')
  }
  return data
}
