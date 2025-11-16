import { getUser } from "../lib/dynamo";
import { getWeather } from "../lib/openweather";
import type { WeatherResponse } from "../types/weather";

/**
 * 指定 userId のユーザープロフィールから
 * lat / lon を取得し天気を取得
 */
export const getWeatherByUserId = async (
  userId: string
): Promise<WeatherResponse> => {
  const user = await getUser(userId);

  if (!user.Item) {
    throw new Error(`User not found: ${userId}`);
  }

  const profile = user.Item;

  const weather = await getWeather(profile.lat, profile.lon);

  return {
    userId,
    lat: profile.lat,
    lon: profile.lon,
    weather
  };
};
