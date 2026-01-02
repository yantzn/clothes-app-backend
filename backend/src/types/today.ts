// types/today.ts
// 今日のひとこと生成に関わる型

export type TemperatureBand = "very_cold" | "cold" | "cool" | "mild" | "warm" | "hot";

export type RecommendationType =
  | "heavy_layers" // しっかり防寒
  | "adjustable_layers" // 脱ぎ着で調整
  | "light_layers" // 軽装寄り
  | "heat_awareness"; // 暑さへの注意

export interface TodayMessageTemplate {
  type: RecommendationType;
  text: string; // 1〜2文、max 200 文字を想定
}
