import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRY: z.string().default('12h'),
  SLOT_TTL_MINUTES: z.string().default('15').transform(Number),
  MAX_BOOKINGS_PER_DAY: z.string().default('3').transform(Number),
  PAYHERE_MERCHANT_ID: z.string().default(''),
  PAYHERE_MERCHANT_SECRET: z.string().default(''),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
