import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface ApiUsage {
  _id?: ObjectId;
  orgId: string;
  provider: string;
  endpoint: string;
  method: string;
  units: number;
  status: string;
  durationMs: number;
  error?: string;
  createdAt: Date;
}

export async function logApiUsage(data: Omit<ApiUsage, '_id' | 'createdAt'>) {
  const db = await getDb();
  return db.collection<ApiUsage>(Collections.API_USAGE).insertOne({
    ...data,
    createdAt: new Date(),
  });
}

export async function getApiUsageStats(orgId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  return db.collection<ApiUsage>(Collections.API_USAGE).aggregate([
    {
      $match: {
        orgId,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$provider',
        totalCalls: { $sum: 1 },
        successCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
        },
        totalUnits: { $sum: '$units' },
        avgDuration: { $avg: '$durationMs' },
      },
    },
  ]).toArray();
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<ApiUsage>(Collections.API_USAGE);
  
  await collection.createIndex({ orgId: 1, createdAt: -1 });
  await collection.createIndex({ provider: 1, createdAt: -1 });
}
