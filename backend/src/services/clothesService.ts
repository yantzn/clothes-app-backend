import { getUser } from "../lib/dynamo";
import { getWeather } from "../lib/openweather";
import type { ClothesSuggestion } from "../types/clothes";

/**
 * 服装提案ロジック（簡易版）
 */
const buildSuggestion = (temp: number): { suggestion: string; items: string[] } => {
  if (temp >= 28) {
    return {
      suggestion: "とても暑いです。通気性の良い服装を選びましょう",
      items: ["Tシャツ", "ハーフパンツ", "サンダル"]
    };
  }

  if (temp >= 20) {
    return {
      suggestion: "暖かい気温です。軽装で問題ありません",
      items: ["長袖Tシャツ", "薄手のパーカー"]
    };
  }

  if (temp >= 12) {
    return {
      suggestion: "やや肌寒いです。羽織りを持っていきましょう",
      items: ["スウェット", "薄手ジャケット"]
    };
  }

  return {
    suggestion: "寒いです。防寒をしっかりしてください",
    items: ["コート", "ニット", "暖かい長ズボン"]
  };
};

/**
 * userId → lat/lon → 天気 → 服装提案
 */
export const getClothesSuggestionByUserId = async (
  userId: string
): Promise<ClothesSuggestion> => {
  const user = await getUser(userId);

  if (!user.Item) {
    throw new Error(`User not found: ${userId}`);
  }

  const profile = user.Item;

  const weather = await getWeather(profile.lat, profile.lon);
  const temp = weather.main.temp;
  const humidity = weather.main.humidity;
  const wind = weather.wind.speed;

  const result = buildSuggestion(temp);

  return {
    userId,
    temperature: temp,
    humidity: humidity,
    windSpeed: wind,
    suggestion: result.suggestion,
    items: result.items
  };
};
