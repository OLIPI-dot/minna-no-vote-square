const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function listOptions() {
    console.log('--- Listing Options for ID 191 ---');
    const { data, error } = await supabase.from('options').select('*').eq('survey_id', 191);
    
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Options for #191:', data);
    }
}

listOptions().catch(console.error);
