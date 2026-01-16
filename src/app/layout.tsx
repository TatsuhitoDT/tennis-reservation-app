import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "テニスコート予約システム",
  description: "社内テニスコートの予約管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="w-full py-4 px-4 text-left border-t border-outline/20">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-sm text-on-background/70">
              運営会社 iPark Institute Co., Ltd.
            </p>
            <Link 
              href="/privacy-policy" 
              className="text-sm text-on-background/70 hover:text-primary-accent transition-colors"
            >
              プライバシーポリシー
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
