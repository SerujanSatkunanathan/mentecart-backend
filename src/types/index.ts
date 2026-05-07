import { Types } from 'mongoose';

// ─── User ────────────────────────────────────────────────
export type UserRole = 'customer' | 'admin';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: Date;
}

// ─── Service ─────────────────────────────────────────────
export interface IService {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  imageUrl: string;
  capacityPerSlot: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Slot ────────────────────────────────────────────────
export interface ISlot {
  _id: Types.ObjectId;
  serviceId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  isAvailable?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Cart ────────────────────────────────────────────────
export interface ICartItem {
  _id?: Types.ObjectId;
  serviceId: Types.ObjectId;
  slotId: Types.ObjectId;
  price: number;
  expiresAt: Date;
}

export interface ICart {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItemEnriched {
  _id?: string;
  serviceId: string;
  slotId: string;
  price: number;
  expiresAt: Date;
  service: {
    title: string;
    imageUrl: string;
    duration: number;
  };
  slot: {
    date: Date;
    startTime: string;
    endTime: string;
  };
}

export interface ICartResponse {
  items: ICartItemEnriched[];
  itemCount: number;
  totalAmount: number;
}

// ─── Booking ─────────────────────────────────────────────
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'failed';
export type PaymentMethod = 'payhere' | 'cash' | 'pay_on_arrival';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

export interface IBookingItem {
  serviceId: Types.ObjectId;
  slotId: Types.ObjectId;
  price: number;
}

export interface IStatusHistoryEntry {
  status: BookingStatus;
  at: Date;
  by: string;
}

export interface IBooking {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: IBookingItem[];
  totalAmount: number;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentRef: string | null;
  cancelCutoff: Date;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Booking Audit ───────────────────────────────────────
export interface IBookingAudit {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  from: BookingStatus;
  to: BookingStatus;
  actor: string;
  reason: string;
  at: Date;
}

// ─── JWT ─────────────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── Express augmentation ────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: IUserPublic;
      id?: string;
    }
  }
}

// ─── Pagination ──────────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  hasMore: boolean;
}

// ─── AppError ────────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, errorCode: string, message?: string) {
    super(message || errorCode);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
