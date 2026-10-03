import { createApp } from './app';
import { logger } from './lib/logger';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  logger.info(`PRMS backend listening on http://localhost:${port}`);
});
