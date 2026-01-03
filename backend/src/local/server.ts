import { initSecrets } from "../config/secretsBootstrap";
import { createApp } from "../app";
import { logger } from "../lib/logger";

async function start(): Promise<void> {
  await initSecrets();
  const app = createApp();

const PORT = 3000;
  app.listen(PORT, () => {
    logger.info(`Local API server running at http://localhost:${PORT}`);
  });
}

start().catch((err: unknown) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
