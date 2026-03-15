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

async function diagnosticUpdate() {
    console.log('--- Attempting Update for ID 190 ---');
    const { data, error, status } = await supabase
        .from('surveys')
        .update({ image_url: 'yt:TH-U3eQwcWM' })
        .eq('id', 190)
        .select();
    
    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Status:', status);
        console.log('Returned Data:', JSON.stringify(data, null, 2));
    }
}

diagnosticUpdate().catch(console.error);
