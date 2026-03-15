const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function fixCategory() {
    console.log('--- Fixing ID 204 Category ---');
    const { data, error } = await supabase
        .from('surveys')
        .update({ category: 'エンタメ' })
        .eq('id', 204)
        .select();
    
    if (error) console.error(error);
    else console.log('Successfully updated:', data);
}

fixCategory().catch(console.error);
