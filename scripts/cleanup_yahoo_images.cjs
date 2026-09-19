const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAndClean() {
  const { data: surveys, error } = await supabase.from('surveys')
    .select('id, title, image_url, created_at')
    .like('image_url', '%yimg.jp%');
    
  if (error) {
    console.error('Error fetching surveys:', error);
    return;
  }
  
  console.log('Found ' + surveys.length + ' surveys with Yahoo images.');
  
  let cleanedCount = 0;
  const now = Date.now();
  
  for (const s of surveys) {
    const createdTime = new Date(s.created_at).getTime();
    // 3 hours = 3 * 60 * 60 * 1000 = 10800000 ms
    if (now - createdTime > 10800000) {
      const { error: updateError } = await supabase.from('surveys')
        .update({ image_url: null })
        .eq('id', s.id);
        
      if (updateError) {
        console.error('Error updating survey ' + s.id + ':', updateError);
      } else {
        cleanedCount++;
      }
    }
  }
  
  console.log('Successfully cleaned up ' + cleanedCount + ' expired Yahoo images!');
}

checkAndClean();
