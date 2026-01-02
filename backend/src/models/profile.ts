/**
 * ユーザープロフィールモデル
 */
export interface UserProfile {
  userId: string;
  birthday: string;
  gender: "male" | "female" | "other";
  notificationsEnabled: boolean;
  region: string;
  nickname: string;
  family?: Array<{ name: string; birthday: string; gender: "male" | "female" | "other" }>;
}
