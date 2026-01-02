import { DynamoUserProfileRepository } from "../repositories/dynamoUserProfileRepository";
import type { UserProfile } from "../models/profile";
import type { SaveProfileInput } from "../validators/profileSchema";
import type { UpdateProfileChanges, UpdateProfileInput } from "../validators/profileUpdateSchema";
import type { FamilyMemberInput } from "../validators/profileFamilySchema";
import { getLatLon } from "../lib/openweather";

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
const repo = new DynamoUserProfileRepository();

export const saveProfileData = async (input: SaveProfileInput, userId: string): Promise<void> => {
  // WHY: 地域文字列から座標をバックエンドで解決し、以降の気象取得を最適化
  const base: Omit<UserProfile, "family"> = {
    userId,
    birthday: input.birthday,
    gender: input.gender,
    notificationsEnabled: input.notificationsEnabled,
    region: input.region,
    nickname: input.nickname,
  };
  const profile: UserProfile = {
    ...base,
    ...(input.family && input.family.length > 0 ? { family: input.family } : {}),
  };

  // WHY: userId パーティションキーで高速参照できる最小セットとして永続化
  await repo.put(profile);
};

/**
 * ユーザープロフィールを取得する
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | undefined> => {
  return repo.getById(userId);
};

/**
 * ユーザープロフィールを更新する（PATCH）
 * - 更新可能フィールド: lat, lon, birthday, gender, notificationsEnabled
 */
export const updateProfileData = async (userId: string, changes: UpdateProfileChanges): Promise<void> => {
  await repo.update(userId, {
    region: changes.region,
    birthday: changes.birthday,
    gender: changes.gender,
    notificationsEnabled: changes.notificationsEnabled,
    nickname: changes.nickname,
  });
};

/**
 * 家族情報を全置換する（PUT）
 * - 入力の配列をそのまま `family` 属性へ保存
 */
export const replaceProfileFamily = async (
  userId: string,
  family: FamilyMemberInput[]
): Promise<void> => {
  if (family.length === 0) {
    // 空配列は家族情報なしとして属性削除
    await repo.removeFamily(userId);
  } else {
    await repo.update(userId, { family });
  }
};
