import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // ビルドキャッシュを無効化（デプロイ時の問題解決のため）
  experimental: {
    // キャッシュを無効化
  },
};

export default nextConfig;
