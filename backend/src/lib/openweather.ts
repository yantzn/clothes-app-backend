// lib/openweather.ts
import axios from "axios";
import { ENV } from "../config/env.js";

export const getLatLon = async (region: string) => {
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    region
  )}&limit=1&appid=${ENV.openWeatherKey}`;

  const res = await axios.get(url);

  if (!res.data[0]) {
    throw new Error(`No geocoding result for region: ${region}`);
  }

  return {
    lat: res.data[0].lat,
    lon: res.data[0].lon
  };
};

export const getWeather = async (lat: number, lon: number) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${ENV.openWeatherKey}`;
  const res = await axios.get(url);
  return res.data;
};
