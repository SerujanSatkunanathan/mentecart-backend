import { Types, ClientSession } from 'mongoose';
import { CartModel } from '../models/Cart.model';
import { ICart, ICartItem } from '../types';

export class CartRepository {
  async findByUserId(userId: string): Promise<ICart | null> {
    const cart = await CartModel.findOne({ userId }).lean();
    return cart as ICart | null;
  }

  async findOrCreate(userId: string, session?: ClientSession): Promise<ICart> {
    const existing = await CartModel.findOne({ userId }).session(session ?? null).lean();
    if (existing) {
      return existing as unknown as ICart;
    }
    const [created] = await CartModel.create(
      [{ userId, items: [] }],
      { session }
    );
    return created.toObject() as unknown as ICart;
  }

  async addItem(userId: string, item: ICartItem, session?: ClientSession): Promise<ICart> {
    const cart = await CartModel.findOneAndUpdate(
      { userId },
      { $push: { items: item } },
      { new: true, upsert: true, session }
    ).lean();
    return cart as ICart;
  }

  async removeItem(userId: string, itemId: string, session?: ClientSession): Promise<ICart | null> {
    const cart = await CartModel.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: new Types.ObjectId(itemId) } } },
      { new: true, session }
    ).lean();
    return cart as ICart | null;
  }

  async updateItem(
    userId: string,
    itemId: string,
    updates: Partial<ICartItem>,
    session?: ClientSession
  ): Promise<ICart | null> {
    const setFields: Record<string, unknown> = {};
    if (updates.slotId) setFields['items.$.slotId'] = updates.slotId;
    if (updates.price !== undefined) setFields['items.$.price'] = updates.price;
    if (updates.expiresAt) setFields['items.$.expiresAt'] = updates.expiresAt;

    const cart = await CartModel.findOneAndUpdate(
      { userId, 'items._id': new Types.ObjectId(itemId) },
      { $set: setFields },
      { new: true, session }
    ).lean();
    return cart as ICart | null;
  }

  async clearCart(userId: string, session?: ClientSession): Promise<void> {
    await CartModel.findOneAndUpdate(
      { userId },
      { $set: { items: [] } },
      { session }
    );
  }

  async hasItem(userId: string, serviceId: string, slotId: string): Promise<boolean> {
    const cart = await CartModel.findOne({
      userId,
      'items.serviceId': new Types.ObjectId(serviceId),
      'items.slotId': new Types.ObjectId(slotId),
    }).lean();
    return cart !== null;
  }

  async getItemById(userId: string, itemId: string): Promise<ICartItem | null> {
    const cart = await CartModel.findOne(
      { userId, 'items._id': new Types.ObjectId(itemId) },
      { 'items.$': 1 }
    ).lean();
    if (!cart || !cart.items || cart.items.length === 0) return null;
    return cart.items[0] as ICartItem;
  }
}

export const cartRepository = new CartRepository();
