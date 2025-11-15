// models/UserProfile.ts
export interface UserProfile {
  userId: string;
  region: string;
  birthday: string;
  gender: string;
  notificationsEnabled: boolean;
  lat: number;
  lon: number;
}
