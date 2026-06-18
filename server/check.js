const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dhgsjalujpfmsranwdqy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoZ3NqYWx1anBmbXNyYW53ZHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MTY5ODUsImV4cCI6MjA5NzA5Mjk4NX0.4eoWIBVHn87zSHYd5Op9qUvlQoiJk-d79LwL9TNo2PM'
);

async function check() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  if (error) {
    console.error('Error connecting to Supabase or projects table missing:', error.message);
  } else {
    console.log('Success! Supabase is reachable and projects table exists. Data:', data);
  }
}
check();
