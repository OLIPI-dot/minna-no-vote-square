const fs = require('fs');

const getEnv = (key) => {
    let envFile = '';
    if (fs.existsSync('.env.local')) envFile = fs.readFileSync('.env.local', 'utf8');
    else if (fs.existsSync('.env')) envFile = fs.readFileSync('.env', 'utf8');
    const match = envFile.split('\n').find(line => line.startsWith(`${key}=`));
    if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

async function check() {
    console.log('--- RABIS POST HISTORY ---');
    const res = await fetch(`${url}/rest/v1/surveys?category=eq.らび&select=id,title,created_at&order=created_at.desc&limit=10`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    if (!res.ok) {
        console.error('Failed to fetch:', res.status, await res.text());
        return;
    }
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

check();
