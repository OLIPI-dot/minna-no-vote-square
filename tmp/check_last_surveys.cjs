const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function checkLastSurveys() {
    const { data, error } = await supabase
        .from('surveys')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    console.log('--- Last 10 Surveys ---');
    data.forEach(s => {
        console.log(`${s.created_at}: ${s.title}`);
    });
}

checkLastSurveys();
