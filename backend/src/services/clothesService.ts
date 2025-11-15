import { getUserProfile } from "./profileService.js";
import { calculateAge, ageGroup } from "../lib/age.js";

export const getClothesSuggestion = async (userId: string, feelsLike: number) => {
  const profile = await getUserProfile(userId);

  if (!profile) {
    throw new Error(`Profile not found for userId: ${userId}`);
  }

  const age = calculateAge(profile.birthday);
  const group = ageGroup(age);

  return {
    suggestion: chooseClothes(feelsLike, group)
  };
};

const chooseClothes = (temp: number, group: string): string[] => {
  let base: string[] = [];

  if (temp <= 10) base = ["コート", "ニット", "長袖シャツ"];
  else if (temp <= 15) base = ["薄手ジャケット", "長袖シャツ"];
  else base = ["長袖シャツ"];

  if (group === "infant") base.push("肌着");
  if (group === "toddler") base.push("薄めのインナー");

  return base;
};
