import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logger.middleware';
import routes from './routes';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

const swaggerDocument = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'docs/swagger.json'), 'utf8')
);
/**
 * Express app factory.
 * Creates and configures the Express application with all middleware and routes.
 */
export const createApp = (): express.Application => {
  const app = express();

  // ─── Security ────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // ─── Body Parsing ────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Request Logging ─────────────────────────────────────
  app.use(requestLogger);

  // ─── Health Check ────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── API Routes ──────────────────────────────────────────
  app.use('/api/v1', routes);

  // ─── Swagger Documentation ───────────────────────────────
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // ─── 404 Handler ─────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      statusCode: 404,
      message: 'Route not found.',
      errorCode: 'NOT_FOUND',
    });
  });

  // ─── Global Error Handler ────────────────────────────────
  app.use(errorHandler);

  return app;
};
