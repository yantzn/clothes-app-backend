import type { AgeGroup } from "../models/clothes";
import type { TemperatureCategory } from "../models/temperature";

/*
 * 楽天商品情報
 */
export interface RakutenItem {
  name: string;
  url: string;
  image: string;
  price: number;
  shop: string;
}

// 既存 ClothesResponse を壊さず追加エンドポイント用の拡張レスポンス
export interface ClothesWithProductsResponse {
  userId: string;
  ageGroup: AgeGroup;
  temperature: {
    value: number;
    feelsLike: number;
    category: TemperatureCategory;
  };
  suggestion: {
    summary: string;
    layers: string[];
    notes: string[];
    references: string[];
  };
  products: RakutenItem[];
}
