import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface Organization {
  _id?: ObjectId;
  name: string;
  slug: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  ownerId?: string;
  memberIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createOrganization(data: Omit<Organization, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  return db.collection<Organization>(Collections.ORGANIZATIONS).insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getOrganization(slug: string) {
  const db = await getDb();
  return db.collection<Organization>(Collections.ORGANIZATIONS).findOne({ slug });
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<Organization>(Collections.ORGANIZATIONS);
  
  await collection.createIndex({ slug: 1 }, { unique: true });
}
