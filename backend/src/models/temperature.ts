// src/models/temperature.ts

/**
 * 温度帯カテゴリ
 *
 * very_cold :  0℃以下〜5℃
 * cold      :  6〜10℃
 * cool      : 11〜15℃
 * mild      : 16〜20℃
 * warm      : 21〜25℃
 * hot       : 26℃以上
 */
export type TemperatureCategory =
  | "very_cold"
  | "cold"
  | "cool"
  | "mild"
  | "warm"
  | "hot";

/**
 * 気温(℃)から TemperatureCategory を判定
 * ※ 体感温度(feels_like)を優先して使う想定
 */
export const categorizeTemperature = (tempCelsius: number): TemperatureCategory => {
  if (tempCelsius <= 5) return "very_cold";
  if (tempCelsius <= 10) return "cold";
  if (tempCelsius <= 15) return "cool";
  if (tempCelsius <= 20) return "mild";
  if (tempCelsius <= 25) return "warm";
  return "hot";
};
