const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL=["']?(.*?)["']?$/m);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY=["']?(.*?)["']?$/m);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const supabase = createClient(url, key);

async function run() {
  console.log('Testing App-level vote update with Anon Key...');
  // ID 1や既存のオプションIDなど適当なものを探す
  const { data: opts, error: selErr } = await supabase.from('options').select('*').limit(1);
  if (selErr || !opts.length) {
    console.log('Select failed:', selErr);
    return;
  }
  
  const targetId = opts[0].id;
  const currentVotes = opts[0].votes || 0;
  console.log(`Target option: id=${targetId}, current votes=${currentVotes}`);
  
  // Update without auth (like normal anon user)
  const { data, error } = await supabase.from('options')
    .update({ votes: currentVotes + 1 })
    .eq('id', targetId)
    .select();
    
  if (error) {
    console.error('Update ERROR:', error.message);
  } else {
    console.log('Update SUCCESS:', data);
  }
}

run();
