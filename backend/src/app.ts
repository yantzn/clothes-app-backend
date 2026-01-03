import express from "express";
import { loggerMiddleware } from "./middleware/loggerMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";

import profileRoutes from "./routes/profileRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import homeRoutes from "./routes/homeRoutes";

// 依存の初期化順序に注意：ENV を先にロードし、その後インフラ層を初期化
import "./config/env";
import "./lib/dynamo";
import "./lib/openweather";
import "./services/profileService";

export const createApp = () => {
  const app = express();
  app.use(loggerMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/profile", profileRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/home", homeRoutes);

  app.use(errorMiddleware);
  return app;
};
