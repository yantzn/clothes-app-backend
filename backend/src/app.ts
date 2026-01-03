import express from "express";
import { loggerMiddleware } from "./middleware/loggerMiddleware";
import { errorMiddleware } from "./middleware/errorMiddleware";

import profileRoutes from "./routes/profileRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import homeRoutes from "./routes/homeRoutes";

import "./services/profileService";
import "./lib/dynamo";
import "./lib/openweather";
import "./config/env";

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
