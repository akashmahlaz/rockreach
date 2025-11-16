/**
 * Check Providers Script
 * Shows all AI providers in the database with their settings
 */

import { MongoClient } from 'mongodb';

async function checkProviders() {
  let client: MongoClient | null = null;
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    console.log('🔍 Checking AI Providers in database...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('✅ Connected to database:', db.databaseName, '\n');
    
    // Get ALL AI providers
    const providers = await db.collection('ai_providers').find({}).toArray();
    
    console.log(`📊 Found ${providers.length} AI provider(s):\n`);
    
    if (providers.length === 0) {
      console.log('⚠️  No AI providers found in database!');
      console.log('   Add a provider via /admin/ai-providers\n');
    } else {
      providers.forEach((p, index) => {
        console.log(`${index + 1}. Provider: ${p.name}`);
        console.log(`   ID: ${p._id}`);
        console.log(`   Type: ${p.provider}`);
        console.log(`   Model: ${p.defaultModel}`);
        console.log(`   Organization: ${p.organizationId}`);
        console.log(`   Enabled: ${p.isEnabled ? '✅' : '❌'}`);
        console.log(`   Default: ${p.isDefault ? '✅' : '❌'}`);
        console.log(`   Has API Key: ${p.apiKey ? '✅ (' + p.apiKey.substring(0, 10) + '...)' : '❌'}`);
        console.log('');
      });
      
      const defaultProvider = providers.find(p => p.isDefault && p.isEnabled);
      if (defaultProvider) {
        console.log('✅ Default provider found:', defaultProvider.name);
        console.log('   This provider will be used for all chat requests\n');
      } else {
        console.log('⚠️  No default provider set!');
        console.log('   Set a provider as default via /admin/ai-providers\n');
      }
    }
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (client) {
      await client.close();
    }
    process.exit(1);
  }
}

checkProviders();
