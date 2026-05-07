import { ClientSession } from 'mongoose';
import { UserModel } from '../models/User.model';
import { IUser } from '../types';

export class UserRepository {
  async create(data: { name: string; email: string; password: string; role?: string }, session?: ClientSession): Promise<Omit<IUser, 'password'>> {
    const [user] = await UserModel.create([data], { session });
    const obj = user.toObject() as unknown as Record<string, unknown>;
    delete obj.password;
    return obj as unknown as Omit<IUser, 'password'>;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const user = await UserModel.findOne({ email }).select('+password').lean();
    return user as IUser | null;
  }

  async findById(id: string): Promise<Omit<IUser, 'password'> | null> {
    const user = await UserModel.findById(id).lean();
    return user as Omit<IUser, 'password'> | null;
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    const user = await UserModel.findById(id).select('+password').lean();
    return user as IUser | null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
