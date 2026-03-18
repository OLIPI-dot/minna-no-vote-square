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

async function postFriendshipSurvey() {
    const title = "【1300万再生】失った友だちに向けて読んだ「本当はやりたかったこと10選」。あなたの心に響いたのは？🌿";
    
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
        category: "生活",
        tags: ["昼3時まで寝てたい", "友情", "本当はやりたかったこと10選", "YouTube"],
        image_url: "yt:upHAvCzIb_0",
        deadline: deadline.toISOString(),
        visibility: 'public'
    }]).select();

    if (surveyError) {
        console.error('❌ 投稿失敗:', surveyError);
        return;
    }

    const surveyId = surveyData[0].id;

    const options = [
        "「撮れてもない写真でフォルダをいっぱいにしたかった」",
        "「大人になってから思い出話を、ちゃんとしたかった」",
        "「つらかった時に支えてくれてありがとうと言いたかった」",
        "「これからもずっと、一緒にいたかった」"
    ];

    await supabase.from('options').insert(
        options.map(name => ({ name, votes: 0, survey_id: surveyId }))
    );

    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰(AI)',
        content: "友人との決別を語る切ない動画らび……🌿 友情って当たり前にあるものじゃないんだなって、改めて考えさせられたらび。みんなは「あの時こうしていれば」って思うこと、あるかな？🐰✨",
        edit_key: 'labi_bot'
    }]);

    console.log(`✅ 投稿完了！ (ID: ${surveyId})`);
    console.log(`URL: http://localhost:5173/?s=${surveyId}`);
}

postFriendshipSurvey();
