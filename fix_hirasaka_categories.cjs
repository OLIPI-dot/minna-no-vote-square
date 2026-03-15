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
    console.log('--- Current Surveys ---');
    const { data: surveys, error: listErr } = await supabase.from('surveys').select('id, title, category').order('id', { ascending: false }).limit(10);
    if (listErr) {
        console.error(listErr);
        return;
    }
    surveys.forEach(s => console.log(`${s.id}: [${s.category}] ${s.title}`));

    console.log('\n--- Correcting Categories to "自然" ---');
    // We want to target Hirasaka's videos. 
    // From logs: 203 (Squid), 204 (Habu)
    const targets = surveys.filter(s => s.title.includes('平坂寛')).map(s => s.id);
    
    if (targets.length === 0) {
        console.log('No Hirasaka surveys found to update.');
        return;
    }

    const { data: updated, error: updateErr } = await supabase
        .from('surveys')
        .update({ category: '自然' })
        .in('id', targets)
        .select();

    if (updateErr) console.error(updateErr.message);
    else {
        console.log(`Successfully updated ${updated.length} surveys to "自然" category.`);
    }
}

run().catch(console.error);
