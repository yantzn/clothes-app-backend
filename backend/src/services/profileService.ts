import { putUser, getUser } from "../lib/dynamo";
import { getLatLon } from "../lib/openweather";
import type { UserProfile } from "../models/profile";
import type { SaveProfileInput } from "../validators/profileSchema";

/**
 * ユーザープロフィールを保存する。
 * WHY:
 * - 地域名を緯度経度へ事前解決し永続化時に座標を統合することで、後続の衣服レコメンド/天気取得で毎回ジオ→座標解決を行わずパフォーマンスと外部 API 呼び出し回数を最適化する。
 * - UserProfile へ座標を正規化して保持することで気象依存ロジック（気温・体感温度補正）が単純化しテスト容易性が向上する。
 * - DynamoDB は userId パーティション検索で O(1) 取得を想定しているため、必要属性を一貫したスキーマで保存しレイテンシを低減する。
 *
 * 処理概要:
 * 1. 地域文字列から getLatLon() で (lat, lon) を取得
 * 2. 入力 + 座標を UserProfile 型へ統合
 * 3. putUser() で永続化
 *
 * 引数:
 * - input: バリデーション済みプロフィール (地域・月齢など)
 *
 * 戻り値:
 * - なし (成功時は void、失敗時は例外が伝播)
 *
 * 今後の拡張案:
 * - 地域 -> 座標キャッシュ
 * - プロフィールのバージョニング/履歴
 * - 逆ジオコーディングによる地域名正規化
 */
export const saveProfileData = async (input: SaveProfileInput): Promise<void> => {
  // WHY: 後続処理で複数回使う座標を先に解決し外部 API 再呼び出しを回避
  const { lat, lon } = await getLatLon(input.region);

  const profile: UserProfile = {
    ...input,
    lat,
    lon,
  };

  // WHY: userId パーティションキーで高速参照できる最小セットとして永続化
  await putUser(profile);
};

/**
 * ユーザープロフィールを取得する
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | undefined> => {
  const res = await getUser(userId);
  return res.Item as UserProfile | undefined;
};
