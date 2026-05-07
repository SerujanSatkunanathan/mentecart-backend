import mongoose from 'mongoose';
import { env } from './env';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    
    let uri = env.MONGODB_URI;
    // Use in-memory MongoDB if configured for localhost in development
    if (uri.includes('localhost') && env.NODE_ENV === 'development') {
      mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log(`[INFO] Using In-Memory MongoDB for local development.`);
    }
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
