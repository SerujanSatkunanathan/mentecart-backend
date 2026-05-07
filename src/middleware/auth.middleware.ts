import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { AppError, JwtPayload } from '../types';

/**
 * JWT authentication middleware.
 * Verifies Bearer token from Authorization header and attaches user to req.
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'NO_TOKEN', 'Authentication required.');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError(401, 'NO_TOKEN', 'Authentication required.');
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User no longer exists.');
    }

    req.user = {
      id: String(user._id),
      name: user.name as string,
      email: user.email as string,
      role: user.role as 'customer' | 'admin',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token.');
  }
};
