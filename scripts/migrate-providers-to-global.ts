/**
 * Migration Script: Convert Organization-Scoped Providers to Global
 * 
 * This script updates existing AI and Email providers in the database
 * to use 'global' as organizationId so they work for all users.
 * 
 * Run with: bun run scripts/migrate-providers-to-global.ts
 */

import { getDb, Collections } from '@/lib/db';

async function migrateProvidersToGlobal() {
  try {
    console.log('🚀 Starting provider migration to global scope...\n');
    
    const db = await getDb();
    
    // Update AI Providers
    console.log('📊 Checking AI Providers...');
    const aiProviders = await db
      .collection(Collections.AI_PROVIDERS)
      .find({ organizationId: { $ne: 'global' } })
      .toArray();
    
    console.log(`Found ${aiProviders.length} organization-scoped AI provider(s)`);
    
    if (aiProviders.length > 0) {
      const aiResult = await db
        .collection(Collections.AI_PROVIDERS)
        .updateMany(
          { organizationId: { $ne: 'global' } },
          { 
            $set: { 
              organizationId: 'global',
              updatedAt: new Date()
            } 
          }
        );
      
      console.log(`✅ Updated ${aiResult.modifiedCount} AI provider(s) to global scope`);
      
      // Show updated providers
      console.log('\nUpdated AI Providers:');
      aiProviders.forEach((p) => {
        console.log(`  - ${p.name} (${p.provider}) - was org: ${p.organizationId}, now: global`);
      });
    } else {
      console.log('✅ All AI providers are already global');
    }
    
    console.log('\n📧 Checking Email Providers...');
    
    // Update Email Providers
    const emailProviders = await db
      .collection(Collections.EMAIL_PROVIDERS)
      .find({ organizationId: { $ne: 'global' } })
      .toArray();
    
    console.log(`Found ${emailProviders.length} organization-scoped email provider(s)`);
    
    if (emailProviders.length > 0) {
      const emailResult = await db
        .collection(Collections.EMAIL_PROVIDERS)
        .updateMany(
          { organizationId: { $ne: 'global' } },
          { 
            $set: { 
              organizationId: 'global',
              updatedAt: new Date()
            } 
          }
        );
      
      console.log(`✅ Updated ${emailResult.modifiedCount} email provider(s) to global scope`);
      
      // Show updated providers
      console.log('\nUpdated Email Providers:');
      emailProviders.forEach((p) => {
        console.log(`  - ${p.name} (${p.provider}) - was org: ${p.organizationId}, now: global`);
      });
    } else {
      console.log('✅ All email providers are already global');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n💡 All providers now work for all organizations across the platform.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateProvidersToGlobal();
