import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface AuditLog {
  _id?: ObjectId;
  orgId: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  target?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export async function createAuditLog(data: Omit<AuditLog, '_id' | 'createdAt'>) {
  const db = await getDb();
  return db.collection<AuditLog>(Collections.AUDIT_LOGS).insertOne({
    ...data,
    createdAt: new Date(),
  });
}

export async function getAuditLogs(
  orgId: string,
  filter: Partial<AuditLog> = {},
  limit = 100
) {
  const db = await getDb();
  return db.collection<AuditLog>(Collections.AUDIT_LOGS)
    .find({ orgId, ...filter })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<AuditLog>(Collections.AUDIT_LOGS);
  
  await collection.createIndex({ orgId: 1, createdAt: -1 });
  await collection.createIndex({ actorId: 1, createdAt: -1 });
  await collection.createIndex({ action: 1 });
}
