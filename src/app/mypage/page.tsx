"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getAllUserReservations, type Reservation, type Profile } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatDate, formatTime } from "@/lib/dateUtils";
import { User, Calendar, Clock, Edit, Save, Phone, Mail, Trash2 } from "lucide-react";

type TabType = "profile" | "reservations";

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    full_name_kana: "",
    phone: "",
  });

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
      setFormData({
        full_name: data.full_name || "",
        full_name_kana: data.full_name_kana || "",
        phone: data.phone || "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const loadReservations = async (userId: string) => {
    try {
      const data = await getAllUserReservations(userId);
      setReservations(data);
    } catch (error) {
      console.error("Failed to load reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { updateProfile } = await import("@/lib/supabase");
      await updateProfile(user.id, {
        full_name: formData.full_name,
        full_name_kana: formData.full_name_kana,
        phone: formData.phone,
      });
      await loadProfile(user.id);
      setEditing(false);
    } catch (error: any) {
      alert(error.message || "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;

    try {
      setCancelling(reservationId);
      const { cancelReservation } = await import("@/lib/supabase");
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

  const canModify = (bookingDate: string) => {
    const date = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
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

  const upcomingReservations = reservations.filter(
    (r) => new Date(r.booking_date) >= new Date()
  );
  const pastReservations = reservations.filter(
    (r) => new Date(r.booking_date) < new Date()
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">マイページ</h2>
        </div>

        {/* タブナビゲーション */}
        <div className="mb-6 border-b border-outline/20">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-background/70 hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                プロフィール
              </div>
            </button>
            <button
              onClick={() => setActiveTab("reservations")}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                activeTab === "reservations"
                  ? "border-primary text-primary"
                  : "border-transparent text-on-background/70 hover:text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                マイ予約
              </div>
            </button>
          </div>
        </div>

        {/* タブコンテンツ */}
        {activeTab === "profile" && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <User className="w-5 h-5" />
                プロフィール情報
              </h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  <Edit className="w-4 h-4" />
                  編集
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* メールアドレス（表示のみ） */}
                {profile?.email && (
                  <div>
                    <label className="block text-sm font-medium text-on-background mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="input bg-surface cursor-not-allowed"
                    />
                    <p className="text-xs text-on-background/60 mt-1">
                      メールアドレスは変更できません
                    </p>
                  </div>
                )}

                {/* 氏名 */}
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    氏名 <span className="text-highlight">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input"
                    placeholder="山田 太郎"
                    required
                  />
                </div>

                {/* 氏名（カナ） */}
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2">
                    氏名（カナ） <span className="text-highlight">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name_kana}
                    onChange={(e) => setFormData({ ...formData, full_name_kana: e.target.value })}
                    className="input"
                    placeholder="ヤマダ タロウ"
                    required
                  />
                </div>

                {/* 電話番号 */}
                <div>
                  <label className="block text-sm font-medium text-on-background mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    電話番号 <span className="text-highlight">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="090-1234-5678"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      if (profile) {
                        setFormData({
                          full_name: profile.full_name || "",
                          full_name_kana: profile.full_name_kana || "",
                          phone: profile.phone || "",
                        });
                      }
                    }}
                    className="btn-secondary"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {profile && (
                  <>
                    <div>
                      <span className="text-sm text-on-background/60">氏名:</span>
                      <p className="font-medium text-lg">{profile.full_name || "未設定"}</p>
                    </div>
                    <div>
                      <span className="text-sm text-on-background/60">氏名（カナ）:</span>
                      <p className="font-medium">{profile.full_name_kana || "未設定"}</p>
                    </div>
                    {profile.email && (
                      <div>
                        <span className="text-sm text-on-background/60">メールアドレス:</span>
                        <p className="font-medium">{profile.email}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-on-background/60 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        電話番号:
                      </span>
                      <p className="font-medium">{profile.phone || "未設定"}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "reservations" && (
          <div className="space-y-6">
            {/* 今後の予約 */}
            {upcomingReservations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  今後の予約
                </h3>
                <div className="space-y-3">
                  {upcomingReservations.map((reservation) => {
                    const canModifyReservation = canModify(reservation.booking_date);
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
                            <div className="flex items-center gap-3 text-on-background/70 mb-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                              </span>
                            </div>
                            {(reservation as any).reservation_number && (
                              <div className="text-sm text-on-background/60">
                                予約番号: {(reservation as any).reservation_number}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/member/reservations/${reservation.id}`)}
                              className="btn-secondary flex items-center gap-2 text-sm"
                            >
                              詳細
                            </button>
                            {canModifyReservation && (
                              <button
                                onClick={() => handleCancelReservation(reservation.id)}
                                disabled={cancelling === reservation.id}
                                className="btn-danger flex items-center gap-2 text-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                                {cancelling === reservation.id ? "処理中..." : "キャンセル"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 過去の予約 */}
            {pastReservations.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  過去の予約
                </h3>
                <div className="space-y-3">
                  {pastReservations.map((reservation) => (
                    <div key={reservation.id} className="card opacity-70">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="text-lg font-bold text-primary">
                              {formatDate(reservation.booking_date)}
                            </span>
                            <span className="px-2 py-1 bg-outline/20 text-outline text-xs rounded">
                              過去
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-on-background/70">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                            </span>
                          </div>
                        </div>
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
              </div>
            )}

            {upcomingReservations.length === 0 && pastReservations.length === 0 && (
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}
