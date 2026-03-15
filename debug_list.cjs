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

async function listAll() {
    const { data: surveys, error } = await supabase.from('surveys').select('id, title, image_url').order('id', { ascending: false }).limit(30);
    if (error) {
        console.error('Error:', error);
        return;
    }
    surveys.forEach(s => {
        console.log(`ID: ${s.id} | Title: ${s.title.substring(0, 30)} | URL: ${s.image_url}`);
    });
}

listAll().catch(console.error);
