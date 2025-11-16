import { randomBytes } from 'crypto';
import { db } from '../models/database';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create test user
    const user = await db.queryOne<{ id: string }>(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = $2
       RETURNING id`,
      ['test@openpump.io', 'Test User']
    );

    if (!user) {
      throw new Error('Failed to create test user');
    }

    console.log('✅ Created test user:', user.id);

    // Create API keys for each tier
    const tiers = ['free', 'starter', 'pro', 'elite'] as const;

    for (const tier of tiers) {
      const apiKey = `openpump_${tier}_${randomBytes(16).toString('hex')}`;

      const result = await db.queryOne<{ key: string }>(
        `INSERT INTO api_keys (key, user_id, tier)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET tier = $3
         RETURNING key`,
        [apiKey, user.id, tier]
      );

      console.log(`✅ Created ${tier} API key:`, result?.key);
    }

    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('You can now use these API keys to test the API:');
    console.log('- Add them to your .env file or');
    console.log('- Use them in Authorization header: Bearer <api_key>');
    console.log('- Or as query parameter: ?api_key=<api_key>\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
