import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Middleware factory: validates request body against a Zod schema.
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    schema.parse(req.body);
    next();
  };
};
