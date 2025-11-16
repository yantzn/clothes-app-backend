
// Zod の issue.code -> アプリケーション独自のエラーコード
export const ErrorCodeMap: Record<string, string> = {
  invalid_type: "E001_INVALID_TYPE",        // 型不一致 / 必須項目欠落
  too_small: "E002_TOO_SMALL",             // 文字数不足・最小値未満
  too_big: "E003_TOO_BIG",                 // 最大値超過
  invalid_string: "E004_INVALID_STRING",   // 正規表現・形式不正
  invalid_enum_value: "E005_INVALID_ENUM", // enum の不正値
  custom: "E999_CUSTOM_ERROR"              // superRefine などによる任意エラー
};
