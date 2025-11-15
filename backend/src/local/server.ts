// src/local/server.ts
import { logger } from "../lib/logger.js";
import express from "express";
import { loggerMiddleware } from "../middleware/loggerMiddleware.js";
import { errorMiddleware } from "../middleware/errorMiddleware.js";

import profileRoutes from "../routes/profileRoutes.js";
import weatherRoutes from "../routes/weatherRoutes.js";
import clothesRoutes from "../routes/clothesRoutes.js";

// 全TSのホットリロード用（tsx watch）
import "../services/profileService.js";
import "../services/weatherService.js";
import "../services/clothesService.js";
import "../lib/dynamo.js";
import "../lib/openweather.js";
import "../config/env.js";

const app = express();
app.use(express.json());
app.use(loggerMiddleware);

app.use("/profile", profileRoutes);
app.use("/weather", weatherRoutes);
app.use("/clothes", clothesRoutes);

// 共通エラーハンドラ
app.use(errorMiddleware);

const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Local API server running at http://localhost:${PORT}`);
});
