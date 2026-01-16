import type { Metadata } from "next";
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
        <footer className="w-full py-4 px-4 text-left">
          <p className="text-sm text-on-background/70">
            運営会社 iPark Institute Co., Ltd.
          </p>
        </footer>
      </body>
    </html>
  );
}
