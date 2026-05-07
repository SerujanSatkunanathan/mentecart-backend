import { ClientSession } from 'mongoose';
import { ServiceModel } from '../models/Service.model';
import { SlotModel } from '../models/Slot.model';
import { IService, ISlot, PaginatedResult } from '../types';

export class ServiceRepository {
  async findAll(options: {
    page: number;
    limit: number;
    category?: string;
    search?: string;
  }): Promise<PaginatedResult<IService>> {
    const { page, limit, category, search } = options;
    const filter: Record<string, unknown> = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ServiceModel.find(filter).skip(skip).limit(limit).lean(),
      ServiceModel.countDocuments(filter),
    ]);

    return {
      data: data as IService[],
      total,
      page,
      hasMore: skip + data.length < total,
    };
  }

  async findById(id: string): Promise<IService | null> {
    const service = await ServiceModel.findById(id).lean();
    return service as IService | null;
  }

  async findAvailableSlots(serviceId: string, fromDate: Date, toDate: Date): Promise<ISlot[]> {
    const slots = await SlotModel.find({
      serviceId,
      date: { $gte: fromDate, $lte: toDate },
      $expr: { $lt: ['$booked', '$capacity'] },
    })
      .sort({ date: 1, startTime: 1 })
      .lean({ virtuals: true });
    return slots as ISlot[];
  }

  async findSlotById(slotId: string, session?: ClientSession): Promise<ISlot | null> {
    const query = SlotModel.findById(slotId);
    if (session) query.session(session);
    const slot = await query.lean({ virtuals: true });
    return slot as ISlot | null;
  }

  /**
   * Atomically increment booked count. Returns null if slot is full.
   * This is THE critical overbooking-prevention operation.
   */
  async incrementSlotBooked(slotId: string, session?: ClientSession): Promise<ISlot | null> {
    const slot = await SlotModel.findOneAndUpdate(
      {
        _id: slotId,
        $expr: { $lt: ['$booked', '$capacity'] },
      },
      { $inc: { booked: 1 } },
      { new: true, session }
    ).lean({ virtuals: true });
    return slot as ISlot | null;
  }

  /**
   * Release capacity by decrementing booked count.
   */
  async decrementSlotBooked(slotId: string, session?: ClientSession): Promise<ISlot | null> {
    const slot = await SlotModel.findOneAndUpdate(
      { _id: slotId, booked: { $gt: 0 } },
      { $inc: { booked: -1 } },
      { new: true, session }
    ).lean({ virtuals: true });
    return slot as ISlot | null;
  }
}

export const serviceRepository = new ServiceRepository();
