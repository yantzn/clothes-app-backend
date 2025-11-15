import { getWeather } from "../lib/openweather";

// 天気データ取得サービス
export const fetchWeather = async (lat: number, lon: number) => {
  const data = await getWeather(lat, lon);
  return {
    temp: data.main.temp,
    feels_like: data.main.feels_like,
    weather: data.weather[0].main
  };
};
