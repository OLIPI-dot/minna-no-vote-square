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

async function investigateAndFix() {
    console.log('--- Current Data for Suspected Surveys ---');
    const { data: surveys } = await supabase.from('surveys').select('id, title, image_url').or('title.ilike.%かぐや%,title.ilike.%Spire%,title.ilike.%BossB%');
    
    surveys.forEach(s => {
        console.log(`ID: ${s.id} | Title: ${s.title} | URL: ${s.image_url}`);
    });

    console.log('\n--- Correcting with VERIFIED IDs ---');
    // Slay the Spire 2
    await supabase.from('surveys').update({ image_url: 'yt:krDFltgjLtE' }).eq('id', 188);
    // Kaguya-hime
    await supabase.from('surveys').update({ image_url: 'yt:KAXwdY3ei7c' }).eq('id', 190);
    // BossB
    await supabase.from('surveys').update({ image_url: 'yt:SIwfXPESJ8k' }).eq('id', 189);

    console.log('Update Complete.');
}

investigateAndFix().catch(console.error);
