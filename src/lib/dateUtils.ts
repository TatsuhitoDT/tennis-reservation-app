import { format, isWeekend as dateFnsIsWeekend, parseISO } from "date-fns";
import { ja } from "date-fns/locale/ja";

// 日本の祝日リスト（2025年〜2027年）
const HOLIDAYS = [
  // 2025年
  "2025-01-01", // 元日
  "2025-01-13", // 成人の日
  "2025-02-11", // 建国記念の日
  "2025-02-23", // 天皇誕生日
  "2025-03-20", // 春分の日
  "2025-04-29", // 昭和の日
  "2025-05-03", // 憲法記念日
  "2025-05-04", // みどりの日
  "2025-05-05", // こどもの日
  "2025-07-21", // 海の日
  "2025-08-11", // 山の日
  "2025-09-15", // 敬老の日
  "2025-09-23", // 秋分の日
  "2025-10-13", // スポーツの日
  "2025-11-03", // 文化の日
  "2025-11-23", // 勤労感謝の日
  // 2026年
  "2026-01-01", // 元日
  "2026-01-12", // 成人の日
  "2026-02-11", // 建国記念の日
  "2026-02-23", // 天皇誕生日
  "2026-03-20", // 春分の日
  "2026-04-29", // 昭和の日
  "2026-05-03", // 憲法記念日
  "2026-05-04", // みどりの日
  "2026-05-05", // こどもの日
  "2026-05-06", // 振替休日（憲法記念日が日曜日のため）
  "2026-07-20", // 海の日
  "2026-08-11", // 山の日
  "2026-09-21", // 敬老の日
  "2026-09-22", // 国民の休日（敬老の日と秋分の日にはさまれたため）
  "2026-09-23", // 秋分の日
  "2026-10-12", // スポーツの日
  "2026-11-03", // 文化の日
  "2026-11-23", // 勤労感謝の日
  // 2027年
  "2027-01-01", // 元日
  "2027-01-11", // 成人の日
  "2027-02-11", // 建国記念の日
  "2027-02-23", // 天皇誕生日
  "2027-03-21", // 春分の日
  "2027-04-29", // 昭和の日
  "2027-05-03", // 憲法記念日
  "2027-05-04", // みどりの日
  "2027-05-05", // こどもの日
  "2027-07-19", // 海の日
  "2027-08-11", // 山の日
  "2027-09-20", // 敬老の日
  "2027-09-23", // 秋分の日
  "2027-10-11", // スポーツの日
  "2027-11-03", // 文化の日
  "2027-11-23", // 勤労感謝の日
];

export function isWeekend(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateFnsIsWeekend(dateObj);
}

export function isHoliday(date: Date | string): boolean {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  return HOLIDAYS.includes(dateStr);
}

export function isBookableDate(date: Date | string): boolean {
  return isWeekend(date) || isHoliday(date);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "yyyy年M月d日(E)", { locale: ja });
}

export function formatTime(time: string): string {
  return time.substring(0, 5); // "HH:mm"形式に変換
}

// 9:00-17:00の1時間単位の時間スロットを生成
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 9; hour < 17; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
}
