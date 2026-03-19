const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\.env';
const getEnv = (name) => {
    const env = fs.readFileSync(envPath, 'utf8');
    const lines = env.split('\n');
    for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        if (key.trim() === name) {
            return valueParts.join('=').trim();
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function findOptionsTable() {
    // Try common names
    const tables = ['options', 'survey_options', 'choices'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Found table: ${table}`);
            if (data && data.length > 0) {
                console.log(`Columns in ${table}:`, Object.keys(data[0]));
            } else {
                console.log(`Table ${table} is empty.`);
            }
            return;
        }
    }
    console.log('No common options table found.');
}

findOptionsTable();
