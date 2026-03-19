const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (name) => {
    const env = fs.readFileSync('i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\.env', 'utf8');
    const match = env.match(new RegExp(`${name}=(.*)`));
    return match ? match[1].trim() : null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function checkLastSurveys() {
    const { data, error } = await supabase
        .from('surveys')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    console.log('--- Last 5 Surveys ---');
    data.forEach(s => {
        console.log(`${s.created_at}: ${s.title}`);
    });
}

checkLastSurveys();
