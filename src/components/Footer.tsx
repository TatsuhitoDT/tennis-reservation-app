"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-4 px-4 text-left border-t border-outline/20 bg-surface/50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <p className="text-sm text-on-background/80">
          運営会社 iPark Institute Co., Ltd.
        </p>
        <Link
          href="/privacy-policy"
          className="text-sm text-primary-accent hover:underline font-medium"
        >
          プライバシーポリシー
        </Link>
      </div>
    </footer>
  );
}
