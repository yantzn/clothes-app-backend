
export interface WeatherResponse {
  userId: string;
  lat: number;
  lon: number;
  weather: any; // OpenWeather API のレスポンスそのまま
}
