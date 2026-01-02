// services/todayMessageService.ts
import { BAND_TO_RECOMMENDATION, TODAY_MESSAGE_TEMPLATES, buildSuffix } from "../rules/todayMessageTemplates";
import type { TemperatureBand } from "../types/today";
import { categorizeTemperature } from "../models/temperature";

export const getTodayMessage = (weather: {
  feelsLike: number;
  windSpeed: number;
  humidity: number;
  condition: string;
}): string => {
  // モデルのカテゴリ（very_cold〜hot）を TemperatureBand として利用
  const band: TemperatureBand = categorizeTemperature(weather.feelsLike);
  const recType = BAND_TO_RECOMMENDATION[band];
  const base = TODAY_MESSAGE_TEMPLATES[recType].text;
  const suffix = buildSuffix({ windSpeed: weather.windSpeed, humidity: weather.humidity, condition: weather.condition });
  const message = (base + suffix).trim();
  // 200文字を超える場合は安全側に丸める
  return message.length > 200 ? message.slice(0, 198) + "…" : message;
};
