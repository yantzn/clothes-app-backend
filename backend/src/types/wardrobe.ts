// src/types/wardrobe.ts

// 将来のアフェリエイト連携や検索最適化を見据えた服装レイヤー詳細型

export type LayerSlot =
  | "top_base"
  | "midlayer"
  | "outerwear"
  | "bottom"
  | "legwear"
  | "footwear"
  | "headwear"
  | "handwear"
  | "accessory";

export type ClothingCategory =
  | "tee_short"
  | "tee_long"
  | "shirt"
  | "sweater"
  | "cardigan"
  | "hoodie"
  | "thermal"
  | "jacket_windproof"
  | "coat_down"
  | "coat_fleece"
  | "rain_jacket"
  | "pants"
  | "shorts"
  | "skirt"
  | "leggings"
  | "socks"
  | "hat"
  | "gloves"
  | "scarf"
  | "onesie";

export interface LayerAttributes {
  warmthLevel?: number; // 1-5 目安
  windproof?: boolean;
  waterproof?: boolean;
  breathability?: number; // 1-5 目安
  materials?: string[];
  fit?: "regular" | "loose" | "snug";
  kidSafe?: boolean;
}

export interface LayerSearchHint {
  keywords?: string[];
  filters?: Record<string, string | number | boolean>;
  query?: string;
}

export interface LayerSpec {
  slot: LayerSlot;
  category: ClothingCategory;
  displayName: string;
  attributes?: LayerAttributes;
  search?: LayerSearchHint;
  ageTags?: string[]; // GeneralAgeGroup など
  seasonTags?: string[]; // spring/autumn/summer/winter 等
  affiliate?: { source: string; productId?: string; url?: string };
}
