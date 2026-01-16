"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { type Profile } from "@/lib/supabase";
import Header from "@/components/Header";
import { User, Save, Mail, Phone } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      }
    });
  }, [router]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
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
      setError("プロフィールの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const { updateProfile } = await import("@/lib/supabase");
      await updateProfile(user.id, {
        full_name: formData.full_name,
        full_name_kana: formData.full_name_kana,
        phone: formData.phone,
      });

      setMessage("プロフィールを更新しました");
      await loadProfile(user.id);
    } catch (error: any) {
      setError(error.message || "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-8">
          <div className="text-center text-on-background/70">読み込み中...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">プロフィール編集</h2>
          <p className="text-on-background/70">
            プロフィール情報を確認・編集できます。
          </p>
        </div>

        <form onSubmit={handleSave} className="card space-y-6">
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

          {error && (
            <div className="bg-highlight/10 border border-highlight text-highlight px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-primary-accent/10 border border-primary-accent text-primary-accent px-4 py-3 rounded-lg text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-4">
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
              onClick={() => router.push("/mypage")}
              className="btn-secondary"
            >
              キャンセル
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
