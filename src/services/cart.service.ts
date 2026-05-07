import { cartRepository } from '../repositories/cart.repository';
import { serviceRepository } from '../repositories/service.repository';
import { SLOT_TTL_MINUTES } from '../config/constants';
import { AppError, ICart, ICartItem, ICartResponse, ICartItemEnriched } from '../types';
import { Types } from 'mongoose';

export class CartService {
  async getCart(userId: string): Promise<ICartResponse> {
    const cart = await cartRepository.findOrCreate(userId);
    return this.enrichCart(cart);
  }

  async addItem(
    userId: string,
    serviceId: string,
    slotId: string
  ): Promise<ICartResponse> {
    // Check for duplicate
    const hasDuplicate = await cartRepository.hasItem(userId, serviceId, slotId);
    if (hasDuplicate) {
      throw new AppError(409, 'DUPLICATE_ITEM', 'This service and slot combination is already in your cart.');
    }

    // Validate service exists
    const service = await serviceRepository.findById(serviceId);
    if (!service) {
      throw new AppError(400, 'SERVICE_NOT_FOUND', 'Service not found.');
    }

    // Validate slot exists and is available
    const slot = await serviceRepository.findSlotById(slotId);
    if (!slot) {
      throw new AppError(400, 'SLOT_NOT_FOUND', 'Slot not found.');
    }

    if (String(slot.serviceId) !== serviceId) {
      throw new AppError(400, 'SLOT_MISMATCH', 'Slot does not belong to the specified service.');
    }

    if (slot.booked >= slot.capacity) {
      throw new AppError(409, 'SLOT_FULL', 'No capacity remaining for this slot.');
    }

    // Check if slot date is in the past
    const now = new Date();
    if (new Date(slot.date) < now) {
      throw new AppError(400, 'SLOT_EXPIRED', 'This slot is in the past.');
    }

    const cartItem: ICartItem = {
      serviceId: new Types.ObjectId(serviceId),
      slotId: new Types.ObjectId(slotId),
      price: service.price,
      expiresAt: new Date(Date.now() + SLOT_TTL_MINUTES * 60 * 1000),
    };

    const cart = await cartRepository.addItem(userId, cartItem);
    return this.enrichCart(cart);
  }

  async updateItem(
    userId: string,
    itemId: string,
    updates: { slotId?: string }
  ): Promise<ICartResponse> {
    // Verify item exists
    const existingItem = await cartRepository.getItemById(userId, itemId);
    if (!existingItem) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Item not found in cart.');
    }

    const updateFields: Partial<ICartItem> = {};

    if (updates.slotId) {
      const slot = await serviceRepository.findSlotById(updates.slotId);
      if (!slot) {
        throw new AppError(400, 'SLOT_NOT_FOUND', 'Slot not found.');
      }
      if (slot.booked >= slot.capacity) {
        throw new AppError(409, 'SLOT_FULL', 'No capacity remaining for this slot.');
      }
      updateFields.slotId = new Types.ObjectId(updates.slotId);
      updateFields.expiresAt = new Date(Date.now() + SLOT_TTL_MINUTES * 60 * 1000);
    }

    const cart = await cartRepository.updateItem(userId, itemId, updateFields);
    if (!cart) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Item not found in cart.');
    }
    return this.enrichCart(cart);
  }

  async removeItem(userId: string, itemId: string): Promise<ICartResponse> {
    // Verify item exists
    const existingItem = await cartRepository.getItemById(userId, itemId);
    if (!existingItem) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Item not found in cart.');
    }

    const cart = await cartRepository.removeItem(userId, itemId);
    if (!cart) {
      throw new AppError(404, 'CART_NOT_FOUND', 'Cart not found.');
    }
    return this.enrichCart(cart);
  }

  private async enrichCart(cart: ICart): Promise<ICartResponse> {
    const enrichedItems: ICartItemEnriched[] = [];

    for (const item of cart.items) {
      const service = await serviceRepository.findById(String(item.serviceId));
      const slot = await serviceRepository.findSlotById(String(item.slotId));

      enrichedItems.push({
        _id: item._id ? String(item._id) : undefined,
        serviceId: String(item.serviceId),
        slotId: String(item.slotId),
        price: item.price,
        expiresAt: item.expiresAt,
        service: service
          ? { title: service.title, imageUrl: service.imageUrl, duration: service.duration }
          : { title: 'Unknown', imageUrl: '', duration: 0 },
        slot: slot
          ? { date: slot.date, startTime: slot.startTime, endTime: slot.endTime }
          : { date: new Date(), startTime: '', endTime: '' },
      });
    }

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.price, 0);

    return {
      items: enrichedItems,
      itemCount: enrichedItems.length,
      totalAmount,
    };
  }
}

export const cartService = new CartService();
