/**
 * ユーザープロフィールモデル
 */
export interface UserProfile {
  userId: string;
  region?: string;
  birthday: string;
  gender?: "male" | "female" | "other";
  notificationsEnabled: boolean;
  lat: number;
  lon: number;
  nickname?: string;
  family?: Array<{ name: string; birthday: string; gender: "male" | "female" | "other" }>;
}
