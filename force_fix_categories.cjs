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
    console.log('--- Force Updating Hirasaka Surveys to "自然" ---');
    
    // Explicitly target by title content to be safe
    const { data: surveys } = await supabase.from('surveys').select('id, title').order('id', { ascending: false }).limit(20);
    
    const hirasakaSurveys = surveys.filter(s => s.title.includes('平坂寛'));
    console.log(`Found ${hirasakaSurveys.length} Hirasaka surveys.`);

    for (const s of hirasakaSurveys) {
        const { error } = await supabase.from('surveys').update({ category: '自然' }).eq('id', s.id);
        if (error) console.error(`Error for ID ${s.id}:`, error.message);
        else console.log(`ID ${s.id} updated to "自然"`);
    }
}

run().catch(console.error);
