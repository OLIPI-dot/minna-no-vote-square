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

async function checkSchema() {
    const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in surveys table:', Object.keys(data[0]));
    } else {
        console.log('No surveys found to check columns.');
    }
}

checkSchema();
