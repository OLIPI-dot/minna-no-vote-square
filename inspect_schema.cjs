const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspectColumns() {
    console.log('--- Inspecting Surveys Columns ---');
    // We can't use standard SQL unless we're on the dashboard or have an RPC.
    // But we can check a successful row from the past.
    const { data, error } = await supabase.from('surveys').select('*').limit(1);
    
    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Available Columns:', Object.keys(data[0]));
    }
    
    // Also check the 'options' table/relation if it exists separately
    const { data: optCheck, error: optError } = await supabase.from('options').select('*').limit(1);
    if (optError) {
        console.log('No separate "options" table found (or not accessible).');
    } else {
        console.log('Separate "options" table exists!');
    }
}

inspectColumns().catch(console.error);
