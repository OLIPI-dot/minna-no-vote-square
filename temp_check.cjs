const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
let supabaseUrl, supabaseKey;
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            const v = value.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v;
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' || key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = v;
        }
    });
}
const supabase = createClient(supabaseUrl, supabaseKey);
supabase.from('surveys').select('description').order('created_at', { ascending: false }).limit(10).then(res => {
    console.log(JSON.stringify(res.data, null, 2));
    process.exit(0);
});
