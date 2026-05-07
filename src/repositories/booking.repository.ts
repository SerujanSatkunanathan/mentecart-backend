import { ClientSession } from 'mongoose';
import { BookingModel } from '../models/Booking.model';
import { BookingAuditModel } from '../models/BookingAudit.model';
import {
  IBooking,
  IBookingItem,
  IBookingAudit,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  IStatusHistoryEntry,
  PaginatedResult,
} from '../types';

export class BookingRepository {
  async create(
    data: {
      userId: string;
      items: IBookingItem[];
      totalAmount: number;
      status: BookingStatus;
      paymentMethod: PaymentMethod;
      paymentStatus: PaymentStatus;
      paymentRef: string | null;
      cancelCutoff: Date;
      statusHistory: IStatusHistoryEntry[];
    },
    session?: ClientSession
  ): Promise<IBooking> {
    const [booking] = await BookingModel.create([data], { session });
    return booking.toObject() as IBooking;
  }

  async findById(id: string, session?: ClientSession): Promise<IBooking | null> {
    const query = BookingModel.findById(id);
    if (session) query.session(session);
    const booking = await query.lean();
    return booking as IBooking | null;
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<IBooking>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      BookingModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BookingModel.countDocuments({ userId }),
    ]);

    return {
      data: data as IBooking[],
      total,
      page,
      hasMore: skip + data.length < total,
    };
  }

  async countUserBookingsForDate(userId: string, date: Date): Promise<number> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return BookingModel.countDocuments({
      userId,
      status: { $in: ['pending', 'confirmed'] },
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });
  }

  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    historyEntry: IStatusHistoryEntry,
    updates: Partial<{
      paymentStatus: PaymentStatus;
      paymentRef: string;
    }>,
    session?: ClientSession
  ): Promise<IBooking | null> {
    const setFields: Record<string, unknown> = {
      status,
      ...updates,
    };

    const booking = await BookingModel.findByIdAndUpdate(
      bookingId,
      {
        $set: setFields,
        $push: { statusHistory: historyEntry },
      },
      { new: true, session }
    ).lean();
    return booking as IBooking | null;
  }

  async createAudit(
    data: Omit<IBookingAudit, '_id'>,
    session?: ClientSession
  ): Promise<IBookingAudit> {
    const [audit] = await BookingAuditModel.create([data], { session });
    return audit.toObject() as IBookingAudit;
  }

  async findByPaymentRef(paymentRef: string): Promise<IBooking | null> {
    const booking = await BookingModel.findOne({ paymentRef }).lean();
    return booking as IBooking | null;
  }
}

export const bookingRepository = new BookingRepository();
