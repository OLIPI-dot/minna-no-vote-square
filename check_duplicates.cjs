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

async function checkAll() {
    const { data: surveys, error } = await supabase.from('surveys').select('id, title, image_url, created_at').or('title.ilike.%かぐや%,title.ilike.%Spire%,title.ilike.%BossB%').order('id', { ascending: false });
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(JSON.stringify(surveys, null, 2));
}

checkAll().catch(console.error);
