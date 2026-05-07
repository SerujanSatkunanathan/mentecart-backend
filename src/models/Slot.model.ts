import mongoose, { Schema, Document } from 'mongoose';
import { ISlot } from '../types';

export interface ISlotDocument extends Omit<ISlot, '_id'>, Document {}

const slotSchema = new Schema<ISlotDocument>(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    booked: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: isAvailable
slotSchema.virtual('isAvailable').get(function () {
  return this.booked < this.capacity;
});

// Compound unique index — prevents duplicate slots
slotSchema.index({ serviceId: 1, date: 1, startTime: 1 }, { unique: true });

export const SlotModel = mongoose.model<ISlotDocument>('Slot', slotSchema);
