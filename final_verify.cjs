const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function verify() {
    console.log('--- Final Sanity Check ---');
    const { data, error } = await supabase.from('surveys').select('id, title, category').order('id', { ascending: false }).limit(5);
    
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

verify().catch(console.error);
