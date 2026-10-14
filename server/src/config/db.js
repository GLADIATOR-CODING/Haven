import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer = null;

export async function connectDB() {
  // Listen for runtime connection changes
  mongoose.connection.on('disconnected', () => {
    console.warn('[database] MongoDB connection lost. Attempting auto-reconnect...');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[database] MongoDB reconnected successfully.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[database] Mongoose runtime connection error:', err.message);
  });

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
    });
    console.log(`[database] MongoDB connected: ${conn.connection.host}`);

    // Ensure demo workspaces, accounts, and sample requests are available
    try {
      const { seedInternal } = await import('../../scripts/seedData.js');
      await seedInternal();
      console.log('[database] Demo workspaces, sample records, and staff requests verified.');
    } catch (seedErr) {
      console.warn('[database] Demo seeding verification notice:', seedErr.message);
    }

    return conn;
  } catch (error) {
    if (env.NODE_ENV === 'development') {
      console.warn(`[database] Local MongoDB unavailable (${error.message}). Starting in-memory instance...`);
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[database] Connected to in-memory database: ${memUri}`);

        // Automatically seed demo records
        const { seedInternal } = await import('../../scripts/seedData.js');
        await seedInternal();
        console.log('[database] Auto-seeded demo workspaces and accounts.');
        return conn;
      } catch (memErr) {
        console.error('[database] Failed to start in-memory MongoDB:', memErr);
      }
    }

    console.error(`[database] Connection error: ${error.message}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
