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
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
