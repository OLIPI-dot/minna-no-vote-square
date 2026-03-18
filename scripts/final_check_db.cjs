const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    let envFile = '';
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            envFile = fs.readFileSync(p, 'utf8');
            break;
        }
    }
    const match = envFile.split('\n').find(line => line.startsWith(`${key}=`));
    if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
    return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data: surveys, error: sError } = await supabase.from('surveys').select('id, title, category, tags, image_url').order('id', { ascending: false }).limit(6);
    if (sError) console.error(sError);
    console.log('--- Surveys ---');
    console.log(JSON.stringify(surveys, null, 2));

    for (const s of surveys) {
        const { data: options, error: oError } = await supabase.from('options').select('name').eq('survey_id', s.id);
        console.log(`--- Options for ID ${s.id} (${s.title}) ---`);
        console.log(options.map(o => o.name).join(', '));
    }
}

check();
