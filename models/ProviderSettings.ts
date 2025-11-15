import { getDb, Collections } from '@/lib/db';
import { ObjectId } from 'mongodb';

export interface AIProviderSettings {
  _id?: string;
  organizationId: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'groq' | 'deepseek' | 'cohere' | 'perplexity' | 'gemini';
  name: string; // User-friendly name like "Production OpenAI"
  apiKey: string; // API key stored in plain text
  baseUrl?: string; // Optional custom endpoint
  defaultModel: string; // e.g., "gpt-4o", "claude-3-5-sonnet-20241022"
  isEnabled: boolean;
  isDefault: boolean; // One provider must be default per org
  config?: {
    maxTokens?: number;
    temperature?: number;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface EmailProviderSettings {
  _id?: string;
  organizationId: string;
  provider: 'resend' | 'sendgrid' | 'smtp' | 'postmark' | 'mailgun';
  name: string;
  apiKey?: string; // Plain text API key (for Resend, SendGrid, etc.)
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string; // Plain text password
  };
  fromEmail: string;
  fromName: string;
  isEnabled: boolean;
  isDefault: boolean;
  dailyLimit?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// AI Provider functions
export async function getAIProviders(orgId: string) {
  const db = await getDb();
  const providers = await db
    .collection<AIProviderSettings>(Collections.AI_PROVIDERS)
    .find({ organizationId: orgId })
    .toArray();

  return providers.map(p => ({
    ...p,
    hasCredentials: Boolean(p.apiKey),
  }));
}

export async function getDefaultAIProvider(orgId: string) {
  const db = await getDb();
  const provider = await db
    .collection<AIProviderSettings>(Collections.AI_PROVIDERS)
    .findOne({ organizationId: orgId, isDefault: true, isEnabled: true });

  if (!provider) {
    throw new Error('No default AI provider configured');
  }

  return provider;
}

export async function getAIProviderById(orgId: string, providerId: string) {
  const db = await getDb();
  const provider = await db
    .collection<AIProviderSettings>(Collections.AI_PROVIDERS)
    .findOne({ _id: providerId, organizationId: orgId });

  return provider;
}

export async function upsertAIProvider(
  orgId: string,
  userId: string,
  data: Partial<AIProviderSettings>
) {
  const db = await getDb();
  const collection = db.collection<AIProviderSettings>(Collections.AI_PROVIDERS);

  const now = new Date();

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await collection.updateMany(
      { organizationId: orgId, _id: { $ne: data._id } },
      { $set: { isDefault: false, updatedAt: now } }
    );
  }

  const updateData: Partial<AIProviderSettings> = {
    ...data,
    organizationId: orgId,
    updatedAt: now,
  };

  // Ensure API key is trimmed if provided
  if (typeof data.apiKey === 'string') {
    updateData.apiKey = data.apiKey.trim();
  }

  if (data._id) {
    // Update existing
    const result = await collection.findOneAndUpdate(
      { _id: data._id, organizationId: orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result;
  } else {
    // Create new
    const newProvider: AIProviderSettings = {
      ...updateData,
      createdAt: now,
      createdBy: userId,
    } as AIProviderSettings;

    const result = await collection.insertOne(newProvider);
    return { ...newProvider, _id: result.insertedId };
  }
}

export async function deleteAIProvider(orgId: string, providerId: string) {
  const db = await getDb();
  const objectId = new ObjectId(providerId);
  
  const provider = await db
    .collection<AIProviderSettings>(Collections.AI_PROVIDERS)
    .findOne({ _id: objectId as unknown as string, organizationId: orgId });

  if (provider?.isDefault) {
    throw new Error('Cannot delete default provider. Set another provider as default first.');
  }

  const result = await db
    .collection<AIProviderSettings>(Collections.AI_PROVIDERS)
    .deleteOne({ _id: objectId as unknown as string, organizationId: orgId });

  return result.deletedCount > 0;
}

// Email Provider functions
export async function getEmailProviders(orgId: string) {
  const db = await getDb();
  const providers = await db
    .collection<EmailProviderSettings>(Collections.EMAIL_PROVIDERS)
    .find({ organizationId: orgId })
    .toArray();

  return providers.map(p => ({
    ...p,
    hasCredentials: !!(p.apiKey || p.smtpConfig),
  }));
}

export async function getDefaultEmailProvider(orgId: string) {
  const db = await getDb();
  const provider = await db
    .collection<EmailProviderSettings>(Collections.EMAIL_PROVIDERS)
    .findOne({ organizationId: orgId, isDefault: true, isEnabled: true });

  if (!provider) {
    throw new Error('No default email provider configured');
  }

  return provider;
}

export async function upsertEmailProvider(
  orgId: string,
  userId: string,
  data: Partial<EmailProviderSettings>
) {
  const db = await getDb();
  const collection = db.collection<EmailProviderSettings>(Collections.EMAIL_PROVIDERS);

  const now = new Date();

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await collection.updateMany(
      { organizationId: orgId, _id: { $ne: data._id } },
      { $set: { isDefault: false, updatedAt: now } }
    );
  }

  const updateData: Partial<EmailProviderSettings> = {
    ...data,
    organizationId: orgId,
    updatedAt: now,
  };

  if (data._id) {
    // Update existing
    const result = await collection.findOneAndUpdate(
      { _id: data._id, organizationId: orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    return result;
  } else {
    // Create new
    const newProvider: EmailProviderSettings = {
      ...updateData,
      createdAt: now,
      createdBy: userId,
    } as EmailProviderSettings;

    const result = await collection.insertOne(newProvider);
    return { ...newProvider, _id: result.insertedId };
  }
}

export async function deleteEmailProvider(orgId: string, providerId: string) {
  const db = await getDb();
  const provider = await db
    .collection<EmailProviderSettings>(Collections.EMAIL_PROVIDERS)
    .findOne({ _id: providerId, organizationId: orgId });

  if (provider?.isDefault) {
    throw new Error('Cannot delete default provider. Set another provider as default first.');
  }

  const result = await db
    .collection<EmailProviderSettings>(Collections.EMAIL_PROVIDERS)
    .deleteOne({ _id: providerId, organizationId: orgId });

  return result.deletedCount > 0;
}
