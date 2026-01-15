import { format, isWeekend as dateFnsIsWeekend, parseISO } from "date-fns";
import { ja } from "date-fns/locale/ja";

// 日本の祝日リスト（2025年）
const HOLIDAYS_2025 = [
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
];

export function isWeekend(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return dateFnsIsWeekend(dateObj);
}

export function isHoliday(date: Date | string): boolean {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  return HOLIDAYS_2025.includes(dateStr);
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
