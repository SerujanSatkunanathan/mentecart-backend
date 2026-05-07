import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { env } from '../config/env';
import { AppError, IUserPublic, JwtPayload } from '../types';

export class AuthService {
  private generateToken(userId: string, role: string): string {
    const payload: JwtPayload = { userId, role: role as 'customer' | 'admin' };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRY as string,
    } as jwt.SignOptions);
  }

  private toPublicUser(user: Record<string, unknown>): IUserPublic {
    return {
      id: String(user._id),
      name: user.name as string,
      email: user.email as string,
      role: user.role as 'customer' | 'admin',
      createdAt: user.createdAt as Date | undefined,
    };
  }

  async signup(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ token: string; user: IUserPublic }> {
    // Check if email already taken
    const exists = await userRepository.existsByEmail(data.email);
    if (exists) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Email is already registered.');
    }

    const user = await userRepository.create(data);
    const token = this.generateToken(String(user._id), user.role as string);

    return {
      token,
      user: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: IUserPublic }> {
    // Find user with password included
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    // Compare password
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const token = this.generateToken(String(user._id), user.role);

    return {
      token,
      user: this.toPublicUser(user as unknown as Record<string, unknown>),
    };
  }

  async getProfile(userId: string): Promise<IUserPublic> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found.');
    }
    return this.toPublicUser(user as unknown as Record<string, unknown>);
  }
}

export const authService = new AuthService();
