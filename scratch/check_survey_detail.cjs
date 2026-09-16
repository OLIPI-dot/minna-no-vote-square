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

async function checkSurvey(id) {
    const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error(error);
        return;
    }
    console.log('--- SURVEY DATA ---');
    console.log('ID:', data.id);
    console.log('Title:', data.title);
    console.log('Category:', data.category);
    console.log('Tags:', data.tags);
    console.log('Description:\n', data.description);
}

const targetId = process.argv[2] ? parseInt(process.argv[2]) : 22301;
checkSurvey(targetId);
