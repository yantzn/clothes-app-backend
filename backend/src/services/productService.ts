import { rakutenClient } from "../lib/rakutenClient";
import type { RakutenItem } from "../types/rakuten";
import { logger } from "../lib/logger";
import { mapLayerToKeyword } from "../rules/rakutenKeywords.js";
import type { AgeGroup } from "../models/clothes";

/**
 * 推奨された衣服レイヤ配列を年齢適合キーワードへ変換し、楽天 API から商品候補を取得する。
 * 年齢 (AgeGroup) により同じレイヤでも乳幼児特有語（例: romper 等）へ補正される。
 *
 * 目的:
 * - レコメンド結果へ購入可能な具体例を添付しユーザ体験を向上。
 * - 重複キーワードを除去し不要な API 呼び出しとレイテンシを抑制。
 *
 * ドメイン背景:
 * - レイヤは防寒/調温構成 (base-layer, mid-layer, outer 等) を表し、年齢により素材/名称が変化。
 * - 一部レイヤは検索不要（空文字）を返すためフィルタ対象。
 *
 * パラメータ:
 * - ageGroup: 年齢カテゴリ。キーワード補正に使用。
 * - layers: 推奨レイヤ名配列。
 * - hitsPerLayer: 1 キーワードあたり取得件数 (デフォルト 3: 多様性と速度のバランス)。
 * - userId: ログ相関用 ID (任意)。
 *
 * 戻り値:
 * - URL をキーに重複除去した商品候補フラット配列。検索結果順を概ね維持。
 *
 * 注意 / 今後:
 * - キャッシュ / 関連度スコアによる再順位付け余地あり。
 * - レート制限対策としてユニーク化後に Promise.all で並列取得。
 */
export const getProductsForLayers = async (
  ageGroup: AgeGroup,
  layers: string[],
  hitsPerLayer: number = 3,
  userId?: string
): Promise<RakutenItem[]> => {
  const keywords = layers.map(layer => mapLayerToKeyword(ageGroup, layer));
  // レイヤ名を年齢適合語へ変換し乳幼児特有語を反映
  const uniqueKeywords = Array.from(new Set(keywords)).filter(k => k.length > 0);
  // 空語彙を除去 + 重複排除で API 呼び出し最小化

  const productResults: RakutenItem[][] = await Promise.all(
    uniqueKeywords.map(k => rakutenClient.searchItems(k, hitsPerLayer))
  );
  // 並列取得で総待機時間を短縮 (逐次呼び出しより高速)

  const flat: RakutenItem[] = [];
  const seen = new Set<string>();
  for (const arr of productResults) {
    for (const item of arr) {
      if (!seen.has(item.url)) {
        // URL を安定キーとして重複商品排除 (タイトルより衝突が少ない)
        seen.add(item.url);
        flat.push(item);
      }
    }
  }

  logger.info({ userId, productCount: flat.length }, "Rakuten products fetched");
  // 取得件数をメトリクス化し品質・レート制御評価に活用
  return flat;
};
