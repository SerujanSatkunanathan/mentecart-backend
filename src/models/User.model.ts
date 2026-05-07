import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { IUser, UserRole } from '../types';
import { BCRYPT_SALT_ROUNDS } from '../config/constants';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'admin'] as UserRole[],
      default: 'customer',
    },
  },
  { timestamps: true }
);

// unique index already defined inline on email field via unique: true

// Pre-save hook: hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  next();
});

// Instance method: compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);
