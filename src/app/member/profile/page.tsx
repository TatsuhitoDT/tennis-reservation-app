"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { type Profile } from "@/lib/supabase";
import Header from "@/components/Header";
import { User, Save, Mail, Phone, Trash2, AlertTriangle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    full_name_kana: "",
    phone: "",
  });
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeSent, setEmailChangeSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        await loadProfile(session.user.id);
        
        // メールアドレス変更確認後の処理
        if (typeof window !== "undefined") {
          const hash = window.location.hash?.replace("#", "") || "";
          if (hash) {
            const params = new URLSearchParams(hash);
            const type = params.get("type");
            if (type === "email_change") {
              // メールアドレス変更が完了した場合、profilesテーブルも更新
              try {
                const { updateProfile } = await import("@/lib/supabase");
                await updateProfile(session.user.id, {
                  email: session.user.email || "",
                });
                setMessage("メールアドレスが正常に変更されました。");
                // URLからハッシュを削除
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
                // プロフィールを再読み込み
                await loadProfile(session.user.id);
              } catch (error) {
                console.error("Failed to update profile email:", error);
                setError("メールアドレスの更新に失敗しました");
              }
            }
          }
        }
      }
    });
  }, [router]);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { getProfile } = await import("@/lib/supabase");
      const data = await getProfile(userId);
      setProfile(data);
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          full_name_kana: data.full_name_kana || "",
          phone: data.phone || "",
        });
      } else {
        setFormData({
          full_name: "",
          full_name_kana: "",
          phone: "",
        });
      }
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


  const handleDeleteAccount = async () => {
    if (!user) return;

    // 2段階確認
    const confirm1 = window.confirm(
      "アカウントを削除すると、すべてのデータ（プロフィール、予約履歴など）が永久に削除されます。\n\nこの操作は取り消せません。本当に削除しますか？"
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "最終確認：アカウントを削除してもよろしいですか？\n\n「OK」を押すと、アカウントは即座に削除されます。"
    );
    if (!confirm2) return;

    setDeleting(true);
    setError(null);

    try {
      // セッションからトークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("セッションが見つかりません");
      }

      // API Routeを呼び出してアカウントを削除
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          accessToken: session.access_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "アカウントの削除に失敗しました");
      }

      // ログアウトしてトップページにリダイレクト
      await supabase.auth.signOut();
      router.push("/");
      
      // ページをリロードして完全にログアウト状態にする
      window.location.href = "/";
    } catch (error: any) {
      setError(error.message || "アカウントの削除に失敗しました");
      setDeleting(false);
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
          {/* メールアドレス */}
          <div>
            <label className="block text-sm font-medium text-on-background mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              メールアドレス
            </label>
            {!changingEmail && !emailChangeSent ? (
              <>
                <input
                  type="email"
                  value={user?.email || profile?.email || ""}
                  disabled
                  className="input bg-surface cursor-not-allowed"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setChangingEmail(true);
                      setNewEmail("");
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-sm text-primary-accent hover:underline"
                  >
                    メールアドレスを変更
                  </button>
                </div>
              </>
            ) : emailChangeSent ? (
              <>
                <input
                  type="email"
                  value={user?.email || profile?.email || ""}
                  disabled
                  className="input bg-surface cursor-not-allowed"
                />
                <div className="mt-2 p-3 bg-primary/10 border border-primary text-primary rounded-lg text-sm">
                  <p className="mb-2">
                    <strong>{newEmail}</strong> に確認メールを送信しました。
                  </p>
                  <p>
                    新しいメールアドレスに届いた確認リンクをクリックして、メールアドレス変更を完了してください。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChangingEmail(false);
                    setEmailChangeSent(false);
                    setNewEmail("");
                  }}
                  className="text-sm text-primary-accent hover:underline mt-2"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <>
                <input
                  type="email"
                  value={user?.email || profile?.email || ""}
                  disabled
                  className="input bg-surface cursor-not-allowed mb-2"
                />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input"
                  placeholder="新しいメールアドレス"
                  required
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!newEmail || !user) return;
                      const currentEmail = user?.email || profile?.email;
                      if (newEmail === currentEmail) {
                        setError("現在のメールアドレスと同じです");
                        return;
                      }
                      setChangingEmail(false);
                      setError(null);
                      setMessage(null);
                      try {
                        const redirectTo =
                          process.env.NEXT_PUBLIC_APP_URL 
                            ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
                            : (typeof window !== "undefined" ? window.location.origin : "") + "/login";
                        const { error: updateError } = await supabase.auth.updateUser(
                          { email: newEmail },
                          { emailRedirectTo: redirectTo }
                        );
                        if (updateError) throw updateError;
                        setEmailChangeSent(true);
                      } catch (err: any) {
                        setError(err.message || "メールアドレスの変更に失敗しました");
                        setChangingEmail(false);
                      }
                    }}
                    className="btn-primary text-sm"
                  >
                    変更メールを送信
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingEmail(false);
                      setNewEmail("");
                      setError(null);
                    }}
                    className="btn-secondary text-sm"
                  >
                    キャンセル
                  </button>
                </div>
              </>
            )}
          </div>

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

        {/* アカウント削除セクション */}
        <div className="card mt-8 border-t border-outline/20 pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-highlight mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              危険な操作
            </h3>
            <p className="text-sm text-on-background/70 mb-4">
              アカウントを削除すると、すべてのデータ（プロフィール情報、予約履歴など）が永久に削除されます。
              この操作は取り消せません。
            </p>
          </div>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="btn-danger flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "削除中..." : "アカウントを削除"}
          </button>
        </div>
      </main>
    </div>
  );
}
