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

async function fixComment() {
    const surveyId = 265; // カツヒコ氏のアンケートID
    const newContent = "ニコニコ動画の伝説のネタらび！🐰✨ このシュールな雰囲気、ニコニコ動画ならではの楽しさがあるよね！💪 筋肉美にも注目らび！";

    console.log(`🛠️ アンケートID: ${surveyId} のコメントを修正中...`);

    const { error } = await supabase
        .from('comments')
        .update({ content: newContent })
        .eq('survey_id', surveyId)
        .eq('user_name', 'らび🐰(AI)');

    if (error) {
        console.error('❌ 修正失敗:', error);
    } else {
        console.log('✅ コメントの修正が完了しました！');
    }
}

fixComment();
