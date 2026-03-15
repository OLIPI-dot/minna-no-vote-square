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

async function finalFix() {
    console.log('--- Final IDs Injection ---');
    // Slay the Spire 2 (id: 188)
    await supabase.from('surveys').update({ image_url: 'yt:krDFltgjLtE' }).eq('id', 188);
    // Kaguya-hime (id: 190) - Using verified JP ID
    await supabase.from('surveys').update({ image_url: 'yt:TH-U3eQwcWM' }).eq('id', 190);
    // BossB (id: 189)
    await supabase.from('surveys').update({ image_url: 'yt:SIwfXPESJ8k' }).eq('id', 189);

    console.log('Update Complete.');
}

finalFix().catch(console.error);
