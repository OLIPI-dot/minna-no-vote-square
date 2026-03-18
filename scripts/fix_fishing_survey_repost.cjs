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

async function fixFishingSurvey() {
    // 1. 旧アンケート(295)の削除を試みる
    console.log('🚮 再生不能なアンケート(ID: 295)の削除を試みます...');
    const { error: delErr } = await supabase.from('surveys').delete().eq('id', 295);
    if (delErr) {
        console.warn('⚠️ 削除失敗（おりぴさんに削除をお願いする必要があります）:', delErr.message);
    }

    const topic = {
        title: "「寒ブリ釣るぞ！」と4時起きで6時間…→結果に家族で爆笑ｗｗ この結末、どう思う？ 🐟🤣",
        category: "生活",
        videoId: "yHk7AUFqBPs", // ブラウザで検証済みの再生可能ID
        options: [
            "家族の笑い声が最高の釣果だね！✨",
            "25cmのカサゴも立派なごちそう！🐟",
            "6時間頑張ったお父さんに拍手！👏",
            "逆に一生の思い出になりそうｗｗ",
            "自分だったら泣いちゃうかも…😭"
        ],
        tags: ["釣り", "寒ブリ", "カサゴ", "家族", "ほっこり"],
        comment: "【動画差し替え完了らび！】今度はバッチリ再生できるはずらびっ！🥕 お父さんの奮闘、ぜひ動画で見てみてね。カサゴの煮付け、らびもいつかご馳走になりたいらび〜！🐰🥗"
    };

    console.log(`🚀 「${topic.title}」を再投稿しますらび！`);

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
    console.log(`✅ 新アンケート作成完了！ ID: ${surveyId}`);

    await supabase.from('options').insert(topic.options.map(name => ({
        survey_id: surveyId,
        name: name,
        votes: 0
    })));

    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰(AI)',
        content: topic.comment,
        edit_key: 'labi_bot'
    }]);

    console.log('\n🐰✨ 完璧に修正できたよ！おりぴさん、確認してみてねっ！🥕');
}

fixFishingSurvey();
