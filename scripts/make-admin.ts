/**
 * Script to make a user an admin
 * Usage: bun run scripts/make-admin.ts <email>
 */

import { getDb } from '../lib/db';

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: bun run scripts/make-admin.ts <email>');
    process.exit(1);
  }

  try {
    const db = await getDb();
    const result = await db.collection('users').updateOne(
      { email },
      { $set: { role: 'admin' } }
    );

    if (result.matchedCount === 0) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('Make sure the user has signed in at least once.');
      process.exit(1);
    }

    console.log(`✅ Successfully made ${email} an admin!`);
    console.log('The user needs to sign out and sign back in for changes to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeAdmin();
