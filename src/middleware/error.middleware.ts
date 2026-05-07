import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types';

/**
 * Global error-handling middleware.
 * Express identifies error middleware by its 4-argument signature.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── AppError (operational) ──
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      errorCode: err.errorCode,
    });
    return;
  }

  // ── Zod validation error ──
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      statusCode: 400,
      message: 'Validation failed.',
      errorCode: 'VALIDATION_ERROR',
      errors,
    });
    return;
  }

  // ── Mongoose CastError (invalid ObjectId, etc.) ──
  if (err.name === 'CastError') {
    res.status(400).json({
      statusCode: 400,
      message: 'Invalid ID format.',
      errorCode: 'INVALID_ID',
    });
    return;
  }

  // ── Mongoose duplicate key error (code 11000) ──
  if ((err as unknown as Record<string, unknown>).code === 11000) {
    const keyValue = (err as unknown as Record<string, unknown>).keyValue as Record<string, unknown> | undefined;
    const field = keyValue ? Object.keys(keyValue)[0] : 'unknown';
    res.status(409).json({
      statusCode: 409,
      message: `Duplicate value for field: ${field}.`,
      errorCode: 'DUPLICATE_KEY',
    });
    return;
  }

  // ── Unexpected errors — 500 ──
  console.error('Unhandled error:', err);
  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error.',
    errorCode: 'INTERNAL_ERROR',
  });
};
