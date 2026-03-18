const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            for (const line of lines) {
                if (line.trim().startsWith(key + '=')) {
                    return line.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
                }
            }
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
if (!url || !key) {
    console.error('Env vars not found');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('surveys').select('id, title, image_url, created_at').order('created_at', {ascending: false}).limit(20);
    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
    process.exit(0);
}

check();
