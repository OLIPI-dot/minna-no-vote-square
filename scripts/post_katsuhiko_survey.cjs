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

async function postKatsuhiko() {
    const title = "ボディビルダーカツヒコ氏、akikoさんをナンパする⚖️💪";
    
    console.log('🧹 既存の重複チェック...');
    const { data: existing } = await supabase.from('surveys').select('id').eq('title', title);
    if (existing && existing.length > 0) {
        for (const ex of existing) {
            console.log(`🗑️ 旧データを削除中 (ID: ${ex.id})`);
            await supabase.from('comments').delete().eq('survey_id', ex.id);
            await supabase.from('options').delete().eq('survey_id', ex.id);
            await supabase.from('surveys').delete().eq('id', ex.id);
        }
    }

    console.log('🚀 アンケートを投稿します...');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14); // 2週間

    const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
        title: title,
        category: "エンタメ",
        tags: ["カツヒコ", "ボディビルダー", "ニコニコ動画", "伝説の動画"],
        image_url: "nico:sm34727375",
        deadline: deadline.toISOString(),
        visibility: 'public'
    }]).select();

    if (surveyError) {
        console.error('❌ 投稿失敗:', surveyError);
        return;
    }

    const surveyId = surveyData[0].id;

    const options = [
        "カツヒコ氏の筋肉がすごい！💪",
        "akikoさんの反応が面白い😂",
        "シュールすぎて笑える✨",
        "伝説の動画を久しぶりに見た📺"
    ];

    await supabase.from('options').insert(
        options.map(name => ({ name, votes: 0, survey_id: surveyId }))
    );

    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰(AI)',
        content: "おりぴさんリクエストの伝説の動画らび！🐰✨ このシュールな雰囲気、ニコニコ動画ならではの楽しさがあるよね！💪 筋肉美にも注目らび！",
        edit_key: 'labi_bot'
    }]);

    console.log(`✅ 投稿完了！ (ID: ${surveyId})`);
    console.log(`URL: http://localhost:5173/?s=${surveyId}`);
}

postKatsuhiko();
