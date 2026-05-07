import request from 'supertest';
import mongoose from 'mongoose';
import { setupTestDB, getTestApp } from './setup';
import { ServiceModel } from '../src/models/Service.model';
import { SlotModel } from '../src/models/Slot.model';
import { CartModel } from '../src/models/Cart.model';
import express from 'express';

setupTestDB();

let app: express.Application;
let authToken: string;
let serviceId: string;
let slotId: string;
let fullSlotId: string;

async function createTestUser(): Promise<void> {
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({ name: 'Cart User', email: 'cart@test.com', password: 'password123' });
  authToken = res.body.token;
}

async function createTestServiceAndSlots(): Promise<void> {
  const service = await ServiceModel.create({
    title: 'Test Cleaning',
    description: 'Professional home cleaning',
    price: 5000,
    duration: 60,
    category: 'cleaning',
    imageUrl: 'https://example.com/cleaning.jpg',
    capacityPerSlot: 3,
    isActive: true,
  });
  serviceId = String(service._id);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const slot = await SlotModel.create({
    serviceId: service._id,
    date: tomorrow,
    startTime: '09:00',
    endTime: '10:00',
    capacity: 3,
    booked: 0,
  });
  slotId = String(slot._id);

  const fullSlot = await SlotModel.create({
    serviceId: service._id,
    date: tomorrow,
    startTime: '11:00',
    endTime: '12:00',
    capacity: 1,
    booked: 1,
  });
  fullSlotId = String(fullSlot._id);
}

beforeAll(() => {
  app = getTestApp();
});

beforeEach(async () => {
  // Recreate user and test data before each test
  await createTestUser();
  await createTestServiceAndSlots();
});

describe('Cart API', () => {
  describe('POST /api/v1/cart/items', () => {
    it('should add item to cart and return 201', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceId, slotId })
        .expect(201);

      expect(res.body.cart).toBeDefined();
      expect(res.body.cart.items).toHaveLength(1);
      expect(res.body.cart.itemCount).toBe(1);
      expect(res.body.cart.totalAmount).toBe(5000);
    });

    it('should return 409 for duplicate slot', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceId, slotId });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceId, slotId })
        .expect(409);

      expect(res.body.errorCode).toBe('DUPLICATE_ITEM');
    });

    it('should return 409 for full slot', async () => {
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceId, slotId: fullSlotId })
        .expect(409);

      expect(res.body.errorCode).toBe('SLOT_FULL');
    });
  });

  describe('GET /api/v1/cart', () => {
    it('should return enriched cart with computed fields', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceId, slotId });

      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.itemCount).toBe(1);
      expect(res.body.totalAmount).toBe(5000);
      expect(res.body.items[0].service).toBeDefined();
      expect(res.body.items[0].service.title).toBe('Test Cleaning');
      expect(res.body.items[0].slot).toBeDefined();
    });
  });

  describe('DELETE /api/v1/cart/items/:itemId', () => {
    it('should remove item and update totals', async () => {
      const addRes = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ serviceId, slotId });

      const itemId = addRes.body.cart.items[0]._id;

      const res = await request(app)
        .delete(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.cart.items).toHaveLength(0);
      expect(res.body.cart.itemCount).toBe(0);
      expect(res.body.cart.totalAmount).toBe(0);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app)
        .delete(`/api/v1/cart/items/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
