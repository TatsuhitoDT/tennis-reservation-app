"use client";

import { Calendar, Clock, User, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { VISIT_APPLICATION_NOTICE } from "@/lib/constants";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center">
        {/* ヒーローセクション */}
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold text-primary mb-4">
            テニスコート予約システム
          </h2>
          <p className="text-lg text-on-background/70 mb-8">
            簡単3ステップで予約完了。空き状況をリアルタイムで確認できます。
          </p>
          
          {/* ログインボタン */}
          <button
            onClick={() => router.push("/login")}
            className="btn-primary inline-flex items-center gap-2 text-lg"
          >
            <LogIn className="w-5 h-5" />
            ログインして予約する
          </button>
        </section>

        {/* 特徴セクション */}
        <section className="grid md:grid-cols-3 gap-6 mb-16 text-left">
          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary-accent" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">
              リアルタイム空き確認
            </h3>
            <p className="text-on-background/70 text-sm">
              カレンダーで空き状況を一目で確認。ダブルブッキングの心配なし。
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary-light/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary-light" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">
              1時間単位で予約
            </h3>
            <p className="text-on-background/70 text-sm">
              9:00〜17:00の間、1時間単位で予約可能。1日最大2時間まで。
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">
              マイページで管理
            </h3>
            <p className="text-on-background/70 text-sm">
              予約確認・キャンセルがいつでも可能。履歴も一覧で確認。
            </p>
          </div>
        </section>

        {/* 注意書き（来館申請） */}
        <section className="card mb-6 bg-primary/5 border border-primary/20">
          <p className="text-primary font-medium">{VISIT_APPLICATION_NOTICE}</p>
        </section>

        {/* 利用ルール */}
        <section className="card text-left">
          <h3 className="text-xl font-bold text-primary mb-4">ご利用ルール</h3>
          <ul className="space-y-2 text-on-background/80">
            <li className="flex items-start gap-2">
              <span className="text-primary-accent">•</span>
              予約可能日：土曜・日曜・祝日のみ
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-accent">•</span>
              予約可能時間：9:00〜17:00（1時間単位）
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-accent">•</span>
              1日の最大予約時間：2時間まで
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-accent">•</span>
              キャンセルは前日まで可能
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
