const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function atomic() {
    console.log('--- Atomic Fix & Verify ---');
    const ids = [203, 204];
    
    // 1. Update
    const { error: updErr } = await supabase.from('surveys').update({ category: '自然' }).in('id', ids);
    if (updErr) {
        console.error('Update Error:', updErr.message);
        return;
    }
    console.log('Update command sent.');

    // 2. Select back
    const { data, error: selErr } = await supabase.from('surveys').select('id, title, category').in('id', ids);
    if (selErr) {
        console.error('Select Error:', selErr.message);
        return;
    }

    data.forEach(s => {
        console.log(`Verified DB: ID ${s.id} is "${s.category}" (Expected: "自然")`);
    });
}

atomic().catch(console.error);
