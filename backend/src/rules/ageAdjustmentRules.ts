// rules/ageAdjustmentRules.ts
import type { AgeClothesSuggestion } from "../models/clothes";
import type { TemperatureCategory } from "../models/temperature";
import type { GeneralAgeGroup } from "../types/home";

// 年齢補正思想:
// - infant: 厚着寄せ（既存マトリクスそのまま）
// - toddler: 脱ぎ着前提（既存マトリクスそのまま）
// - child: 基準（既存マトリクスそのまま）
// - teen: 軽装寄せ（中間着・付属品を控えめ）
// - adult: 最小限（必要最低限の重ね着）
// - senior: 現状は基準（child）寄せで安全側

// 文字列上の簡易マッチで削除する対象（日本語表現の部分一致）
const MATCHES = {
  middle: ["トレーナー", "セーター", "フリース", "中間着"],
  heavyOuter: ["中綿", "ダウン", "ボア"],
  accessories: ["帽子", "手袋", "厚手ソックス"],
  lightOuter: ["薄手パーカー", "カーディガン", "羽織"]
};

type AdjustmentRule = {
  remove?: string[]; // 部分一致削除
  preferLightOuter?: boolean; // 薄手羽織を優先（重いアウターは削除）
};

const RULES: Record<GeneralAgeGroup, Record<TemperatureCategory, AdjustmentRule>> = {
  infant: {
    very_cold: {},
    cold: {},
    cool: {},
    mild: {},
    warm: {},
    hot: {}
  },
  toddler: {
    very_cold: {},
    cold: {},
    cool: {},
    mild: {},
    warm: {},
    hot: {}
  },
  child: {
    very_cold: {},
    cold: {},
    cool: {},
    mild: {},
    warm: {},
    hot: {}
  },
  teen: {
    very_cold: { remove: [...MATCHES.accessories] },
    cold: { remove: [...MATCHES.middle, ...MATCHES.accessories] },
    cool: { remove: [...MATCHES.middle, ...MATCHES.accessories], preferLightOuter: true },
    mild: { remove: [...MATCHES.middle, ...MATCHES.accessories], preferLightOuter: true },
    warm: { remove: [...MATCHES.lightOuter, ...MATCHES.accessories] },
    hot: { remove: [...MATCHES.lightOuter, ...MATCHES.accessories] }
  },
  adult: {
    very_cold: { remove: [...MATCHES.middle], /* accessoriesは任意なので残す */ },
    cold: { remove: [...MATCHES.middle, ...MATCHES.accessories] },
    cool: { remove: [...MATCHES.middle, ...MATCHES.accessories], preferLightOuter: true },
    mild: { remove: [...MATCHES.middle, ...MATCHES.accessories], preferLightOuter: true },
    warm: { remove: [...MATCHES.lightOuter, ...MATCHES.accessories] },
    hot: { remove: [...MATCHES.lightOuter, ...MATCHES.accessories] }
  },
  senior: {
    // 安全側: 基準を維持し、暑熱・軽装帯のみ付属品削除
    very_cold: {},
    cold: {},
    cool: {},
    mild: { preferLightOuter: true },
    warm: { remove: [...MATCHES.lightOuter, ...MATCHES.accessories] },
    hot: { remove: [...MATCHES.lightOuter, ...MATCHES.accessories] }
  }
};

const includesAny = (text: string, keywords: string[]): boolean => keywords.some(k => text.includes(k));

/**
 * 年齢補正を既存の提案に適用する
 */
export const applyAgeAdjustment = (
  age: GeneralAgeGroup,
  category: TemperatureCategory,
  base: AgeClothesSuggestion
): AgeClothesSuggestion => {
  const rule = RULES[age][category];
  if (!rule || (!rule.remove && !rule.preferLightOuter)) return base;

  const filteredLayers = base.layers.filter(layer => {
    if (rule.remove && includesAny(layer, rule.remove)) return false;
    if (rule.preferLightOuter && includesAny(layer, MATCHES.heavyOuter)) return false;
    return true;
  });

  // summary はトーン維持のため簡潔に補足
  const summary = base.summary.replace(/。$/u, "") + "。脱ぎ着しやすい構成で過ごしましょう。";

  return {
    summary,
    layers: filteredLayers,
    notes: base.notes
  };
};
