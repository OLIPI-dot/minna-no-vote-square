const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- Strict DB Check ---');
    const { data, error } = await supabase
        .from('surveys')
        .select('id, title, category')
        .in('id', [203, 204]);
    
    if (error) {
        console.error(error);
        return;
    }

    data.forEach(s => {
        console.log(`ID: ${s.id}`);
        console.log(`Title: ${s.title}`);
        console.log(`Category: "${s.category}" (Length: ${s.category ? s.category.length : 0})`);
        console.log('---');
    });
}

check().catch(console.error);
