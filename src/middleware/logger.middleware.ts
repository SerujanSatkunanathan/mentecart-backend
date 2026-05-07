import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
});

/**
 * Request logger middleware.
 * Assigns a UUID v4 to req.id, attaches x-request-id header,
 * and logs request metadata on response finish.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = uuidv4();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info({
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};

export { logger };
