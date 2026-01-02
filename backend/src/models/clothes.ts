// src/models/clothes.ts

import type { TemperatureCategory } from "./temperature";

/**
 * 年齢区分
 * - infant  : 乳児（おおよそ 0〜1歳）
 * - toddler : 幼児（おおよそ 1〜5歳）
 * - child   : 児童（おおよそ 6〜12歳）
 */
export type AgeGroup = "infant" | "toddler" | "child";

/**
 * 年齢別 × 温度帯別の服装提案 1 件分
 */
export interface AgeClothesSuggestion {
  /**
   * 親向けの簡単な説明文
   */
  summary: string;

  /**
   * 具体的な服装の例（レイヤー）
   */
  layers: string[];

  /**
   * 注意点・医学的な観点からのコメント
   */
  notes: string[];

}

/**
 * 温度帯別の服装マトリクス用の型
 */
export type AgeClothesMatrix = Record<
  AgeGroup,
  Record<TemperatureCategory, AgeClothesSuggestion>
>;
