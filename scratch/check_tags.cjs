const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
} else {
    envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
}

const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTags() {
    const { data, error } = await supabase
        .from('surveys')
        .select('id, title, category, tags')
        .order('id', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }
    console.log(JSON.stringify(data, null, 2));
}

checkTags();
