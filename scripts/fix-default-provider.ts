/**
 * Fix Default Provider Script
 * Sets the first provider as default if no default is set
 */

import { MongoClient } from 'mongodb';

async function fixDefaultProvider() {
  let client: MongoClient | null = null;
  
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI environment variable is required');
      process.exit(1);
    }
    
    console.log('🔧 Fixing default provider...\n');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    // Get all enabled providers
    const providers = await db.collection('ai_providers').find({ isEnabled: true }).toArray();
    
    if (providers.length === 0) {
      console.log('❌ No enabled providers found!');
      process.exit(1);
    }
    
    // Check if any is already default
    const hasDefault = providers.some(p => p.isDefault);
    
    if (hasDefault) {
      console.log('✅ A default provider is already set!');
    } else {
      // Set the first enabled provider as default
      const firstProvider = providers[0];
      
      await db.collection('ai_providers').updateOne(
        { _id: firstProvider._id },
        { $set: { isDefault: true, updatedAt: new Date() } }
      );
      
      console.log('✅ Set as default provider:');
      console.log(`   Name: ${firstProvider.name}`);
      console.log(`   Type: ${firstProvider.provider}`);
      console.log(`   Model: ${firstProvider.defaultModel}\n`);
      console.log('🎉 Default provider is now configured!\n');
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

fixDefaultProvider();
