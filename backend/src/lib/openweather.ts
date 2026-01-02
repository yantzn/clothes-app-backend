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

// 1時間ごとの天気を取得する
export const getHourlyWeather = (lat: number, lon: number) => {
  return client.getHourlyWeather(lat, lon);
};
