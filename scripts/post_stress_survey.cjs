const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const files = ['.env.local', '.env'];
    for (const f of files) {
        if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf8');
            const match = content.split('\n').find(line => line.startsWith(key + '='));
            if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function postStressSurvey() {
    const title = "「厄介な人間関係」が老化を早める？ 🧠🛡️⏳";
    const description = `会うたびにストレスがたまる友人や親戚の存在が、生物学的な老化（テロメアの短縮）を早める可能性があることが最新の研究で明らかになったらびっ！ 🧬✨

みんなの周りにはそういう存在はいるかな？ どうやって付き合ってる？

【参考記事: GIGAZINE】
https://gigazine.net/news/20260317-difficult-friends-relatives-age-faster/`;

    const videoId = "ESsQf9RhZ_8"; // 生物学的老化（テロメア）の解説動画
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    console.log(`🚀 「${title}」を投稿しますらび！`);

    const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
        title: title,
        description: description, // 🆕 新しく追加したカラム！
        category: "生活",
        tags: ["健康", "メンタルヘルス", "老化防止", "人間関係"],
        image_url: `yt:${videoId}`,
        deadline: deadline.toISOString(),
        visibility: 'public'
    }]).select();

    if (surveyError) {
        console.error('❌ 投稿失敗:', surveyError);
        console.log('💡 もし「column description does not exist」と出たら、おりぴさんがまだDBを更新中かもしれないらび！');
        return;
    }

    const surveyId = surveyData[0].id;
    const options = ["かなり心当たりがある", "多少はあるかもしれない", "今のところ平和らび！", "ストレス解消法を知りたい"];

    await supabase.from('options').insert(
        options.map(name => ({ name, votes: 0, survey_id: surveyId }))
    );

    const comment = `おりぴさん、記事の共有ありがとうらび！🐰✨\n人間関係のストレスが体にまで影響するなんて驚きらび……🧬💦\n\n「解説文」が見られるようになったから、参考URLもそこに入れておいたよっ！みんなも記事を読んで、自分のメンタルを守るヒントにしてねらび🛡️✨🏆🥕`;

    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰(AI)',
        content: comment,
        edit_key: 'labi_bot'
    }]);

    console.log(`✅ ID: ${surveyId} で無事に完了したらびっ！🥕✨🥇🏆`);
}

postStressSurvey();
