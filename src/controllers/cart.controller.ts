import { Request, Response } from 'express';
import { cartService } from '../services/cart.service';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemIdParamSchema,
} from '../validators/cart.validator';

/**
 * Cart controller — HTTP parsing only. Zero business logic.
 */
export class CartController {
  async getCart(req: Request, res: Response): Promise<void> {
    const cart = await cartService.getCart(req.user!.id);
    res.status(200).json(cart);
  }

  async addItem(req: Request, res: Response): Promise<void> {
    const { serviceId, slotId } = addCartItemSchema.parse(req.body);
    const cart = await cartService.addItem(req.user!.id, serviceId, slotId);
    res.status(201).json({ cart });
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    const { itemId } = cartItemIdParamSchema.parse(req.params);
    const updates = updateCartItemSchema.parse(req.body);
    const cart = await cartService.updateItem(req.user!.id, itemId, updates);
    res.status(200).json({ cart });
  }

  async removeItem(req: Request, res: Response): Promise<void> {
    const { itemId } = cartItemIdParamSchema.parse(req.params);
    const cart = await cartService.removeItem(req.user!.id, itemId);
    res.status(200).json({ cart });
  }
}

export const cartController = new CartController();
