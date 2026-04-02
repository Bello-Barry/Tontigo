const fs = require('fs');
const content = fs.readFileSync('tontigo.md', 'utf8');
const lines = content.split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')) start = i - 3;
  if (lines[i].includes('CREATE POLICY "Voir la blacklist"')) end = i + 1;
}
if (start !== -1 && end !== -1) {
  const sql = lines.slice(start, end).join('\n');
  if (!fs.existsSync('supabase/migrations')) fs.mkdirSync('supabase/migrations', { recursive: true });
  fs.writeFileSync('supabase/migrations/001_initial_schema.sql', sql);
  console.log('Migration extraite et sauvegardee.');
} else {
  console.log('Echec de l\'extraction. start:', start, 'end:', end);
}
