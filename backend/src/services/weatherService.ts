// src/services/weatherService.ts
import { openWeatherClient  } from "../lib/openweatherClient";
import type { WeatherResponse } from "../types/weather";
import { categorizeTemperature } from "../models/temperature";

export const getWeatherByRegion = async (
  region: string
): Promise<WeatherResponse> => {
  // 1. 地名 → 緯度経度
  const { lat, lon } = await openWeatherClient.getLatLon(region);

  // 2. 天気情報を取得
  const weather = await openWeatherClient.getWeather(lat, lon);

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
