// src/local/server.ts
import { logger } from "../lib/logger";
import { createApp } from "../app";

const app = createApp();

const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Local API server running at http://localhost:${PORT}`);
});
