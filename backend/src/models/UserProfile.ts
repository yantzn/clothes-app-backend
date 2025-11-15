// ユーザープロフィールの型定義
export interface UserProfile {
  userId: string;
  region: string;
  birthday: string;
  gender?: "male" | "female" | "other";
  notificationsEnabled: boolean;
  lat: number;
  lon: number;
}
