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

async function fixTitle() {
    // ID: 292 のアンケートタイトルを修正
    const newTitle = "【物議】沖縄ボート転覆事故と「腕組み謝罪」";
    
    const { error } = await supabase
        .from('surveys')
        .update({ title: newTitle })
        .eq('id', 292);

    if (error) {
        console.error('❌ タイトル修正失敗:', error.message);
    } else {
        console.log(`✅ タイトルを修正しました！: ${newTitle}`);
    }
}

fixTitle();
