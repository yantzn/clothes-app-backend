import { z } from "zod";

// POST /weather/hourly ボディスキーマ
export const HourlyWeatherRequestSchema = z.object({
  region: z.string().min(1).max(100),
  limitHours: z.number().int().min(1).max(48).optional()
});

export type HourlyWeatherRequest = z.infer<typeof HourlyWeatherRequestSchema>;
