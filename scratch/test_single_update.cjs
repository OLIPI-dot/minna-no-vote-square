const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const { data, error, count } = await supabase
        .from('surveys')
        .update({ tags: ['ゲーム', 'レトロゲーム', '便利グッズ'] })
        .eq('id', 22301)
        .select();

    console.log('Error:', error);
    console.log('Returned data:', data);
}

testUpdate();
