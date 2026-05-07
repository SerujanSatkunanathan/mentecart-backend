import mongoose, { Schema, Document } from 'mongoose';
import { ICart, ICartItem } from '../types';

export interface ICartDocument extends Omit<ICart, '_id'>, Document {}

const cartItemSchema = new Schema<ICartItem>(
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
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { _id: true }
);

const cartSchema = new Schema<ICartDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// unique index already defined inline on userId field via unique: true

// TTL index on cart item expiry (MongoDB handles cleanup)
cartSchema.index({ 'items.expiresAt': 1 }, { expireAfterSeconds: 0 });

export const CartModel = mongoose.model<ICartDocument>('Cart', cartSchema);
