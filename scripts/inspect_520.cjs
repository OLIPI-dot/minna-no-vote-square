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
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function inspect() {
    console.log('--- Inspecting Survey 520 ---');
    const { data: s } = await supabase.from('surveys').select('*').eq('id', 520).single();
    if (s) {
        console.log('Title:', s.title);
        console.log('Description:', s.description);
        console.log('Tags:', JSON.stringify(s.tags));
    }

    console.log('\n--- Inspecting Comments for 520 ---');
    const { data: c } = await supabase.from('comments').select('*').eq('survey_id', 520);
    if (c) {
        c.forEach(com => {
            console.log(`- Comment ${com.id} (${com.user_name}):`, com.content);
        });
    }
}

inspect();
