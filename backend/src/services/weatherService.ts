// src/services/weatherService.ts
import { openWeatherClient } from "../lib/openweatherClient";
import type { WeatherResponse } from "../types/weather";
import { categorizeTemperature } from "../models/temperature";

/**
 * 指定された地域名から現在の気象情報を取得し、温度カテゴリへ正規化した結果を返す。
 *
 * なぜこの順序か:
 * 1. 地域名 → 緯度経度: OpenWeather API が座標ベースのため前処理で名称解決。
 * 2. 温度カテゴリ化: 後続の衣服レコメンド（年齢 × 温度帯マトリクス）が直接利用できる形に整えるため、ここで正規化。
 * 3. 純粋なドメイン変換: サービス層は HTTP / Zod / ログ詳細を持たず、副作用を lib へ委譲するアーキテクチャ原則を保持。
 *
 * ドメイン背景:
 * - 幼児衣服レコメンドでは絶対温度より温度帯区分が意思決定ロジックに直結。
 * - 体感温度 (feels_like) や風速は医学的注意事項（風冷え等）補正の素材。現段階では温度帯のみ使用。
 *
 * 将来拡張候補:
 * - TODO: 湿度・風速を加味した体感温度再計算で注意事項を自動生成する。
 * - TODO: 頻出地域の座標・天気の短期キャッシュ導入で外部 API 呼び出しを最適化する。
 *
 * @param region 地域名（市区町村など人間可読な文字列）
 * @returns 正規化済み気象情報（温度カテゴリ付き）
 */
export const getWeatherByRegion = async (
  region: string
): Promise<WeatherResponse> => {
  // 地名を座標へ変換（OpenWeather が座標ベースのため前処理が必須）
  const { lat, lon } = await openWeatherClient.getLatLon(region);

  // 座標を使って現在の気象情報を取得（外部 API 呼び出しは lib に集約）
  const weather = await openWeatherClient.getWeather(lat, lon);

  // 後続ロジックで直接参照可能な温度カテゴリへ正規化
  const category = categorizeTemperature(weather.main.temp);

  return {
    region,
    temperature: {
      value: weather.main.temp,
      feelsLike: weather.main.feels_like,
      humidity: weather.main.humidity,
      windSpeed: weather.wind.speed,
      category
    }
  };
};
