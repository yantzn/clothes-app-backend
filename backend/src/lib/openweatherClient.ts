import { HttpClient } from "./httpClient";
import { ENV } from "../config/env";

// OpenWeatherMap API クライアントクラス
export class OpenWeatherClient extends HttpClient {
  constructor() {
    super("https://api.openweathermap.org/");
  }

  // ジオコーディング
  async getLatLon(region: string) {
    const res = await this.client.get("/geo/1.0/direct", {
      params: {
        q: region,
        limit: 1,
        appid: ENV.openWeatherKey
      }
    });

    if (!res.data[0]) {
      throw new Error(`No geocoding result for region: ${region}`);
    }

    return {
      lat: res.data[0].lat,
      lon: res.data[0].lon
    };
  }

  // 天気情報
  async getWeather(lat: number, lon: number) {
    const res = await this.client.get("/data/2.5/weather", {
      params: {
        lat,
        lon,
        units: "metric",
        appid: ENV.openWeatherKey
      }
    });

    return res.data;
  }

  // 無料版: 3時間ごとの予報（/data/2.5/forecast）を取得し、hourly互換形式に整形
  async getHourlyWeather(lat: number, lon: number): Promise<{
    lat: number;
    lon: number;
    timezone?: string;
    hourly: Array<{
      dt: number;
      temp: number;
      feels_like: number;
      humidity: number;
      wind_speed: number;
      weather: Array<{ main: string; description: string }>;
    }>;
  }> {
    const res = await this.client.get("/data/2.5/forecast", {
      params: {
        lat,
        lon,
        units: "metric",
        appid: ENV.openWeatherKey
      }
    });

    // 3時間刻みの予報を hourly 互換形式へ変換
    const list: Array<{
      dt: number;
      main: { temp: number; feels_like: number; humidity: number };
      wind: { speed: number };
      weather: Array<{ main: string; description: string }>;
    }> = res.data.list ?? [];

    const hourly = list.map((i) => ({
      dt: i.dt,
      temp: i.main.temp,
      feels_like: i.main.feels_like,
      humidity: i.main.humidity,
      wind_speed: i.wind.speed,
      weather: i.weather.map((w) => ({ main: w.main, description: w.description }))
    }));

    return { lat, lon, hourly };
  }
}
// シングルトンインスタンスのエクスポート
export const openWeatherClient = new OpenWeatherClient();
