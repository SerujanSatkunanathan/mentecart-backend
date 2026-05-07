import mongoose, { Schema, Document } from 'mongoose';
import { IBookingAudit, BookingStatus } from '../types';

export interface IBookingAuditDocument extends Omit<IBookingAudit, '_id'>, Document {}

const bookingAuditSchema = new Schema<IBookingAuditDocument>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    from: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'failed'] as BookingStatus[],
      required: true,
    },
    to: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'failed'] as BookingStatus[],
      required: true,
    },
    actor: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    at: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Index for querying audit trail by booking
bookingAuditSchema.index({ bookingId: 1 });

export const BookingAuditModel = mongoose.model<IBookingAuditDocument>(
  'BookingAudit',
  bookingAuditSchema
);
