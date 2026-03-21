const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const files = ['.env.local', '.env'];
    for (const f of files) {
        if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf8');
            const match = content.split('\n').find(line => line.startsWith(`${key}=`));
            if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function checkDescs() {
    console.log('--- Latest 10 Surveys Descriptions ---');
    const { data, error } = await supabase
        .from('surveys')
        .select('id, title, description, is_official')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error.message);
    } else {
        data.forEach(s => {
            console.log(`ID: ${s.id} | Official: ${s.is_official} | Desc Length: ${s.description ? s.description.length : 0}`);
            if (s.description) console.log(`  Desc Start: ${s.description.slice(0, 30)}...`);
        });
    }
}

checkDescs();
