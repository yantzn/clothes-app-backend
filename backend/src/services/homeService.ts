import { openWeatherClient } from "../lib/openweatherClient";
import { categorizeTemperature } from "../models/temperature";
import { AGE_CLOTHES_MATRIX } from "../rules/ageClothesMatrix";
import type { AgeGroup } from "../models/clothes";
import type { HomeMemberCard, HomeTodayResult } from "../types/home";
import type { UserProfile } from "../models/profile";
import { DynamoUserProfileRepository } from "../repositories/dynamoUserProfileRepository";

const repo = new DynamoUserProfileRepository();

const calculateAgeYears = (birthday: string): number => {
  const today = new Date();
  const [y, m, d] = birthday.split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return 0;
  const birth = new Date(y, m - 1, d);
  let age = today.getFullYear() - birth.getFullYear();
  const hasNotHadBirthdayThisYear =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (hasNotHadBirthdayThisYear) age--;
  return age < 0 ? 0 : age;
};

const toAgeGroup = (ageYears: number): AgeGroup => {
  if (ageYears < 1) return "infant";
  if (ageYears < 6) return "toddler";
  return "child";
};

// 型は types/home に集約

export const getHomeToday = async (userId: string): Promise<HomeTodayResult> => {
  const profile: UserProfile | undefined = await repo.getById(userId);
  if (!profile || profile.lat == null || profile.lon == null) {
    throw new Error(`User profile not found or missing location: ${userId}`);
  }

  const weatherRaw = await openWeatherClient.getWeather(profile.lat, profile.lon);
  const temp = weatherRaw.main?.temp as number;
  const feelsLike = (weatherRaw.main?.feels_like ?? temp) as number;
  const humidity = weatherRaw.main?.humidity as number;
  const windSpeed = weatherRaw.wind?.speed as number;
  const region = (weatherRaw.name as string) || profile.region || "";
  const conditionSource = Array.isArray(weatherRaw.weather) && weatherRaw.weather[0]?.main
    ? String(weatherRaw.weather[0].main)
    : "";
  const condition = conditionSource.toLowerCase();

  const category = categorizeTemperature(feelsLike);

  // Main user card
  const userAgeYears = calculateAgeYears(profile.birthday);
  const userAgeGroup = toAgeGroup(userAgeYears);
  const userRule = AGE_CLOTHES_MATRIX[userAgeGroup][category];

  const members: HomeMemberCard[] = [
    {
      name: profile.nickname ?? "あなた",
      ageGroup: userAgeGroup,
      suggestion: {
        summary: userRule.summary,
        layers: userRule.layers,
        notes: userRule.notes,
        references: userRule.references
      }
    }
  ];

  // Family cards (use parent's location and current weather)
  for (const fam of profile.family ?? []) {
    const famAgeYears = calculateAgeYears(fam.birthday);
    const famAgeGroup = toAgeGroup(famAgeYears);
    const famRule = AGE_CLOTHES_MATRIX[famAgeGroup][category];
    members.push({
      name: fam.name,
      ageGroup: famAgeGroup,
      suggestion: {
        summary: famRule.summary,
        layers: famRule.layers,
        notes: famRule.notes,
        references: famRule.references
      }
    });
  }

  const summary = userRule.summary; // 今日のひとこととして主カードの要約を使用

  return {
    summary,
    weather: {
      region,
      value: temp,
      feelsLike,
      humidity,
      windSpeed,
      category,
      condition
    },
    members
  };
};
