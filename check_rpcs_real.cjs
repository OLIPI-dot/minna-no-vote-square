const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
  const envPaths = ['.env.local', '.env'];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        if (line.trim().startsWith(key + '=')) {
          return line.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
      }
    }
  }
  return process.env[key];
};

async function testRpcs() {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const supabase = createClient(url, key);

  const realId = 171; // Known ID from inspect_data.cjs

  console.log('--- Testing increment_survey_view ---');
  const { error: viewErr } = await supabase.rpc('increment_survey_view', { survey_id: realId });
  if (viewErr) {
    console.log('increment_survey_view error:', viewErr.message);
  } else {
    console.log('increment_survey_view success!');
  }

  console.log('\n--- Testing increment_survey_like ---');
  const { error: likeErr } = await supabase.rpc('increment_survey_like', { 
    survey_id: realId, 
    increment_val: 1 
  });
  if (likeErr) {
    console.log('increment_survey_like error:', likeErr.message);
  } else {
    console.log('increment_survey_like success!');
  }
}

testRpcs();
