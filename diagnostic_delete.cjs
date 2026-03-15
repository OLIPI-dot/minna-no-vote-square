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

async function testDelete() {
    console.log('--- Testing Delete for ID 190 ---');
    const { data, error, status } = await supabase
        .from('surveys')
        .delete()
        .eq('id', 190)
        .select();
    
    if (error) {
        console.error('Delete Error:', error);
    } else {
        console.log('Delete Status:', status);
        console.log('Returned Data:', JSON.stringify(data, null, 2));
    }
}

testDelete().catch(console.error);
