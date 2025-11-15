import { putUser, getUser } from "../lib/dynamo.js";
import { getLatLon } from "../lib/openweather.js";
import type { UserProfile } from "../models/UserProfile.js";

// プロフィールデータを保存する
export const saveProfileData = async (profile: UserProfile) => {
  const { lat, lon } = await getLatLon(profile.region);

  await putUser({
    ...profile,
    lat,
    lon
  });
};

// プロフィールデータを取得する
export const getUserProfile = async (userId: string) => {
  const res = await getUser(userId);
  return res.Item as UserProfile | undefined;
};
