import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';

const app = createApp();

// Vercel serverless function entrypoint
export default async function (req: any, res: any) {
  // Ensure database is connected before handling the request
  await connectDB();
  
  // Pass the request to the Express application
  return app(req, res);
}
