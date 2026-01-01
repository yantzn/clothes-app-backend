/**
 * saveProfile API（POST /profile）
 * 成功レスポンス
 */
export interface SaveProfileResponse {
  message: string;
  userId: string;
}

/** 家族情報（任意最大10件） */
export interface FamilyMember {
  name: string;
  birthday: string; // YYYY-MM-DD
  gender: "male" | "female" | "other";
}

/** GET /profile のレスポンス */
export interface GetProfileResponse {
  userId: string;
  lat: number;
  lon: number;
  birthday: string;
  gender?: "male" | "female" | "other";
  notificationsEnabled: boolean;
  nickname?: string;
  family: FamilyMember[];
}
