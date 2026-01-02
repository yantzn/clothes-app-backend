// src/local/server.ts
import { logger } from "../lib/logger";
import express from "express";
import { loggerMiddleware } from "../middleware/loggerMiddleware";
import { errorMiddleware } from "../middleware/errorMiddleware";

import profileRoutes from "../routes/profileRoutes";
import weatherRoutes from "../routes/weatherRoutes";
import homeRoutes from "../routes/homeRoutes";

// 全TSのホットリロード用（tsx watch）
import "../services/profileService";
// removed legacy side-effect imports for retired services
import "../lib/dynamo";
import "../lib/openweather";
import "../config/env";

const app = express();
app.use(loggerMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/profile", profileRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/home", homeRoutes);

// 共通エラーハンドラ
app.use(errorMiddleware);

const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Local API server running at http://localhost:${PORT}`);
});
