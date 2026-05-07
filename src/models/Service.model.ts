import mongoose, { Schema, Document } from 'mongoose';
import { IService } from '../types';

export interface IServiceDocument extends Omit<IService, '_id'>, Document {}

const serviceSchema = new Schema<IServiceDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: 1,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    capacityPerSlot: {
      type: Number,
      required: [true, 'Capacity per slot is required'],
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
serviceSchema.index({ category: 1 });
serviceSchema.index({ title: 'text' });

export const ServiceModel = mongoose.model<IServiceDocument>('Service', serviceSchema);
