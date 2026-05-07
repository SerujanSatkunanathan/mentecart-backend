import { createApp } from './src/app';
import { connectDB } from './src/config/db';
import { env } from './src/config/env';
import { seedData } from './src/utils/seeder';

const start = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Seed sample data if in development
    if (env.NODE_ENV === 'development') {
      await seedData();
    }

    // Create and start Express app
    const app = createApp();
    const port = env.PORT;

    app.listen(port, () => {
      console.log(`🚀 MenteCart server running on port ${port} (${env.NODE_ENV})`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

start();
