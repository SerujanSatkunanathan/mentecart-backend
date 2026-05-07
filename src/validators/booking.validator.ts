import { z } from 'zod';

export const checkoutSchema = z.object({
  paymentMethod: z.enum(['payhere', 'cash', 'pay_on_arrival'], {
    errorMap: () => ({ message: 'Payment method must be payhere, cash, or pay_on_arrival' }),
  }),
});

export const bookingIdParamSchema = z.object({
  id: z.string().min(1, 'Booking ID is required'),
});

export const listBookingsSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
