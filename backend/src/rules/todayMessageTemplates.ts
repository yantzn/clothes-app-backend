// rules/todayMessageTemplates.ts
import type { RecommendationType, TemperatureBand, TodayMessageTemplate } from "../types/today";

// band → recommendationType の基本マッピング
export const BAND_TO_RECOMMENDATION: Record<TemperatureBand, RecommendationType> = {
  very_cold: "heavy_layers",
  cold: "heavy_layers",
  cool: "adjustable_layers",
  mild: "adjustable_layers",
  warm: "light_layers",
  hot: "heat_awareness"
};

// recommendationType → テンプレ文言
export const TODAY_MESSAGE_TEMPLATES: Record<RecommendationType, TodayMessageTemplate> = {
  heavy_layers: {
    type: "heavy_layers",
    text: "寒い一日。重ね着でしっかり保温し、屋内では脱ぎ着で体温調整を。"
  },
  adjustable_layers: {
    type: "adjustable_layers",
    text: "気温差に備えて、薄手＋羽織で調整できる服装がおすすめです。"
  },
  light_layers: {
    type: "light_layers",
    text: "過ごしやすい〜少し暖かい一日。軽めの服装で、動きやすさを優先しましょう。"
  },
  heat_awareness: {
    type: "heat_awareness",
    text: "暑い一日。通気性の良い軽装と、こまめな水分補給を心がけて。"
  }
};

// 風・湿度・天気状態で短い補足句を追加（200文字以内に収める）
export const buildSuffix = (opts: { windSpeed: number; humidity: number; condition: string }): string => {
  const suffix: string[] = [];
  if (opts.windSpeed > 5) suffix.push("風が強い場合は羽織で体温調節を");
  if (opts.humidity >= 80) suffix.push("湿度が高い時は汗対策を");
  if (["rain", "drizzle", "snow"].includes(opts.condition)) suffix.push("外出は天候に合わせて無理なく");
  return suffix.length ? " " + suffix.join("。") + "。" : "";
};
