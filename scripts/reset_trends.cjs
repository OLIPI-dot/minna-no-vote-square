const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    let envFile = '';
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            envFile = fs.readFileSync(p, 'utf8');
            break;
        }
    }
    const match = envFile.split('\n').find(line => line.startsWith(`${key}=`));
    if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
    return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const patterns = ["%村八分%", "%ネズミ寿司%", "%収益化停止%", "%てりたま%"];

async function deleteSurveys() {
    for (const p of patterns) {
        console.log(`🔍 削除対象を検索中: ${p}`);
        const { data: surveys } = await supabase.from('surveys').select('id, title').ilike('title', p);
        
        if (surveys && surveys.length > 0) {
            for (const s of surveys) {
                console.log(`🗑️ 削除中: ID ${s.id} (${s.title})`);
                
                // 依存データの削除（comments, options）
                await supabase.from('comments').delete().eq('survey_id', s.id);
                await supabase.from('options').delete().eq('survey_id', s.id);
                // アンケート本体の削除
                const { error } = await supabase.from('surveys').delete().eq('id', s.id);
                
                if (error) {
                    console.error(`❌ 削除失敗 ID ${s.id}:`, error);
                } else {
                    console.log(`✅ 削除完了: ID ${s.id}`);
                }
            }
        }
    }
    console.log('✨ 削除処理がすべて完了しました。');
}

deleteSurveys();
