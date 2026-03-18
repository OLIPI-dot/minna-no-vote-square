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

async function checkThree() {
    console.log('--- Checking DB State for 282, 283, 284 ---');
    const { data: before, error: err1 } = await supabase.from('surveys').select('id, title, image_url').in('id', [282, 283, 284]);
    if (err1) console.error('Error fetching before:', err1.message);
    else console.log('Current Data:', JSON.stringify(before, null, 2));

    console.log('\n--- Attempting Update to verify RLS ---');
    const { data: after, error: err2, status } = await supabase
        .from('surveys')
        .update({ image_url: 'yt:ykAeAdxAcPc' }) // ID 282
        .eq('id', 282)
        .select();

    if (err2) console.error('Update Error:', err2.message);
    else {
        console.log('Update Status:', status);
        console.log('Updated Row (if any):', JSON.stringify(after, null, 2));
        if (after && after.length === 0) {
            console.log('⚠️ WARNING: Update returned 0 rows. This usually means RLS is blocking the update or the row does not match criteria.');
        }
    }
}

checkThree();
