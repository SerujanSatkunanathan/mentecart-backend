import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { signupSchema, loginSchema } from '../validators/auth.validator';

/**
 * Auth controller — HTTP parsing only. Zero business logic.
 */
export class AuthController {
  async signup(req: Request, res: Response): Promise<void> {
    const data = signupSchema.parse(req.body);
    const result = await authService.signup(data);
    res.status(201).json(result);
  }

  async login(req: Request, res: Response): Promise<void> {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.status(200).json(result);
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.getProfile(req.user!.id);
    res.status(200).json({ user });
  }
}

export const authController = new AuthController();
