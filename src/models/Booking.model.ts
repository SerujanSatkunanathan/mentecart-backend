import mongoose, { Schema, Document } from 'mongoose';
import {
  IBooking,
  IBookingItem,
  IStatusHistoryEntry,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types';

export interface IBookingDocument extends Omit<IBooking, '_id'>, Document {}

const bookingItemSchema = new Schema<IBookingItem>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    slotId: {
      type: Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const statusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'failed'] as BookingStatus[],
      required: true,
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    by: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const bookingSchema = new Schema<IBookingDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [bookingItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'failed'] as BookingStatus[],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['payhere', 'cash', 'pay_on_arrival'] as PaymentMethod[],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'] as PaymentStatus[],
      default: 'unpaid',
    },
    paymentRef: {
      type: String,
      default: null,
    },
    cancelCutoff: {
      type: Date,
      required: true,
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes
bookingSchema.index({ userId: 1 });
bookingSchema.index({ status: 1 });

export const BookingModel = mongoose.model<IBookingDocument>('Booking', bookingSchema);
