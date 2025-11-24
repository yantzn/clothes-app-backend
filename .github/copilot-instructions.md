# AI Coding Agent / GitHub Copilot 用プロジェクト開発ガイドライン

服装提案バックエンド（AWS Lambda × Local Express Mirror × Node.js 22 ×
TypeScript ESM）

---

## 0. このファイルの目的

このファイルは、**GitHub Copilot や AI
コーディングエージェントが、このリポジトリでコードを生成する際に必ず従うべきルール**を定義します。

目的は以下のとおりです：

- 既存の **フォルダ構成・依存関係** を破壊しない
- プロジェクトの **アーキテクチャ原則** を維持する
- **TypeScript + Node.js 22（strict モード）**
  のベストプラクティスを適用する
- アンチパターンを避ける
- 高い **テスタビリティ・観測性・セキュリティ** を保証する
- **乳児・幼児・児童の服装レコメンドドメイン**
  の知識に基づいたコード生成を行う

---

## 1. アーキテクチャ概要（Big Picture）

### 1.1 実行フロー

#### 本番（AWS Lambda）

    API Gateway → Lambda handler（handlers/） → services → lib → DynamoDB / OpenWeather

#### ローカル（Express ミラー）

    Express routes（routes/）
      → lambdaAdapter（local/lambdaAdapter.ts）
      → Lambda handlers（handlers/）
      → services → lib → DynamoDB Local / OpenWeather

**ポイント:**\
\> ローカルと本番でロジックを完全共有し、差分を最小化する。\
\> Express 側にビジネスロジックを書いてはいけない。

### 1.2 レイヤー構造（Responsibilities）

| レイヤ                  | フォルダ                     | 役割                                                       |
| ----------------------- | ---------------------------- | ---------------------------------------------------------- |
| Lambda エントリ         | handlers/                    | バリデーション、ログ、サービス呼び出し、レスポンス生成     |
| ビジネスロジック        | services/                    | ドメインロジックの中心。HTTP 依存禁止                      |
| インフラ層              | lib/                         | Dynamo、HTTP クライアント、OpenWeather、logger、Age 計算等 |
| バリデーション          | validators/                  | Zod スキーマ。Handler による SafeParse 前提                |
| Express（ローカル専用） | routes/, middleware/, local/ | ルーティングとローカルサーバ                               |
| ルール定義              | rules/                       | 年齢 × 気温マトリクス、医学的安全指標など                  |
| ドメインモデル          | models/                      | 気温、プロフィール、服装などのモデル変換                   |
| 型                      | types/                       | API 入出力・ドメイン型                                     |
| 環境変数                | config/                      | env.ts に型安全な ENV ラッパ                               |

---

## 2. フォルダ構成 & 依存ルール（CRITICAL）

### 2.1 現在のフォルダ構成

```text
├─config
├─errors
├─handlers
├─lib
├─local
├─middleware
├─models
├─routes
├─rules
├─services
├─types
└─validators

```

### 2.2 許可される依存方向（絶対遵守）

Copilot は以下の **依存方向** を守らなければならない：

- `handlers` → `services`, `validators`, `lib`, `errors`, `types`
- `services` → `lib`, `rules`, `models`, `types`, `errors`
- `lib` → `config`, `types`, `errors`
  - **絶対に services や handlers を import してはいけない**
- `validators` → `types`
- `routes` → `handlers`（ローカルアダプタ経由）、`middleware`, `types`
- `middleware` → `lib`, `errors`, `types`
- `models` → `types`, `rules`
- `rules` →（独立、他層を import しない）
- `local` → `routes`, `handlers`, `middleware`, `lib`, `config`
- `errors` → `types`

### 絶対にやってはいけない例

- `services` → `handlers`
- `lib` → `services`
- 循環 import（どんな形でも禁止）
- `routes` にビジネスロジックを書く

---

## 3. ハンドラー（Lambda Handler）の規約

ハンドラーは **以下の 5 ステップ** を必ず守る：

1. **body を安全にパース**する
2. **Zod.safeParse でバリデーション**
3. `lambdaLogger(context)` で `START` をログ出力
4. `services/*` の関数を 1 つだけ呼ぶ
5. レスポンス DTO を構築し、例外をマスクして返す

### ハンドラーの動作順序はこうあるべき：

START → validate → call service → SUCCESS → return result
catch → FAILED → masked error

---

## 4. サービス層の規約（Business Logic）

サービスは：

- HTTP を知らない（statusCode を返さない）
- Zod を知らない（handler で済ませる）
- ログは必要最小限（主に handler でログ管理）
- Dynamo や API は lib/ 経由でしか触れない
- 例外は **Error（または custom error）を throw** する

サービス層は **純粋または副作用最小** であること。

---

## 5. ESM + `.js` 拡張子の扱い（重要）

TypeScript ESM ＋ tsc emit では、**ランタイムで .js が必要**。

Copilot は：

- 既存ファイルに合わせ **相対 import の末尾に拡張子は付けない**
- CJS（require/module.exports）は一切使わない
- import/export は ESM のみ

例：

```ts
import { ageClothesMatrix } from "../rules/ageClothesMatrix";
```

---

## 6. バリデーション（Zod）

新しい API 追加時：

必ず validators/\*Schema.ts に Zod スキーマを作る

export type Xxx = z.infer<typeof XxxSchema> をセットで定義

handler では safeParse のみ使用

例：

```ts
const parsed = Schema.safeParse(body);
if (!parsed.success) {
  // 400 and formatted error
}
```

---

## 7. ロギングと観測性

### 7.1 handler 内

- lambdaLogger(context) を使用

- ログは：

  - START（入力）

  - SUCCESS（主要指標）

  - FAILED（message + stack）

### 7.2 services と lib 内

- logger（pino）を使用
- 構造化ログ：

```ts
logger.info({ userId, ageGroup }, "Calculating recommendation");
```

### 7.3 Express（ローカル）

- loggerMiddleware でリクエストログ
- errorMiddleware で内部情報をマスクして 500 を返す

---

## 8. エラーハンドリング規約

### バリデーション失敗（Zod）

- **HTTP 400**
- レスポンス例：
  ```json
  {
    "error": "Invalid request",
    "details": { ... }
  }
  ```
- ログレベル：`log.warn`

### ドメインエラー（サービス）

- handler が catch する

  - **既知エラー → 適切な 4xx にマッピング**
  - **未知エラー → 500**

- 内部エラーメッセージはクライアントへ返さない
  （**ログにのみ記録**し、レスポンスは安全なメッセージにマスクする）

### 予期しない例外（Unhandled Exception）

- **常に 500 を返す**
- **Stack trace はクライアントへ返さない（ログにのみ記録する）**
- handler または Express の `errorMiddleware` が
  **安全なメッセージにマスクしたレスポンスを返却する**

---

## 9. ドメイン知識（服装レコメンドの仕組み）

Copilot は次を理解してコード生成する。

### 入力

- 年齢（月齢 → AgeGroup）
- 天気（気温・風・降水）
- プロフィール（性別など）
- 気温分類（`models/temperature.ts`）

### ルール

- `rules/ageClothesMatrix.ts`
  年齢 × 温度帯 に基づく推奨服装マトリクス
- `rules/medicalReferences.ts`
  医学的観点による注意点・補正ロジック

### 出力

- 推奨衣服リスト
- 状況に応じた注意事項（風が強い・体温調整の必要など）

---

## 10. 新規エンドポイント追加フロー

Copilot は以下の手順を必ず厳守する。

1. **Zod スキーマを作成する**

   - `validators/*Schema.ts` にリクエスト用スキーマを定義する
   - `.safeParse` を使用する前提でスキーマを設計する

2. **型定義を追加する**

   - 必要であれば `types/*` に DTO / レスポンス型を追加する
   - `z.infer` による型推論を活用すること

3. **サービス層にビジネスロジックを実装する**

   - `services/*Service.ts` に実装
   - HTTP やバリデーションロジックをサービスに書かない
   - Dynamo・API 呼び出しは必ず `lib/*` 経由で行う

4. **ハンドラー（Lambda エントリ）を実装する**

   - `handlers/*` に新しい handler を作成
   - フローは **safeParse → log → service 呼び出し → DTO 構築**
   - エラー時は **マスクされたメッセージ** を返す

5. **Express ルートを設定する（ローカル環境用）**

   - `routes/*Routes.ts` に追加
   - ルートでは **ビジネスロジックを書かず**、`lambdaAdapter` 経由で handler を呼び出す

6. **テストを追加する**
   - サービス層のドメインロジックをテストする
   - handler ではバリデーションとエラー処理（400/500）をテストする
   - 外部 API や Dynamo はモックを使用する

---

## 11. TypeScript Strict Mode

このプロジェクトは `tsconfig.json` で **"strict": true** を前提とする。

strict モードに含まれる主要ルール：

- **noImplicitAny**
  暗黙の `any` を禁止する

- **strictNullChecks**
  `null` / `undefined` を型として安全に扱う

- **strictPropertyInitialization**
  クラスプロパティの未初期化を禁止する

- **strictFunctionTypes**
  関数の型チェックを厳密にする

- **noUnusedLocals**
  未使用のローカル変数を禁止する

- **noUnusedParameters**
  未使用の関数引数を禁止する

---

### 特に重要なポイント

- **暗黙の any を絶対に禁止する**
  → すべての変数・関数引数に明示的な型が必要

- **null / undefined の安全管理を徹底する**
  → `| null`, `| undefined` などの型を明示的に扱うこと
  → 非 null 確定には `if (!value) return;` や `value ?? fallback` を使用

- **クラスプロパティは必ず初期化する**
  → コンストラクタで確実にセットする
  → または `!:` ノンヌラブルアサーションを必要最小限で使用する

---

## 12. 命名規則

プロジェクト内での命名は、以下の規則に従う。

### 基本ルール

- **ファイル名**：既存スタイルに合わせる
  例：`clothesService.ts`, `openweatherClient.ts`

- **クラス名**：`PascalCase`
  例：`ClothesService`, `OpenWeatherClient`

- **関数名**：`camelCase`
  例：`getClothesRecommendation()`

- **変数名**：`camelCase`
  例：`userId`, `ageGroup`, `temperatureCelsius`

- **定数**：`SCREAMING_SNAKE_CASE`
  例：`DEFAULT_REGION`, `OPENWEATHER_ENDPOINT`

- **型 / インターフェース**：`PascalCase`
  例：`ClothesRequest`, `WeatherResponse`

- **API パス**：`kebab-case`
  例：`/v1/clothes`, `/v1/weather/daily`

---

### ドメイン語彙の使用（重要）

ドメイン固有の言葉をそのまま英語で表現する。
抽象的・曖昧な名前は避ける。

例：

- `childAgeInMonths`
- `temperatureCelsius`
- `ageGroup`
- `clothesRecommendation`
- `feelsLikeTemperature`
- `precipitationProbability`
- `windSpeed`

---

### 基本ポリシー

- 「何を表すか」が直感的に理解できる名前にする
- 省略語は使わない（domain・tech 用語のみ OK）
- 既存コードの文脈・語彙に統一する
- 関数は動詞 + 名詞、型は名詞で命名する

## 13. コメント規約

Copilot はコード生成時に、以下のコメントルールを必ず守る。

### 基本方針

- **自明なコメントは禁止する**
  （例：`// カウンターを1増やす` のような行動説明は不要）
- **「何をしているか」ではなく「なぜそうするのか」を書く**
- **handler や service の公開関数には TSDoc を付与する**

### TSDoc コメントの例

```ts
/**
 * 年齢と気象条件から服装推奨セットを返す。
 * - 年齢（月齢）から AgeGroup を算出
 * - 気温カテゴリに対応したマトリクスを参照
 * - 必要に応じて医学的な注意点を付与
 */
```

### TODO コメント

- TODO には 目的と意図 を必ず書く
  （例：// TODO: 湿度による体感温度補正ロジックを追加する）

### コメントを削減すべきケース

- コード自体が明確で、命名が適切な場合はコメントを追加しない

- コメントを書くよりも、関数分割や命名によって意図を明確にすることを優先する

---
