require('dotenv').config({ path: '../client/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('milestones').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
