const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log('--- Double Check & Fix Categories ---');
    const { data: surveys } = await supabase.from('surveys').select('id, title, category').in('id', [203, 204]);
    
    for (const s of surveys) {
        console.log(`Current: ID ${s.id} is "${s.category}"`);
        if (s.category !== '自然') {
            const { error } = await supabase.from('surveys').update({ category: '自然' }).eq('id', s.id);
            if (error) console.error(`Error for ID ${s.id}:`, error.message);
            else console.log(`ID ${s.id} -> "自然" (Done)`);
        }
    }
}

run().catch(console.error);
