# AI Coding Agent Instructions for this Repository

Purpose: Enable immediate productive contributions to the clothes recommendation backend (AWS Lambda runtime + local Express mirror; Node.js 22 + TypeScript ESM).

## Architecture Big Picture

- Production flow: API Gateway → Lambda handler (in `backend/src/handlers`) → services → lib → DynamoDB/OpenWeather.
- Local dev flow: Express routes (in `backend/src/routes`) → same Lambda handlers (direct call) via adapter → identical business logic.
- Layering (keep boundaries): handlers = request orchestration & logging; services = business logic; lib = infrastructure (Dynamo, weather, logging); validators = zod schemas; middleware = Express concerns only; rules/models = domain data & transformation.
- Goal: Minimize prod/local drift. Do not duplicate logic in Express route files.

## Core Conventions

- Handlers always: (1) parse body safely, (2) validate with zod `.safeParse`, (3) log START/SUCCESS/FAILED via `lambdaLogger(context)`, (4) call a single service function, (5) shape a minimal response DTO.
- Services must throw explicit `Error` with informative message if preconditions (profile, lat/lon, birthday) missing; handler converts to 500 with generic masked message.
- ESM module style: runtime imports that resolve to transpiled JS often include `.js` suffix (e.g. `../rules/ageClothesMatrix.js`). Maintain this for new cross-file runtime imports to avoid ESM resolution errors after build.
- Validation: Define new schemas in `backend/src/validators/*Schema.ts` using zod; export both schema and inferred type. Use `formatZodError` when returning details (400) and mask deeper internals.
- Logging: Use `lambdaLogger(context)` inside handlers (adds request/function metadata). Use base `logger` elsewhere. Always log a START line including raw + parsed body, a SUCCESS with key domain metrics, and FAILED with `message` + `stack`.

## Error Handling Pattern

- Validation failure: return 400 with `{ error: "Invalid request", details }` and `log.warn`.
- Unexpected error: catch and return 500 with `{ error: "Internal Server Error" }`; never expose internal content in prod.
- Express `errorMiddleware` masks internal error fields in production (`publicMessage` if provided). When authoring middleware-compatible errors, attach `statusCode` + `publicMessage` if you want controlled exposure.

## Data & Domain Logic

- DynamoDB access centralized in `lib/dynamo.ts` via thin helpers `getUser(userId)` / `putUser(item)`; do not access AWS SDK directly from services—extend helpers if needed.
- Clothes recommendation pipeline (`services/clothesService.ts`): fetch profile → compute age (birthday parsing) → map to `AgeGroup` → obtain weather (`lib/openweather.ts`) → categorize temperature (`models/temperature.ts`) → select matrix rule (`rules/ageClothesMatrix.ts`) → assemble `ClothesResponse`. Keep new logic pure & side-effect minimal; throw descriptive errors for missing profile data.
- Age grouping: infant (<1), toddler (<6), child (else). Maintain threshold logic; adjust in one place only (`toAgeGroup`).

## Adding a New Endpoint (Example Workflow)

1. Create zod schema in `validators/*Schema.ts`.
2. Add service function encapsulating business logic (no HTTP specifics).
3. Implement handler in `handlers/*` following `getClothes.ts` pattern (safeParse → validation → log → call service → map result).
4. Register Express route in `routes/*Routes.ts` calling the handler through the local adapter (keep route thin).
5. Ensure logs contain START/SUCCESS/FAILED markers for traceability.

## Local Development & Build

- Install: `npm install` inside `backend/`.
- Run local API (hot reload): `npm run dev` (launches `tsx watch src/local/server.ts`).
- Build (TypeScript → dist): `npm run build`.
- DynamoDB Local: started via `infra/docker-compose.yml`; ensure port `8000` before local data operations.
- ENV config: `config/env.ts` exports `ENV` with `isLocal` and `region`; use `ENV.isLocal` for conditional endpoints (e.g., DynamoDB local).

## Logging & Observability

- Always prefer structured logs with contextual object as first arg; message second (see `lambdaLogger.info({ ... }, msg)` pattern inversion in wrapper).
- Include domain identifiers (e.g., `userId`, temperature category) in SUCCESS lines to support CloudWatch Logs Insights queries.

## Safety & Consistency Rules

- Never replicate business logic in routes; defer to handlers/services.
- Do not bypass zod validation on incoming request bodies.
- Keep thrown errors free of PII; rely on masking in handlers/middleware.
- Preserve ESM import style and `.js` suffix where currently used.
- Keep handler responses JSON with explicit `Content-Type` header.

## Example Reference Snippets

- Handler start log: `log.info("clothes START", { rawBody: event.body, parsed })`.
- Validation check: `const parsed = Schema.safeParse(body); if (!parsed.success) { ... }`.
- Service error throw: `throw new Error("User profile has no birthday: " + userId);`.

Feedback: Please indicate any unclear workflow (tests, deployment, adapter usage) or missing conventions you want documented; I will iterate.
