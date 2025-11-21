import type { TemperatureCategory } from "../models/temperature";

export interface WeatherResponse {
  region: string;
  temperature: {
    value: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    category: TemperatureCategory;
  };
}
