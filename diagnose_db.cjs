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

async function diagnose() {
    console.log('--- Database Diagnosis ---');
    console.log('URL:', url);
    
    // Attempt to list columns of surveys
    const { data: cols, error: colError } = await supabase.from('surveys').select('*').limit(1);
    
    if (colError) {
        console.error('Diagnostic Error:', colError);
    } else {
        console.log('Surveys table is accessible. Sample data:', cols);
    }

    // Attempt a very simple insert
    const { data: ins, error: insError } = await supabase.from('surveys').insert([{ title: 'Test' }]).select();
    if (insError) console.error('Insert Error:', insError);
    else console.log('Insert Success:', ins);
}

diagnose().catch(console.error);
