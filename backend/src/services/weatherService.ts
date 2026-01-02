import { getLatLon, getHourlyWeather } from "../lib/openweather";
import { DynamoUserProfileRepository } from "../repositories/dynamoUserProfileRepository";

export interface HourlyWeatherItem {
  timestamp: number;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  humidity: number;
  windSpeed: number;
  condition: string;
}

export interface HourlyWeatherResponse {
  region: string;
  intervalHours: number;
  hourly: HourlyWeatherItem[];
}

interface RawHourlyItem {
  dt: number;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weather: { main: string; description: string }[];
}

/**
 * 指定地域の1時間刻み天気を取得する。
 * - 地名から緯度経度を取得
 * - OpenWeather One Call 3.0 の hourly を取得
 * - UI向けに必要最小限のフィールドへ整形
 */
export async function getHourlyByRegion(region: string, limitHours: number = 24): Promise<HourlyWeatherResponse> {
  const { lat, lon } = await getLatLon(region);
  const hourlyPayload = await getHourlyWeather(lat, lon);
  const hourlySource: RawHourlyItem[] = hourlyPayload.hourly;

  const INTERVAL_HOURS = 3;
  const points = Math.min(hourlySource.length, Math.max(1, Math.ceil(limitHours / INTERVAL_HOURS)));

  const hourly: HourlyWeatherItem[] = hourlySource.slice(0, points).map((h: RawHourlyItem) => ({
    timestamp: h.dt,
    temperatureCelsius: h.temp,
    feelsLikeCelsius: h.feels_like,
    humidity: h.humidity,
    windSpeed: h.wind_speed,
    condition: (h.weather && h.weather[0] && h.weather[0].description) ? h.weather[0].description : "",
  }));

  return { region, intervalHours: INTERVAL_HOURS, hourly };
}

/**
 * ユーザーIDから地域を取得して3時間刻み予報を返す
 */
export async function getHourlyForUser(userId: string, limitHours: number = 24): Promise<HourlyWeatherResponse> {
  const repo = new DynamoUserProfileRepository();
  const user = await repo.getById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }
  return getHourlyByRegion(user.region, limitHours);
}
