/**
 * Production Migration Script: Convert Organization-Scoped Providers to Global
 * 
 * This script updates existing AI and Email providers in PRODUCTION database
 * to use 'global' as organizationId so they work for all users.
 * 
 * Run with production MongoDB URI:
 * MONGODB_URI="mongodb+srv://..." bun run scripts/migrate-production-providers.ts
 */

import { MongoClient } from 'mongodb';

async function migrateProvidersToGlobal() {
  let client: MongoClient | null = null;
  
  try {
    // Get MongoDB URI from environment or command line
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI environment variable is required');
      console.log('\nUsage:');
      console.log('  MONGODB_URI="your-production-mongodb-uri" bun run scripts/migrate-production-providers.ts');
      process.exit(1);
    }
    
    console.log('🚀 Starting provider migration to global scope...');
    console.log('📍 Connecting to MongoDB...\n');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database:', db.databaseName);
    console.log('');
    
    // Update AI Providers
    console.log('📊 Checking AI Providers...');
    const aiProviders = await db
      .collection('ai_providers')
      .find({ organizationId: { $ne: 'global' } })
      .toArray();
    
    console.log(`Found ${aiProviders.length} organization-scoped AI provider(s)`);
    
    if (aiProviders.length > 0) {
      console.log('\nProviders to update:');
      aiProviders.forEach((p) => {
        console.log(`  - ${p.name} (${p.provider}) - orgId: ${p.organizationId}`);
      });
      
      const aiResult = await db
        .collection('ai_providers')
        .updateMany(
          { organizationId: { $ne: 'global' } },
          { 
            $set: { 
              organizationId: 'global',
              updatedAt: new Date()
            } 
          }
        );
      
      console.log(`\n✅ Updated ${aiResult.modifiedCount} AI provider(s) to global scope`);
    } else {
      console.log('✅ All AI providers are already global');
    }
    
    console.log('\n📧 Checking Email Providers...');
    
    // Update Email Providers
    const emailProviders = await db
      .collection('email_providers')
      .find({ organizationId: { $ne: 'global' } })
      .toArray();
    
    console.log(`Found ${emailProviders.length} organization-scoped email provider(s)`);
    
    if (emailProviders.length > 0) {
      console.log('\nProviders to update:');
      emailProviders.forEach((p) => {
        console.log(`  - ${p.name} (${p.provider}) - orgId: ${p.organizationId}`);
      });
      
      const emailResult = await db
        .collection('email_providers')
        .updateMany(
          { organizationId: { $ne: 'global' } },
          { 
            $set: { 
              organizationId: 'global',
              updatedAt: new Date()
            } 
          }
        );
      
      console.log(`\n✅ Updated ${emailResult.modifiedCount} email provider(s) to global scope`);
    } else {
      console.log('✅ All email providers are already global');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n💡 All providers now work for all organizations across the platform.');
    console.log('🚀 Deploy your updated code to production for changes to take effect.');
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

// Run migration
migrateProvidersToGlobal();
