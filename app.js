import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './src/config/env.js';
import { sequelize } from './src/config/database.js';
import { errorHandler } from './src/middlewares/error-handler.js';
import { notFoundHandler } from './src/middlewares/not-found.js';
import { router } from './src/routes/index.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()), credentials: true }));
app.use(rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, limit: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));
app.use(express.json({ limit: '4mb' }));

app.use(env.API_PREFIX, router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

// Só sobe o servidor quando executado diretamente (`node app.js`); o smoke test importa o `app` sem escutar porta.
if (import.meta.url === `file://${process.argv[1]}`) {
  await sequelize.authenticate();
  app.listen(env.PORT, () => console.log(`MySessions API em http://localhost:${env.PORT}${env.API_PREFIX}`));
}
