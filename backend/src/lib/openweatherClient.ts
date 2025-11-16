// lib/openweatherClient.ts
import { HttpClient } from "./httpClient";
import { ENV } from "../config/env.js";

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
}
