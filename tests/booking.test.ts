import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDB, getTestApp } from './setup';
import { ServiceModel } from '../src/models/Service.model';
import { SlotModel } from '../src/models/Slot.model';
import { BookingModel } from '../src/models/Booking.model';
import express from 'express';

setupTestDB();

let app: express.Application;
let authToken: string;
let userId: string;
let serviceId: string;
let slotId: string;

async function createTestUser(): Promise<void> {
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({ name: 'Booking User', email: 'booking@test.com', password: 'password123' });
  authToken = res.body.token;
  userId = res.body.user.id;
}

async function createTestServiceAndSlot(): Promise<void> {
  const service = await ServiceModel.create({
    title: 'Plumbing Service',
    description: 'Expert plumbing',
    price: 10000,
    duration: 90,
    category: 'plumbing',
    imageUrl: 'https://example.com/plumbing.jpg',
    capacityPerSlot: 5,
    isActive: true,
  });
  serviceId = String(service._id);

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  futureDate.setHours(0, 0, 0, 0);

  const slot = await SlotModel.create({
    serviceId: service._id,
    date: futureDate,
    startTime: '14:00',
    endTime: '15:30',
    capacity: 5,
    booked: 0,
  });
  slotId = String(slot._id);
}

async function addItemToCart(): Promise<void> {
  await request(app)
    .post('/api/v1/cart/items')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ serviceId, slotId });
}

beforeAll(() => {
  app = getTestApp();
});

beforeEach(async () => {
  await createTestUser();
  await createTestServiceAndSlot();
});

describe('Booking API', () => {
  describe('POST /api/v1/bookings/checkout', () => {
    it('should create a confirmed booking with cash payment', async () => {
      await addItemToCart();

      const res = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' })
        .expect(201);

      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.status).toBe('confirmed');
      expect(res.body.booking.paymentStatus).toBe('unpaid');
      expect(res.body.booking.paymentMethod).toBe('cash');
      expect(res.body.booking.items).toHaveLength(1);
      expect(res.body.booking.totalAmount).toBe(10000);

      // Verify slot booked count was incremented
      const slot = await SlotModel.findById(slotId);
      expect(slot!.booked).toBe(1);
    });

    it('should create a pending booking with payhere payment', async () => {
      await addItemToCart();

      const res = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'payhere' })
        .expect(201);

      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.status).toBe('pending');
      expect(res.body.paymentUrl).toBeDefined();
    });

    it('should return 422 for empty cart', async () => {
      const res = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' })
        .expect(422);

      expect(res.body.errorCode).toBe('EMPTY_CART');
    });

    it('should return 409 when slot is full', async () => {
      await addItemToCart();

      // Fill the slot to capacity AFTER it was added to the cart
      // This simulates a race condition where the slot was filled by someone else
      await SlotModel.findByIdAndUpdate(slotId, { booked: 5 });

      const res = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' })
        .expect(409);

      expect(res.body.errorCode).toBe('SLOT_FULL');
    });

    it('should return 422 when daily booking limit is exceeded', async () => {
      // Create MAX_BOOKINGS_PER_DAY existing bookings
      for (let i = 0; i < 3; i++) {
        await BookingModel.create({
          userId,
          items: [{ serviceId, slotId, price: 10000 }],
          totalAmount: 10000,
          status: 'confirmed',
          paymentMethod: 'cash',
          paymentStatus: 'unpaid',
          cancelCutoff: new Date(Date.now() + 86400000),
          statusHistory: [{ status: 'confirmed', at: new Date(), by: userId }],
        });
      }

      await addItemToCart();

      const res = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' })
        .expect(422);

      expect(res.body.errorCode).toBe('DAILY_LIMIT_REACHED');
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should list user bookings', async () => {
      await addItemToCart();
      await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' });

      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return booking detail with statusHistory', async () => {
      await addItemToCart();
      const checkoutRes = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' });

      const bookingId = checkoutRes.body.booking._id;

      const res = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.booking).toBeDefined();
      expect(res.body.booking.statusHistory).toBeDefined();
      expect(res.body.booking.statusHistory.length).toBeGreaterThan(0);
    });

    it('should return 403 for another user\'s booking', async () => {
      // Create booking as current user
      await addItemToCart();
      const checkoutRes = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' });

      const bookingId = checkoutRes.body.booking._id;

      // Create second user
      const user2Res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ name: 'Other User', email: 'other@test.com', password: 'password123' });

      await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${user2Res.body.token}`)
        .expect(403);
    });
  });

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('should cancel booking within cutoff and release capacity', async () => {
      await addItemToCart();
      const checkoutRes = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' });

      const bookingId = checkoutRes.body.booking._id;

      // Verify slot has booked=1
      let slot = await SlotModel.findById(slotId);
      expect(slot!.booked).toBe(1);

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.booking.status).toBe('cancelled');

      // Verify slot booked was decremented back
      slot = await SlotModel.findById(slotId);
      expect(slot!.booked).toBe(0);
    });

    it('should return 400 for already cancelled booking', async () => {
      await addItemToCart();
      const checkoutRes = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' });

      const bookingId = checkoutRes.body.booking._id;

      // Cancel first time
      await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to cancel again
      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.errorCode).toBe('INVALID_TRANSITION');
    });

    it('should return 400 when past cancel cutoff', async () => {
      await addItemToCart();
      const checkoutRes = await request(app)
        .post('/api/v1/bookings/checkout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ paymentMethod: 'cash' });

      const bookingId = checkoutRes.body.booking._id;

      // Set cancel cutoff to the past
      await BookingModel.findByIdAndUpdate(bookingId, {
        cancelCutoff: new Date(Date.now() - 86400000),
      });

      const res = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.errorCode).toBe('PAST_CUTOFF');
    });
  });
});
