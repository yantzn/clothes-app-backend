# 衣服レコメンド API（Flutter × AWS Lambda × TypeScript）

ユーザーの居住地域・誕生日・性別・気温などの情報から
**最適な服装を提案する API バックエンドシステム** です。

---

## 🚀 概要

- AWS Lambda（本番実行）
- Express（ローカル開発）
- Node.js 22 / TypeScript（ESM）
- DynamoDB / DynamoDB Local
- OpenWeather API
- pino（構造化ログ）
- Flutter モバイルアプリと連携予定

ローカルと本番の挙動を可能な限り一致させる構成で、
ローカルでは Express → Lambda handler（直接呼び出し）で実行します。

---

# 📁 ディレクトリ構成

```text
C:.
├─config
│      env.ts                # dotenv + 型安全ラッパ
│
├─handlers                  # Lambda 本番実行コード
│      getClothes.ts
│      getWeather.ts
│      saveProfile.ts
│
├─lib                       # 共通ライブラリ（心臓部）
│      age.ts
│      dynamo.ts
│      lambdaLogger.ts
│      logger.ts
│      openweather.ts
│
├─local                     # ローカル開発用 Express
│      lambdaAdapter.ts     # Lambda の戻り値 → Express 形式へ変換
│      server.ts            # Express サーバ
│      dummyContext.ts      # Lambda context の疑似オブジェクト
│
├─middleware                # Express ミドルウェア
│      errorMiddleware.ts   # エラー処理（ログ詳細＋レスポンスマスク）
│      loggerMiddleware.ts  # pino-http ロガー
│
├─models
│      UserProfile.ts       # DynamoDB 保存用モデル
│
├─routes                    # Express ルーティング
│      clothesRoutes.ts
│      profileRoutes.ts
│      weatherRoutes.ts
│
└─services                  # ビジネスロジック層
        clothesService.ts   # 気象→服装レコメンド
        profileService.ts   # プロフィール保存/取得
        weatherService.ts   # 天気データ取得
```

---

# 🧠 設計思想（Architecture Design Philosophy）

## 🎯 1. Lambda のビジネスロジックを一元化する

本番：

```
API Gateway → Lambda handler → DynamoDB
```

ローカル：

```
Express → Lambda handler（直接呼び出し） → DynamoDB Local
```

**ビジネスロジックは Lambda handler のみに集約**し、
Express はルーティングのみ行います。

---

## 🔄 2. Express → Lambda handler の直接呼び出し方式

ローカルでは Lambda を起動せず
Express が handler を呼びます：

```ts
const raw = await handler(event, dummyContext);
```

メリット：

- ホットリロード可能
- デバッグ容易（ブレークポイント）
- 本番とローカルの差分最小化
- Serverless Framework / SST と同等の仕組み

---

## 🧱 3. dummyContext による本番模倣

Lambda handler の型：

```ts
(event, context) => ...
```

ローカルには context が無いので、
**ローカル専用 context（dummyContext）を注入**。

```ts
const dummyContext = { awsRequestId: "local-dev" } as any;
```

ログの requestId や LambdaLogger が正しく動作します。

---

## 📝 4. pino による構造化ログ（Local / Lambda 共通）

ローカル：

- pino-pretty による整形ログ
- カラー表示

本番：

- JSON structured log
- CloudWatch Logs Insights で解析しやすい

logger.ts で環境に応じて自動切り替え。

---

## 🧨 5. エラーを決して握りつぶさない

以下すべてを logger.error で必ず出力：

- AxiosError（status/data/url/params）
- DynamoDB エラー（$metadata）
- JSON parse error
- TypeError / SyntaxError
- throw null / undefined も検出

Express の errorMiddleware では：

- ログ：詳細を出力
- レスポンス：マスク（セキュリティ対策）

---

## 🗂 6. レイヤー責務の分離（DDD に近い構成）

| フォルダ   | 役割                                    |
| ---------- | --------------------------------------- |
| handlers   | Lambda の入口（アプリケーショ層）       |
| services   | ビジネスロジック層                      |
| lib        | インフラ層（logger/dynamo/openweather） |
| local      | ローカル実行環境                        |
| middleware | Express ミドルウェア                    |
| routes     | Express ルート定義                      |
| config     | env の型安全化                          |
| models     | DynamoDB モデル定義                     |

---

## 🧷 7. 本番とローカルの差分最小化

| 本番                 | ローカル                 |
| -------------------- | ------------------------ |
| API Gateway → Lambda | Express → Lambda handler |
| CloudWatch Logs      | pino-pretty              |
| DynamoDB             | DynamoDB Local           |
| AWS Context          | dummyContext             |

差分はインフラ部分のみ。
ロジックは完全一致。

---
