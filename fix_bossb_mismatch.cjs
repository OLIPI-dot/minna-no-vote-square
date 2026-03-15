const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function fixBossB() {
    console.log('--- Fixing BossB Content (ID: 193) ---');
    // Using the most famous 'Universe ending' video ID confirmed by browser search
    const { error } = await supabase.from('surveys').update({ image_url: 'yt:6Y4oROvbfS8' }).eq('id', 193);
    
    if (error) console.error('Error:', error);
    else console.log('Fixed BossB video to Universe Ending trailer.');
}

fixBossB().catch(console.error);
