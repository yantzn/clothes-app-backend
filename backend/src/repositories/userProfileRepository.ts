import type { UserProfile } from "../models/profile";

export interface UserProfileRepository {
  put(profile: UserProfile): Promise<void>;
  getById(userId: string): Promise<UserProfile | undefined>;
  update(userId: string, changes: Partial<UserProfile>): Promise<void>;
  removeFamily(userId: string): Promise<void>;
}
