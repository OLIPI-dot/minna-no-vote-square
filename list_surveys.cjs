const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let envFile = '';
if (fs.existsSync('.env.local')) envFile = fs.readFileSync('.env.local', 'utf8');
else if (fs.existsSync('.env')) envFile = fs.readFileSync('.env', 'utf8');

const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function list() {
    const { data: surveys, error } = await supabase.from('surveys').select('id, title, image_url').order('created_at', { ascending: false }).limit(20);
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log(JSON.stringify(surveys, null, 2));
}

list().catch(console.error);
