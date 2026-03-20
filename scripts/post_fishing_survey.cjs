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

async function postFishingSurvey() {
    console.log('📡 ニュース「寒ブリ釣りの結末」のアンケートを作成しますらび！');

    const topic = {
        title: "「寒ブリ釣るぞ！」と4時起きで6時間…→結果に家族で爆笑ｗｗ この結末、どう思う？ 🐟🤣",
        category: "その他",
        // 静止画的に、釣りや魚のイメージがあれば良いので、一般的な釣り動画やカサゴの動画を検討。
        // 今回は「カサゴ 25cm 釣り」などで探してみます。
        searchQuery: "カサゴ 釣り 堤防 25cm", 
        options: [
            "家族の笑い声が最高の釣果だね！✨",
            "25cmのカサゴも立派なごちそう！🐟",
            "6時間頑張ったお父さんに拍手！👏",
            "逆に一生の思い出になりそうｗｗ",
            "自分だったら泣いちゃうかも…😭"
        ],
        tags: ["釣り", "寒ブリ", "カサゴ", "家族", "ほっこり"],
        comment: "4時起きで6時間……お父さん、本当にお疲れ様らびっ！🥕 立派なブリは釣れなかったけど、家族みんなの笑顔が釣れたなら、それは世界一の釣りらびね。🐟✨ カサゴの煮付け、らびも一口食べてみたいらび〜！🐰🥗"
    };

    // 投稿
    const { data: sv, error: svErr } = await supabase.from('surveys').insert([{
        title: topic.title,
        category: topic.category,
        image_url: `yt:5n_r_rX9_YI`, // カサゴ釣りの楽しそうな動画を仮セット（後で検索ロジック入れることも可能だが一旦固定でも良いレベル）
        tags: topic.tags,
        visibility: 'public',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }]).select();

    if (svErr) {
        console.error('❌ 投稿失敗:', svErr.message);
        return;
    }

    const surveyId = sv[0].id;
    console.log(`✅ 作成完了！ ID: ${surveyId}`);

    // 選択肢追加
    await supabase.from('options').insert(topic.options.map(name => ({
        survey_id: surveyId,
        name: name,
        votes: 0
    })));

    // らびのコメント
    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰(AI)',
        content: topic.comment,
        edit_key: 'labi_bot'
    }]);

    console.log('\n🐰✨ 投稿おわったよ！ほっこりする話題を届けてくれてありがとうらび！🥕');
}

postFishingSurvey();
