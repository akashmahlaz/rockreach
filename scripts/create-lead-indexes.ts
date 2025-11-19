import { getDb, Collections } from '@/lib/db';

async function createOptimizedIndexes() {
  const db = await getDb();
  const leads = db.collection(Collections.LEADS);

  console.log('Creating optimized indexes for leads collection...');

  try {
    // Compound indexes for common queries
    await leads.createIndex(
      { orgId: 1, createdAt: -1 }, 
      { name: 'orgId_createdAt_desc' }
    );
    console.log('✅ Created index: orgId_createdAt_desc');

    await leads.createIndex(
      { orgId: 1, company: 1 }, 
      { name: 'orgId_company' }
    );
    console.log('✅ Created index: orgId_company');

    await leads.createIndex(
      { orgId: 1, emails: 1 }, 
      { name: 'orgId_emails', sparse: true }
    );
    console.log('✅ Created index: orgId_emails');

    await leads.createIndex(
      { orgId: 1, phones: 1 }, 
      { name: 'orgId_phones', sparse: true }
    );
    console.log('✅ Created index: orgId_phones');

    // Index for name searches (case-insensitive)
    await leads.createIndex(
      { orgId: 1, name: 1 }, 
      { name: 'orgId_name', collation: { locale: 'en', strength: 2 } }
    );
    console.log('✅ Created index: orgId_name (case-insensitive)');

    // Index for title searches
    await leads.createIndex(
      { orgId: 1, title: 1 }, 
      { name: 'orgId_title' }
    );
    console.log('✅ Created index: orgId_title');

    // Index for filtering by phone existence
    await leads.createIndex(
      { orgId: 1, 'phones.0': 1 },
      { name: 'orgId_has_phone', partialFilterExpression: { 'phones.0': { $exists: true } } }
    );
    console.log('✅ Created index: orgId_has_phone');

    // Index for filtering by email existence
    await leads.createIndex(
      { orgId: 1, 'emails.0': 1 },
      { name: 'orgId_has_email', partialFilterExpression: { 'emails.0': { $exists: true } } }
    );
    console.log('✅ Created index: orgId_has_email');

    console.log('\n✅ All indexes created successfully!');
    
    // Show index stats
    const indexes = await leads.indexes();
    console.log('\nCurrent indexes:', indexes.map(i => i.name).join(', '));
    
    const count = await leads.countDocuments({});
    console.log('\nCollection stats:');
    console.log(`  Documents: ${count.toLocaleString()}`);
    console.log(`  Indexes: ${indexes.length}`);
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

createOptimizedIndexes()
  .then(() => {
    console.log('\n🎉 Database optimization complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
