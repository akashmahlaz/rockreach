import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts: Array<{
    type: string;
    text?: string;
    [key: string]: unknown;
  }>;
  createdAt: Date;
  tokenCount?: number;
}

export interface Conversation {
  _id?: ObjectId;
  id: string;
  orgId: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  metadata?: {
    totalTokens?: number;
    totalCost?: number;
    toolsUsed?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export async function createConversation(data: Omit<Conversation, '_id' | 'createdAt' | 'updatedAt'>) {
  const db = await getDb();
  const now = new Date();
  
  const conversation: Omit<Conversation, '_id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<Conversation>(Collections.CONVERSATIONS).insertOne(conversation as Conversation);
  
  // Return the id field (our custom ID), not MongoDB's _id
  return data.id;
}

export async function updateConversation(
  id: string,
  userId: string,
  update: Partial<Omit<Conversation, '_id' | 'id' | 'orgId' | 'userId' | 'createdAt'>>
) {
  const db = await getDb();
  
  try {
    const result = await db.collection<Conversation>(Collections.CONVERSATIONS).updateOne(
      { id, userId, deletedAt: { $exists: false } },
      { 
        $set: { 
          ...update, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      console.warn(`[updateConversation] No conversation found with id: ${id}, userId: ${userId}`);
    }

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('[updateConversation] Error:', error);
    throw error;
  }
}

export async function getConversations(userId: string, orgId: string, limit = 50) {
  const db = await getDb();
  
  return db.collection<Conversation>(Collections.CONVERSATIONS)
    .find({ 
      userId, 
      orgId,
      deletedAt: { $exists: false } 
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
}

export async function getConversation(id: string, userId: string) {
  const db = await getDb();
  
  return db.collection<Conversation>(Collections.CONVERSATIONS).findOne({
    id,
    userId,
    deletedAt: { $exists: false },
  });
}

export async function deleteConversation(id: string, userId: string) {
  const db = await getDb();
  
  // Soft delete
  const result = await db.collection<Conversation>(Collections.CONVERSATIONS).updateOne(
    { id, userId },
    { 
      $set: { 
        deletedAt: new Date(),
        updatedAt: new Date() 
      } 
    }
  );

  return result.modifiedCount > 0;
}

export async function getConversationStats(orgId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  
  return db.collection<Conversation>(Collections.CONVERSATIONS).aggregate([
    {
      $match: {
        orgId,
        createdAt: { $gte: startDate, $lte: endDate },
        deletedAt: { $exists: false },
      },
    },
    {
      $group: {
        _id: '$userId',
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: { $size: '$messages' } },
        totalTokens: { $sum: '$metadata.totalTokens' },
        totalCost: { $sum: '$metadata.totalCost' },
      },
    },
  ]).toArray();
}

export async function createIndexes() {
  const db = await getDb();
  const collection = db.collection<Conversation>(Collections.CONVERSATIONS);
  
  await collection.createIndex({ id: 1, userId: 1 }, { unique: true });
  await collection.createIndex({ userId: 1, updatedAt: -1 });
  await collection.createIndex({ orgId: 1, createdAt: -1 });
  await collection.createIndex({ deletedAt: 1 }, { sparse: true });
}
