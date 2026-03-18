import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';

export const supabase = createClient(
  config.database.url,
  config.database.key
);

export async function testConnection() {
  const { error } = await supabase.from('issues').select('id').limit(1);
  if (error) {
    console.warn('⚠️ Database connection issue (run DATABASE_SCHEMA.sql in Supabase):', error.message);
    return;
  }
  console.log('✅ Database connected');
}
