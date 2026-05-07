import { Request, Response } from 'express';
import crypto from 'crypto';
import { bookingService } from '../services/booking.service';
import {
  checkoutSchema,
  bookingIdParamSchema,
  listBookingsSchema,
} from '../validators/booking.validator';
import { env } from '../config/env';
import { AppError } from '../types';

/**
 * Booking controller — HTTP parsing only. Zero business logic.
 */
export class BookingController {
  async checkout(req: Request, res: Response): Promise<void> {
    const { paymentMethod } = checkoutSchema.parse(req.body);
    const result = await bookingService.checkout(req.user!.id, paymentMethod);
    res.status(201).json(result);
  }

  async list(req: Request, res: Response): Promise<void> {
    const { page, limit } = listBookingsSchema.parse(req.query);
    const result = await bookingService.listBookings(req.user!.id, page, limit);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = bookingIdParamSchema.parse(req.params);
    const booking = await bookingService.getBooking(id, req.user!.id);
    res.status(200).json({ booking });
  }

  async cancel(req: Request, res: Response): Promise<void> {
    const { id } = bookingIdParamSchema.parse(req.params);
    const booking = await bookingService.cancelBooking(id, req.user!.id);
    res.status(200).json({ booking });
  }

  /**
   * PayHere webhook handler.
   * Expects raw body (express.raw middleware on this route).
   * Verifies MD5 signature before processing.
   */
  async payHereWebhook(req: Request, res: Response): Promise<void> {
    // Parse URL-encoded body from raw buffer
    const bodyStr = req.body.toString();
    const params = new URLSearchParams(bodyStr);

    const merchantId = params.get('merchant_id') || '';
    const orderId = params.get('order_id') || '';
    const amount = params.get('payhere_amount') || '';
    const currency = params.get('payhere_currency') || '';
    const statusCode = params.get('status_code') || '';
    const md5sig = params.get('md5sig') || '';

    // Verify signature
    const merchantSecret = env.PAYHERE_MERCHANT_SECRET;
    const localMd5 = crypto
      .createHash('md5')
      .update(merchantSecret)
      .digest('hex')
      .toUpperCase();

    const expectedSig = crypto
      .createHash('md5')
      .update(merchantId + orderId + amount + currency + localMd5)
      .digest('hex')
      .toUpperCase();

    if (expectedSig !== md5sig) {
      throw new AppError(400, 'INVALID_SIGNATURE', 'Webhook signature verification failed.');
    }

    await bookingService.handlePayHereWebhook(orderId, statusCode);
    res.status(200).json({ received: true });
  }
}

export const bookingController = new BookingController();
