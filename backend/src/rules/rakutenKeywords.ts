import type { AgeGroup } from "../models/clothes";

/**
 * 楽天商品検索の keyword 生成ロジック
 *
 * 目的:
 * - 服装レイヤー説明（自然文）と年齢層から、検索精度の高い語句列を合成する。
 * - 表記ゆれを正規化し、年齢コンテキスト（ベビー/キッズ等）で検索結果の関連性を上げる。
 *
 * 設計意図（rules レイヤのポリシー）:
 * - ここでは純粋に「ルール（語彙・マッピング）」のみを扱う。HTTP や外部 IO は他レイヤへ委譲。
 * - 正規表現と最小限の正規化のみで説明テキストから代表カテゴリを抽出する。
 */

// キーワード抽出用の基本トークン一覧
// WHY: 多様な表記（例: セーター/ニット）を検索に強い代表語へ統一するための辞書。
const TOKEN_MAP: { pattern: RegExp; keyword: string }[] = [
  { pattern: /ロンパース|肌着/, keyword: "ロンパース" },
  { pattern: /カバーオール/, keyword: "カバーオール" },
  { pattern: /中綿|ダウン/, keyword: "ダウン" },
  { pattern: /フリース/, keyword: "フリース" },
  { pattern: /アウター|コート|ジャケット/, keyword: "アウター" },
  { pattern: /帽子/, keyword: "帽子" },
  { pattern: /手袋/, keyword: "手袋" },
  { pattern: /靴下|ソックス|ブーティ/, keyword: "靴下" },
  { pattern: /ブランケット/, keyword: "ブランケット" },
  { pattern: /長袖Tシャツ|長袖インナー|長袖シャツ/, keyword: "長袖Tシャツ" },
  { pattern: /半袖Tシャツ|半袖シャツ/, keyword: "半袖Tシャツ" },
  { pattern: /薄手パーカー|パーカー/, keyword: "パーカー" },
  { pattern: /カーディガン/, keyword: "カーディガン" },
  { pattern: /トレーナー|セーター|ニット/, keyword: "トレーナー" },
  { pattern: /短パン|ハーフパンツ/, keyword: "ハーフパンツ" },
  { pattern: /ズボン|パンツ/, keyword: "パンツ" }
];

// 年齢層に応じて検索語へ前置するプレフィックス
// WHY: 同一アイテムでも年齢帯で商品群が分かれるため、関連性の高い結果へバイアスする。
const AGE_PREFIX: Record<AgeGroup, string[]> = {
  infant: ["ベビー"],
  toddler: ["キッズ", "幼児"],
  child: ["キッズ", "子供"]
};

// レイヤー文字列から楽天検索キーワードを生成
/**
 * レイヤー説明と年齢層から、楽天 API の keyword に渡す語句列を生成する。
 *
 * なぜこうするか:
 * - 括弧内注記や中黒等の装飾を除去してから辞書マッチすることで、誤検出を避ける。
 * - 代表語（TOKEN_MAP）へ正規化して表記揺れに強くする。
 * - 年齢プレフィックスを前段に置き、ベビー/キッズカテゴリに属する商品を優先的にヒットさせる。
 *
 * 将来拡張（TODO）:
 * - NFKC 正規化（半角/全角ゆれ吸収）、かなカナ変換の検討。
 * - 英語別名の追加（cardigan/outer 等）や略語（ロンパ 等）の拡充。
 */
export const mapLayerToKeyword = (ageGroup: AgeGroup, layer: string): string => {
  // 1) 軽量な正規化: 補足注記（括弧内）と説明区切りを除去
  const normalized = layer
    .replace(/（.*?）/g, "") // 全角カッコ内除去
    .replace(/\(.*?\)/g, "") // 半角カッコ内除去
    .replace(/[、・]/g, " ") // 説明的区切りをスペースに
    .trim();

  // 2) 代表語の抽出（重複排除のため Set を使用）
  const tokens: Set<string> = new Set();

  for (const { pattern, keyword } of TOKEN_MAP) {
    if (pattern.test(normalized)) {
      tokens.add(keyword);
    }
  }

  // トークンが1つも取れなかった場合は先頭語をフォールバック
  // WHY: 未知語でも最低限の検索が成立するようにする安全策。
  if (tokens.size === 0) {
    const fallback = normalized.split(/\s+/)[0];
    if (fallback) tokens.add(fallback);
  }

  // 年齢プレフィックス付与（既に含まれていなければ）
  // WHY: 年齢帯でヒットする商品群が変わるため、関連性向上を意図して常に前置する。
  const prefixes = AGE_PREFIX[ageGroup];
  for (const p of prefixes) {
    tokens.add(p);
  }

  // 出力: 年齢プレフィックス + アイテムキーワード（順序: prefix優先）
  // NOTE: Set は順序を保証しないため、ここで意図した順に並べ替える。
  const ordered = [
    ...prefixes,
    ...Array.from(tokens).filter(t => !prefixes.includes(t))
  ];

  return ordered.join(" ");
};
