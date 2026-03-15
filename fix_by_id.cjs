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

async function fix() {
    // Slay the Spire 2 (id: 188 confirmed from previous logs)
    const { error: e1 } = await supabase.from('surveys').update({ image_url: 'yt:krDFltgjLtE' }).eq('id', 188);
    if (e1) console.error('Error updating 188:', e1);
    else console.log('Fixed Survey 188');

    // Kaguya-hime (id: 190 confirmed from list output)
    const { error: e2 } = await supabase.from('surveys').update({ image_url: 'yt:KAXwdY3ei7c' }).eq('id', 190);
    if (e2) console.error('Error updating 190:', e2);
    else console.log('Fixed Survey 190');
    
    // BossB (id 189 was showing nullSIwfXPESJ8k)
    const { error: e3 } = await supabase.from('surveys').update({ image_url: 'yt:SIwfXPESJ8k' }).eq('id', 189);
    if (e3) console.error('Error updating 189:', e3);
    else console.log('Fixed Survey 189');
}

fix().catch(console.error);
