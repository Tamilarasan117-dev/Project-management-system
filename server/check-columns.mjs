import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const url = process.env.SUPABASE_URL + '/rest/v1/?apikey=' + process.env.SUPABASE_ANON_KEY;
  const res = await fetch(url);
  const data = await res.json();
  const tables = Object.keys(data.definitions);
  console.log('Tables:', tables);
  if (data.definitions.projects) {
    console.log('Projects:', Object.keys(data.definitions.projects.properties));
  }
  if (data.definitions.milestones) {
    console.log('Milestones:', Object.keys(data.definitions.milestones.properties));
  }
}
check();
