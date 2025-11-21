// src/types/clothes.ts

import type { AgeGroup } from "../models/clothes";
import type { TemperatureCategory } from "../models/temperature";

/**
 * 温度情報
 */
export interface TemperatureInfo {
  value: number; // 実気温
  feelsLike: number; // 体感温度（OpenWeather "feels_like"）
  category: TemperatureCategory;
}

/**
 * 服装提案
 */
export interface ClothesSuggestionPayload {
  summary: string;
  layers: string[];
  notes: string[];
  references: string[];
}

/**
 * Clothes API のレスポンス
 * GET /api/clothes?userId=xxx を想定
 */
export interface ClothesResponse {
  userId: string;
  ageGroup: AgeGroup;
  temperature: TemperatureInfo;
  suggestion: ClothesSuggestionPayload;
}
