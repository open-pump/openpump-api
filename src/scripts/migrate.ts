import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../models/database';

async function runMigration() {
  console.log('🔄 Running database migration...');

  try {
    // Read schema file
    const schemaPath = join(__dirname, '../../config/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute schema
    await db.query(schema);

    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
