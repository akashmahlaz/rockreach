import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface Lead {
  _id?: ObjectId;
  orgId: string;
  personId: string;
  source: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  domain?: string;
  emails?: string[];
  phones?: string[];
  linkedin?: string;
  location?: string;
  tags?: string[];
  raw?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function findLeadByPersonId(orgId: string, personId: string) {
  const db = await getDb();
  return db.collection<Lead>(Collections.LEADS).findOne({ orgId, personId });
}

export async function upsertLead(orgId: string, personId: string, data: Partial<Lead>) {
  const db = await getDb();
  return db.collection<Lead>(Collections.LEADS).findOneAndUpdate(
    { orgId, personId },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        orgId,
        personId,
      },
    },
    { upsert: true, returnDocument: 'after' }
  );
}

export async function findLeads(orgId: string, filter: Partial<Lead> = {}, limit = 100) {
  const db = await getDb();
  return db.collection<Lead>(Collections.LEADS)
    .find({ orgId, ...filter })
    .limit(limit)
    .toArray();
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<Lead>(Collections.LEADS);
  
  await collection.createIndex({ orgId: 1, personId: 1 });
  await collection.createIndex({ orgId: 1, emails: 1 });
  await collection.createIndex({ orgId: 1, company: 1 });
  await collection.createIndex({ createdAt: -1 });
}
