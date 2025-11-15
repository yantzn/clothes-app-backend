// lib/age.ts
export const calculateAge = (birthday: string): number => {
  const b = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();

  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) {
    age--;
  }
  return age;
};

export const ageGroup = (age: number): string => {
  if (age < 1) return "infant";
  if (age < 6) return "toddler";
  if (age < 12) return "child";
  if (age < 20) return "teen";
  if (age < 65) return "adult";
  return "senior";
};
