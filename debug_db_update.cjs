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

async function debug() {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  
  console.log('🔗 URL:', url);
  console.log('🔑 Key prefix:', key ? key.substring(0, 10) + '...' : 'null');
  
  const supabase = createClient(url, key);
  
  // 1. Check current state
  const { data: before } = await supabase
    .from('surveys')
    .select('id, title, image_url')
    .order('created_at', { ascending: false })
    .limit(4);
  
  console.log('--- Before Update ---');
  console.log(JSON.stringify(before, null, 2));
  
  // 2. Try update
  const targets = [
    { title: '収集車', videoId: 'sn2DE-WZ_9U' },
    { title: '日鉄', videoId: 'cJB6yCvsT3A' },
    { title: '公示地価', videoId: 'ZmHKShWO3b4' },
    { title: '原油調達', videoId: '2EKQ1XkY0qY' }
  ];
  
  for (const target of targets) {
    const { data: matches } = await supabase.from('surveys').select('id, title').ilike('title', `%${target.title}%`);
    if (matches) {
      for (const m of matches) {
        const { error } = await supabase.from('surveys').update({ image_url: `yt:${target.videoId}` }).eq('id', m.id);
        if (error) console.error(`Failed to update ${m.id}:`, error);
        else console.log(`Updated ${m.id} to yt:${target.videoId}`);
      }
    }
  }
  
  // 3. Confirm after update
  const { data: after } = await supabase
    .from('surveys')
    .select('id, title, image_url')
    .order('created_at', { ascending: false })
    .limit(4);
  
  console.log('--- After Update ---');
  console.log(JSON.stringify(after, null, 2));
}

debug();
