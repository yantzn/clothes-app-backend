// lib/openweather.ts
import { OpenWeatherClient } from "./openweatherClient";

const client = new OpenWeatherClient();

// 緯度・経度を取得する
export const getLatLon = (region: string) => {
  return client.getLatLon(region);
};

// 天気情報を取得する
export const getWeather = (lat: number, lon: number) => {
  return client.getWeather(lat, lon);
};
