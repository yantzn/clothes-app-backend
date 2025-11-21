import { AGE_CLOTHES_MATRIX } from "../rules/ageClothesMatrix.js";
import { categorizeTemperature } from "../models/temperature.js";
import type { AgeGroup } from "../models/clothes.js";
import type { ClothesResponse } from "../types/clothes.js";
import { getUserProfile } from "./profileService.js";
import { getWeather } from "../lib/openweather.js";

/**
 * 誕生日（YYYY-MM-DD）から年齢（年）をざっくり算出
 */
const calculateAgeYears = (birthday: string): number => {
  const today = new Date();
  const [y, m, d] = birthday.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return 0;

  const birth = new Date(y, m - 1, d);
  let age = today.getFullYear() - birth.getFullYear();

  const hasNotHadBirthdayThisYear =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());

  if (hasNotHadBirthdayThisYear) {
    age--;
  }

  return age < 0 ? 0 : age;
};

/**
 * 年齢(年)から AgeGroup を推定
 */
const toAgeGroup = (ageYears: number): AgeGroup => {
  if (ageYears < 1) return "infant";
  if (ageYears < 6) return "toddler";
  return "child";
};

/**
 * ユーザーIDをもとに、現在の天気・年齢・医学ルールを組み合わせて服装提案を返す
 */
export const getClothes = async (userId: string): Promise<ClothesResponse> => {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new Error(`User not found: ${userId}`);
  }

  if (!profile.lat || !profile.lon) {
    throw new Error(`User profile has no location (lat/lon): ${userId}`);
  }

  if (!profile.birthday) {
    throw new Error(`User profile has no birthday: ${userId}`);
  }

  const ageYears = calculateAgeYears(profile.birthday);
  const ageGroup = toAgeGroup(ageYears);

  const weather = await getWeather(profile.lat, profile.lon);
  const temp = weather.main.temp;
  const feelsLike = weather.main.feels_like ?? temp;

  const category = categorizeTemperature(feelsLike);

  const rule = AGE_CLOTHES_MATRIX[ageGroup][category];

  return {
    userId,
    ageGroup,
    temperature: {
      value: temp,
      feelsLike,
      category
    },
    suggestion: {
      summary: rule.summary,
      layers: rule.layers,
      notes: rule.notes,
      references: rule.references
    }
  };
};
