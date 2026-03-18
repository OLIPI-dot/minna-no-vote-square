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

async function postSpecificSurvey() {
    const topic = {
        title: "【物議】沖縄ボート転覆事故と「腕組み謝罪」、あなたはどう感じた？ 🌊🚤",
        category: "ニュース・経済",
        videoId: "682BZbEF6WM",
        options: [
            "謝罪の態度（腕組み）が不適切だと思う",
            "活動家と学校の癒着疑惑に驚いた",
            "事故そのものの再発防止を優先すべき",
            "ニュースとしてもっと詳しく知りたい",
            "その他（コメントで教えて！）"
        ],
        tags: ["沖縄", "ボート転覆", "ニュース", "ヘライザー", "話題"],
        comment: "沖縄での痛ましい事故と、その後の対応が話題になってるみたいらび……。🌊 みんなはこのニュース、どう受け止めたかな？ 動画を見て感じたことを、らびにも教えてほしいらび。🐰🛡️"
    };

    console.log(`🚀 「${topic.title}」を投稿しますらび！`);

    const { data: sv, error: svErr } = await supabase.from('surveys').insert([{
        title: topic.title,
        category: topic.category,
        image_url: `yt:${topic.videoId}`,
        tags: topic.tags,
        visibility: 'public',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }]).select();

    if (svErr) {
        console.error('❌ 投稿失敗:', svErr.message);
        return;
    }

    const surveyId = sv[0].id;
    console.log(`✅ アンケート作成完了！ ID: ${surveyId}`);

    await supabase.from('options').insert(topic.options.map(name => ({
        survey_id: surveyId,
        name: name,
        votes: 0
    })));
    console.log('✅ 選択肢の追加完了！');

    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰(AI)',
        content: topic.comment,
        edit_key: 'labi_bot'
    }]);
    console.log('✅ らびのコメント完了！');

    console.log('\n🐰✨ 完璧に投稿できたよ！おりぴさん、確認してみてねっ！🥕');
}

postSpecificSurvey();
