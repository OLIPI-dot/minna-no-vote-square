const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) {
        const k = key.trim();
        const v = val.join('=').trim().replace(/^['"]|['"]$/g, '');
        if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
        if (k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = v;
    }
});
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
    const { data } = await supabase.from('surveys').select('id, title, image_url').like('title', '%アスキー%').order('id', { ascending: false }).limit(5);
    console.log(data);
}
run();
