import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createApp } from '../src/app';
import express from 'express';

let mongoServer: MongoMemoryReplSet;

/**
 * Spin up an in-memory MongoDB REPLICA SET instance and connect Mongoose.
 * Replica set is required for transaction support (session.withTransaction).
 */
export const setupTestDB = (): void => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 120000); // 120 second timeout for replica set startup

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key]!.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);
};

/**
 * Create a fresh Express app for testing.
 */
export const getTestApp = (): express.Application => {
  // Override env vars for test
  process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // overridden by memory server
  process.env.NODE_ENV = 'test';
  return createApp();
};
