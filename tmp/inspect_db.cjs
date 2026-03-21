const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function inspect() {
    const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Columns:", Object.keys(data[0] || {}));
    data.forEach(s => {
        console.log(`--- [${s.id}] ${s.title} ---`);
        console.log(`Tags: ${JSON.stringify(s.tags)}`);
        console.log(`Description:\n${s.description}`);
    });
}
inspect();
