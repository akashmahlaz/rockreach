import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;

/**
 * Get optimized MongoDB client with connection pooling
 * Configured for high concurrency and production use
 */
export async function getMongoClient() {
  // Check if client exists and is connected
  if (client) {
    try {
      // Ping the database to check connection
      await client.db('admin').command({ ping: 1 });
      return client;
    } catch {
      // Connection lost, reset client
      client = null;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  console.log('[DB Pool] Initializing MongoDB connection pool...');

  client = new MongoClient(uri, {
    maxPoolSize: 50, // Increased from default 10 - supports 50 concurrent operations
    minPoolSize: 10, // Keep 10 connections always ready
    maxIdleTimeMS: 60000, // Close idle connections after 60s
    serverSelectionTimeoutMS: 5000, // Fail fast if server unavailable
    socketTimeoutMS: 45000, // Socket timeout for long queries
    retryWrites: true, // Auto-retry failed writes
    retryReads: true, // Auto-retry failed reads
    compressors: ['zstd', 'snappy', 'zlib'], // Enable compression for network efficiency
  });

  await client.connect();
  console.log('[DB Pool] ✅ Connected with optimized pool settings');
  
  return client;
}

/**
 * Close MongoDB connection (for graceful shutdown)
 */
export async function closeMongoClient() {
  if (client) {
    await client.close();
    client = null;
    console.log('[DB Pool] Connection closed');
  }
}

// Handle graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeMongoClient();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await closeMongoClient();
    process.exit(0);
  });
}
