import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface LeadList {
  _id?: ObjectId;
  orgId: string;
  name: string;
  description?: string;
  leadIds: ObjectId[];
  createdBy?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export async function createLeadList(data: Omit<LeadList, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  return db.collection<LeadList>(Collections.LEAD_LISTS).insertOne({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getLeadLists(orgId: string) {
  const db = await getDb();
  return db.collection<LeadList>(Collections.LEAD_LISTS)
    .find({ orgId })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function addLeadsToList(listId: ObjectId, leadIds: ObjectId[]) {
  const db = await getDb();
  return db.collection<LeadList>(Collections.LEAD_LISTS).updateOne(
    { _id: listId },
    {
      $addToSet: { leadIds: { $each: leadIds } },
      $set: { updatedAt: new Date() },
    }
  );
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<LeadList>(Collections.LEAD_LISTS);
  
  await collection.createIndex({ orgId: 1, name: 1 });
  await collection.createIndex({ updatedAt: -1 });
}
