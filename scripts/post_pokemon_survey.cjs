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

async function postPokemonSurvey() {
    console.log('📡 ニュース「ぽこ あ ポケモン 火山灰全消去」のアンケートを作成しますらび！');

    const topic = {
        title: "【驚愕】『ぽこ あ ポケモン』の火山灰を全消去！？街に隠された秘密、どう思う？ 🐹🌋",
        category: "ゲーム・ホビー",
        videoId: "vbrs38Vf_jk",
        options: [
            "全消去する根気が凄すぎる！👏",
            "隠された秘密（イースターエッグ）が気になる！🥚",
            "自分もこのゲームをやってみたい！🎮",
            "街が綺麗になってスッキリしたね✨",
            "他のマップの掃除も見てみたい！🧹"
        ],
        tags: ["ポケモン", "ぽこあポケモン", "Switch2", "ゲーム", "話題"],
        comment: "Switch 2の新作『ぽこ あ ポケモン』で、街中の火山灰を全部壊しちゃった人がいるんだって！らび、その根気に脱帽らび……🥕🌋 灰の下には一体何が隠されてたんだろう？ みんなもこのゲーム、気になってるかな？🐰🛡️✨"
    };

    // 投稿
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

    console.log('\n🐰✨ ポケモンのニュースも投稿できたよ！おりぴさん、確認してみてねっ！🥕');
}

postPokemonSurvey();
