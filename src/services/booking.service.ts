import mongoose from 'mongoose';
import { bookingRepository } from '../repositories/booking.repository';
import { cartRepository } from '../repositories/cart.repository';
import { serviceRepository } from '../repositories/service.repository';
import { MAX_BOOKINGS_PER_DAY, CANCEL_CUTOFF_HOURS } from '../config/constants';
import { env } from '../config/env';
import {
  AppError,
  BookingStatus,
  PaymentMethod,
  IBooking,
  IBookingItem,
  IStatusHistoryEntry,
  PaginatedResult,
} from '../types';
import { Types } from 'mongoose';

/**
 * Status-machine transition map.
 * Any transition not listed here is ILLEGAL.
 */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['confirmed', 'cancelled', 'failed'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  failed: [],
};

export class BookingService {
  /**
   * Validate that a status transition is legal.
   */
  private validateTransition(from: BookingStatus, to: BookingStatus): void {
    const allowed = TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new AppError(
        400,
        'INVALID_TRANSITION',
        `Cannot transition from '${from}' to '${to}'.`
      );
    }
  }

  /**
   * Perform a status transition with all required side-effects:
   *   1. Validate transition
   *   2. Append to statusHistory
   *   3. Write BookingAudit row
   *   4. Update booking status
   */
  private async transitionStatus(
    bookingId: string,
    from: BookingStatus,
    to: BookingStatus,
    actor: string,
    reason: string,
    updates: Partial<{ paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded'; paymentRef: string }> = {},
    session?: mongoose.ClientSession
  ): Promise<IBooking> {
    this.validateTransition(from, to);

    const historyEntry: IStatusHistoryEntry = {
      status: to,
      at: new Date(),
      by: actor,
    };

    // Write audit row
    await bookingRepository.createAudit(
      {
        bookingId: new Types.ObjectId(bookingId),
        from,
        to,
        actor,
        reason,
        at: new Date(),
      },
      session
    );

    // Update booking
    const updated = await bookingRepository.updateStatus(
      bookingId,
      to,
      historyEntry,
      updates,
      session
    );

    if (!updated) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found during transition.');
    }

    return updated;
  }

  /**
   * Checkout: convert cart → booking.
   * Runs inside a Mongoose session/transaction for atomicity.
   */
  async checkout(
    userId: string,
    paymentMethod: PaymentMethod
  ): Promise<{ booking: IBooking; paymentUrl?: string }> {
    const session = await mongoose.startSession();

    try {
      let result: { booking: IBooking; paymentUrl?: string } | undefined;

      await session.withTransaction(async () => {
        // 1. Fetch cart
        const cart = await cartRepository.findOrCreate(userId, session);
        if (!cart.items || cart.items.length === 0) {
          throw new AppError(422, 'EMPTY_CART', 'Your cart is empty.');
        }

        // 2. Check daily booking limit
        const today = new Date();
        const dailyCount = await bookingRepository.countUserBookingsForDate(userId, today);
        if (dailyCount >= MAX_BOOKINGS_PER_DAY) {
          throw new AppError(
            422,
            'DAILY_LIMIT_REACHED',
            `You can only make ${MAX_BOOKINGS_PER_DAY} bookings per day.`
          );
        }

        // 3. Atomically reserve capacity for each item
        const bookingItems: IBookingItem[] = [];
        let totalAmount = 0;
        let earliestSlotDate: Date | null = null;

        for (const cartItem of cart.items) {
          // Atomic capacity check + increment
          const updatedSlot = await serviceRepository.incrementSlotBooked(
            String(cartItem.slotId),
            session
          );

          if (!updatedSlot) {
            throw new AppError(
              409,
              'SLOT_FULL',
              'No capacity remaining for one or more slots.'
            );
          }

          bookingItems.push({
            serviceId: cartItem.serviceId,
            slotId: cartItem.slotId,
            price: cartItem.price,
          });

          totalAmount += cartItem.price;

          // Track earliest slot date for cancel cutoff
          const slotDate = new Date(updatedSlot.date);
          if (!earliestSlotDate || slotDate < earliestSlotDate) {
            earliestSlotDate = slotDate;
          }
        }

        // 4. Compute cancel cutoff (24h before earliest slot)
        const cancelCutoff = new Date(earliestSlotDate!);
        cancelCutoff.setHours(cancelCutoff.getHours() - CANCEL_CUTOFF_HOURS);

        // 5. Determine initial status based on payment method
        const isCashFlow = paymentMethod === 'cash' || paymentMethod === 'pay_on_arrival';
        const initialStatus: BookingStatus = isCashFlow ? 'confirmed' : 'pending';
        const initialPaymentStatus = 'unpaid' as const;

        // 6. Generate payment reference for PayHere
        let paymentRef: string | null = null;
        let paymentUrl: string | undefined;
        if (paymentMethod === 'payhere') {
          paymentRef = `MC-${Date.now()}-${userId.slice(-6)}`;
          paymentUrl = `https://sandbox.payhere.lk/pay/checkout?merchant_id=${env.PAYHERE_MERCHANT_ID}&order_id=${paymentRef}&amount=${totalAmount / 100}&currency=LKR`;
        }

        // 7. Create booking with status history
        const statusHistory: IStatusHistoryEntry[] = [
          {
            status: initialStatus,
            at: new Date(),
            by: userId,
          },
        ];

        const booking = await bookingRepository.create(
          {
            userId,
            items: bookingItems,
            totalAmount,
            status: initialStatus,
            paymentMethod,
            paymentStatus: initialPaymentStatus,
            paymentRef,
            cancelCutoff,
            statusHistory,
          },
          session
        );

        // 8. Write audit for initial status
        await bookingRepository.createAudit(
          {
            bookingId: booking._id,
            from: 'pending',
            to: initialStatus,
            actor: userId,
            reason: `Checkout via ${paymentMethod}`,
            at: new Date(),
          },
          session
        );

        // 9. Clear cart
        await cartRepository.clearCart(userId, session);

        result = { booking, paymentUrl };
      });

      return result!;
    } finally {
      session.endSession();
    }
  }

  /**
   * List user's bookings with pagination.
   */
  async listBookings(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<IBooking>> {
    return bookingRepository.findByUserId(userId, page, limit);
  }

  /**
   * Get a single booking by ID. Verifies ownership.
   */
  async getBooking(bookingId: string, userId: string): Promise<IBooking> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
    }
    if (String(booking.userId) !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this booking.');
    }
    return booking;
  }

  /**
   * Cancel a booking. Validates cutoff and terminal states.
   * Releases slot capacity.
   */
  async cancelBooking(bookingId: string, userId: string): Promise<IBooking> {
    const session = await mongoose.startSession();

    try {
      let result: IBooking | undefined;

      await session.withTransaction(async () => {
        const booking = await bookingRepository.findById(bookingId, session);
        if (!booking) {
          throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
        }
        if (String(booking.userId) !== userId) {
          throw new AppError(403, 'FORBIDDEN', 'You do not have access to this booking.');
        }

        // Check if booking is in a terminal state
        const terminalStates: BookingStatus[] = ['completed', 'cancelled', 'failed'];
        if (terminalStates.includes(booking.status)) {
          throw new AppError(
            400,
            'INVALID_TRANSITION',
            `Booking is already in terminal state '${booking.status}'.`
          );
        }

        // Check cancel cutoff
        const now = new Date();
        if (now > booking.cancelCutoff) {
          throw new AppError(
            400,
            'PAST_CUTOFF',
            'Cancellation deadline has passed.'
          );
        }

        // Release capacity for each slot
        for (const item of booking.items) {
          await serviceRepository.decrementSlotBooked(String(item.slotId), session);
        }

        // Transition status
        result = await this.transitionStatus(
          bookingId,
          booking.status,
          'cancelled',
          userId,
          'User cancelled booking',
          {},
          session
        );
      });

      return result!;
    } finally {
      session.endSession();
    }
  }

  /**
   * Handle PayHere webhook callback.
   * Idempotent — already confirmed bookings return silently.
   */
  async handlePayHereWebhook(
    orderId: string,
    statusCode: string,
    paymentId?: string
  ): Promise<void> {
    const booking = await bookingRepository.findByPaymentRef(orderId);
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found for this order.');
    }

    // Idempotent: if already confirmed, return silently
    if (booking.status === 'confirmed') {
      return;
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        if (statusCode === '2') {
          // Payment successful → confirm
          await this.transitionStatus(
            String(booking._id),
            booking.status,
            'confirmed',
            'webhook',
            'PayHere payment confirmed',
            { paymentStatus: 'paid' },
            session
          );
        } else {
          // Payment failed → fail + rollback capacity
          for (const item of booking.items) {
            await serviceRepository.decrementSlotBooked(String(item.slotId), session);
          }

          await this.transitionStatus(
            String(booking._id),
            booking.status,
            'failed',
            'webhook',
            `PayHere payment failed (status: ${statusCode})`,
            { paymentStatus: 'failed' },
            session
          );
        }
      });
    } finally {
      session.endSession();
    }
  }
}

export const bookingService = new BookingService();
