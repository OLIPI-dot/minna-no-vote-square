const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数取得
const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        const fullPath = path.resolve(p);
        if (fs.existsSync(fullPath)) {
            const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith(key + '=')) {
                    return trimmed.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
                }
            }
        }
    }
    return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');


if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOptions() {
  const { data: surveys, error: surveyError } = await supabase
    .from('surveys')
    .select('id, title');

  if (surveyError) {
    console.error("Survey Fetch Error:", surveyError);
    return;
  }

  let found = 0;
  for (const s of surveys) {
    const { count, error } = await supabase
      .from('options')
      .select('*', { count: 'exact', head: true })
      .eq('survey_id', s.id);
    
    if (count === 0) {
      console.log(`❌ ID: ${s.id} | Title: ${s.title}`);
      found++;
    }
  }
  console.log(`Finished checking ${surveys.length} surveys. Found ${found} with 0 options.`);
}












checkOptions();
