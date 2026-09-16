const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let url = '';
let serviceKey = '';

envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) {
        const k = key.trim();
        const v = val.join('=').trim().replace(/^['"]|['"]$/g, '');
        if (k === 'VITE_SUPABASE_URL') url = v;
        if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = v;
    }
});

console.log('URL:', url);
console.log('Service Key prefix:', serviceKey ? serviceKey.substring(0, 15) : 'NONE');

const supabase = createClient(url, serviceKey);

async function testUpdate() {
    const { data, error } = await supabase
        .from('surveys')
        .update({ tags: ['ゲーム', 'レトロゲーム', '便利グッズ'] })
        .eq('id', 22301)
        .select();

    console.log('Error:', error);
    console.log('Updated ID:', data ? data[0]?.id : 'none');
    console.log('Updated tags:', data ? data[0]?.tags : 'none');
}

testUpdate();
