const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env から環境変数を手動で読み込むらび！
const envPath = path.join(__dirname, '..', '.env');
let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
    console.log('🧹 動画なしアンケートのお掃除を開始するらび！');
    const idsToDelete = [418, 419, 420];
    
    for (const id of idsToDelete) {
        // コメントも削除
        await supabase.from('comments').delete().eq('survey_id', id);
        // アンケート本体を削除
        const { error } = await supabase.from('surveys').delete().eq('id', id);
        if (error) {
            console.error(`❌ ID ${id} の削除に失敗したらび:`, error.message);
        } else {
            console.log(`✅ ID ${id} を削除したらび！`);
        }
    }
}

cleanup();
