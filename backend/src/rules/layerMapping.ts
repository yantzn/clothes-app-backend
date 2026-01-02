// src/rules/layerMapping.ts
// 文字列ベースのレイヤー名から LayerSpec を生成する簡易マッピング
// ルールは独立のため、外部APIやサービスは参照しない

import type { LayerSpec, LayerSlot, ClothingCategory } from "../types/wardrobe";

const pick = (slot: LayerSlot, category: ClothingCategory, displayName: string, attrs?: Partial<LayerSpec>["attributes"]): LayerSpec => ({
  slot,
  category,
  displayName,
  attributes: attrs ?? {},
});

// 表記ゆれ吸収のための正規化（全角/半角や記号をNFKCに統一）
const normalizeName = (name: string): string => {
  try {
    return name.normalize("NFKC");
  } catch {
    return name; // 古いランタイム等でnormalize未対応ならそのまま
  }
};

export const mapToLayerSpec = (name: string): LayerSpec => {
  const n = normalizeName(name).toLowerCase();
  // トップス
  // より特定的な語を優先して判定
  if (n.includes("ダウン")) return pick("outerwear", "coat_down", name, { warmthLevel: 5 });
  if (n.includes("フリース") || n.includes("ボア")) return pick("outerwear", "coat_fleece", name, { warmthLevel: 4 });
  if (n.includes("レイン") || n.includes("雨")) return pick("outerwear", "rain_jacket", name, { waterproof: true });
  if (n.includes("ロンパース") || n.includes("カバーオール")) return pick("top_base", "onesie", name, { kidSafe: true });
  if (n.includes("インナー") || n.includes("肌着")) return pick("top_base", "thermal", name, { warmthLevel: 2 });
  if (n.includes("トレーナー") || n.includes("セーター") || n.includes("ニット")) return pick("midlayer", "sweater", name, { warmthLevel: 3 });
  if (n.includes("カーディガン")) return pick("midlayer", "cardigan", name, { warmthLevel: 2 });
  if (n.includes("パーカー")) return pick("outerwear", "hoodie", name, { warmthLevel: 2 });
  if (n.includes("半袖") && n.includes("tシャツ")) return pick("top_base", "tee_short", name, { breathability: 3 });
  if (n.includes("長袖") && n.includes("tシャツ")) return pick("top_base", "tee_long", name, { warmthLevel: 2 });
  if (n.includes("半袖") && n.includes("シャツ")) return pick("top_base", "shirt", name, { breathability: 3 });
  if (n.includes("長袖") && n.includes("シャツ")) return pick("top_base", "shirt", name, { warmthLevel: 2 });
  if (n.includes("アウター") || n.includes("コート") || n.includes("ジャケット")) return pick("outerwear", "jacket_windproof", name, { windproof: true, warmthLevel: 3 });

  // ボトムス/付属
  if (n.includes("短パン") || n.includes("ハーフパンツ")) return pick("bottom", "shorts", name);
  if (n.includes("ズボン") || n.includes("パンツ")) return pick("bottom", "pants", name);
  if (n.includes("レギンス")) return pick("legwear", "leggings", name);
  if (n.includes("靴下") || n.includes("ソックス") || n.includes("ブーティ")) return pick("footwear", "socks", name);

  // 小物
  if (n.includes("帽子") || n.includes("ニット帽")) return pick("headwear", "hat", name);
  if (n.includes("手袋")) return pick("handwear", "gloves", name);
  if (n.includes("マフラー") || n.includes("ネックウォーマー")) return pick("accessory", "scarf", name, { kidSafe: false });

  // フォールバック: トップス長袖扱い
  return pick("top_base", "tee_long", name);
};
