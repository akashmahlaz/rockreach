import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface LeadSearch {
  _id?: ObjectId;
  orgId: string;
  query: Record<string, unknown>;
  filters: Record<string, unknown>;
  resultCount: number;
  executedBy?: string;
  createdAt: Date;
}

export async function createLeadSearch(data: Omit<LeadSearch, '_id' | 'createdAt'>) {
  const db = await getDb();
  return db.collection<LeadSearch>(Collections.LEAD_SEARCHES).insertOne({
    ...data,
    createdAt: new Date(),
  });
}

export async function getRecentSearches(orgId: string, limit = 10) {
  const db = await getDb();
  return db.collection<LeadSearch>(Collections.LEAD_SEARCHES)
    .find({ orgId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<LeadSearch>(Collections.LEAD_SEARCHES);
  
  await collection.createIndex({ orgId: 1, createdAt: -1 });
}
