import { putUser, getUser } from "../lib/dynamo";
import { getLatLon } from "../lib/openweather";
import type { UserProfile } from "../models/profile";
import type { SaveProfileInput } from "../validators/profileSchema";

/**
 * プロフィールデータを保存する（入力は SaveProfileInput）
 * 内部で lat/lon を解決し、UserProfile に組み立てて保存する
 */
export const saveProfileData = async (input: SaveProfileInput): Promise<void> => {
  // 地域名から緯度経度を取得
  const { lat, lon } = await getLatLon(input.region);

  const profile: UserProfile = {
    ...input,
    lat,
    lon,
  };

  // DynamoDB へ保存
  await putUser(profile);
};

/**
 * ユーザープロフィールを取得する
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | undefined> => {
  const res = await getUser(userId);
  return res.Item as UserProfile | undefined;
};
