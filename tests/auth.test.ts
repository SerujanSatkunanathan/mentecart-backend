import request from 'supertest';
import { setupTestDB, getTestApp } from './setup';
import express from 'express';

setupTestDB();

let app: express.Application;

beforeAll(() => {
  app = getTestApp();
});

describe('Auth API', () => {
  const validUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/v1/auth/signup', () => {
    it('should create a new user and return 201 with token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send(validUser)
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(validUser.name);
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.role).toBe('customer');
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/api/v1/auth/signup').send(validUser);

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send(validUser)
        .expect(409);

      expect(res.body.errorCode).toBe('EMAIL_TAKEN');
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ name: '', email: 'invalid', password: '123' })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/signup').send(validUser);
    });

    it('should login with valid credentials and return 200 with token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: validUser.password })
        .expect(200);

      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: validUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const signupRes = await request(app)
        .post('/api/v1/auth/signup')
        .send(validUser);

      const token = signupRes.body.token;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });
  });
});
