const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspectComments() {
    console.log('--- Inspecting Comments Columns ---');
    const { data, error } = await supabase.from('comments').select('*').limit(1);
    
    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Available Columns:', Object.keys(data[0]));
    } else {
        console.log('No comments found to inspect.');
    }
}

inspectComments();
