import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors (優先順位順) - Material Design 3
        primary: {
          DEFAULT: "#16145F", // Pantone 2765 - メイン
          light: "#0067B1",   // Pantone 293
          accent: "#00A5E3",  // Pantone 7460
        },
        // Neutral
        outline: "#B6B8BA",   // Pantone 422
        // Highlight
        highlight: "#E72241", // Pantone 1925
        // Background & Surface
        background: "#FFFFFF",
        surface: "#FAFAFA",
        // Text
        "on-primary": "#FFFFFF",
        "on-background": "#1A1A1A",
      },
    },
  },
  plugins: [],
} satisfies Config;
