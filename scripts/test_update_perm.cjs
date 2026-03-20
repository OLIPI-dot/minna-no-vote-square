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
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function testUpdate() {
    const id = 520;
    console.log(`--- Testing update for ID ${id} ---`);
    
    const { data: before } = await supabase.from('surveys').select('description').eq('id', id).single();
    console.log('Description before:', before?.description?.slice(-20));

    const fixed = before.description.replace(/\]\]>/g, '').trim();
    
    const { data, error, status } = await supabase
        .from('surveys')
        .update({ description: fixed })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Update Error:', error.message);
    } else {
        console.log('Status:', status);
        console.log('Data returned (length):', data?.length);
        if (data && data.length > 0) {
            console.log('Description after:', data[0].description.slice(-20));
        } else {
            console.log('⚠️ No rows updated. RLS likely blocking.');
        }
    }
}

testUpdate();
