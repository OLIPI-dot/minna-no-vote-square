const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            for (const line of lines) {
                if (line.trim().startsWith(key + '=')) {
                    return line.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
                }
            }
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function updateCategory() {
    const surveyId = 266;
    console.log(`🛠️ アンケートID: ${surveyId} のカテゴリを「エンタメ」に更新中...`);

    const { error } = await supabase
        .from('surveys')
        .update({ category: 'エンタメ' })
        .eq('id', surveyId);

    if (error) {
        console.error('❌ 更新失敗:', error);
    } else {
        console.log('✅ カテゴリの更新が完了しました！');
    }
}

updateCategory();
