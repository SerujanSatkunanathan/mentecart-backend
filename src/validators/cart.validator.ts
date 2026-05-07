import { z } from 'zod';

export const addCartItemSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
});

export const updateCartItemSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required').optional(),
});

export const cartItemIdParamSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
