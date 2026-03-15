const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function createSurvey(title, category, tags, ytId, options, comment) {
    const { data: survey, error: sError } = await supabase
        .from('surveys')
        .insert([{
            title,
            category,
            tags,
            image_url: `yt:${ytId}`,
            created_at: new Date().toISOString(),
            user_id: null // Or a specific ID if you have one
        }])
        .select();

    if (sError) {
        console.error('Survey Error:', sError);
        return;
    }

    const surveyId = survey[0].id;

    const optionData = options.map(name => ({
        survey_id: surveyId,
        name,
        votes: 0
    }));

    const { error: oError } = await supabase.from('options').insert(optionData);
    if (oError) {
        console.error('Options Error:', oError);
        return;
    }

    if (comment) {
        const { error: cError } = await supabase.from('comments').insert([{
            survey_id: surveyId,
            author_name: 'らび',
            content: comment,
            is_labi: true
        }]);
        if (cError) console.error('Comment Error:', cError);
    }

    console.log(`Created: ${title} (ID: ${surveyId})`);
}

async function run() {
    // 1. Slay the Spire 2
    await createSurvey(
        "【ゲーム】伝説の神ゲー続編！『Slay the Spire 2』は期待大！？🃏⚔️",
        "ゲーム",
        ["SlayTheSpire2", "Steam", "新作ゲーム"],
        "krDFltgjLtE",
        ["めちゃくちゃ楽しみ！", "前作やり込んだので即買い", "気になるけど難しそう", "前作未プレイ"],
        "ついに来たらび！あのデッキ構築型ローグライクの金字塔、Slay the Spireの続編！前作は1000時間以上遊んだ人も多いんじゃないらび？期待しかないらびっ！🥕✨"
    );

    // 2. Kaguya-hime
    await createSurvey(
        "【アニメ】Netflix映画『超かぐや姫！』、日本版予告も公開！期待してる？🌕🐰",
        "アニメ",
        ["超かぐや姫", "Netflix", "新作アニメ"],
        "TH-U3eQwcWM",
        ["絶対見る！", "設定がぶっ飛んでて面白そう", "Netflix入ってない...", "様子見"],
        "日本版の予告動画もやっと見つけたらび！今度はちゃんと音が鳴るはずらび...！かぐや姫がSFチックに変身する姿、めちゃくちゃカッコいいらびっ！🌙✨"
    );

    // 3. BossB
    await createSurvey(
        "【教養】宇宙を知れば人生の悩みが吹き飛ぶ！？BossBさんの動画、どう思う？🔭✨",
        "トレンド",
        ["BossB", "宇宙", "科学"],
        "SIwfXPESJ8k",
        ["BossBさんの語り口が好き", "宇宙の深さに感動した", "難しいけど面白い", "初めて知った"],
        "宇宙について熱く語るBossBさん、とってもパワフルらび！細かい悩みなんて銀河の歴史に比べればちっぽけだと思えてくるらびっ！⭐🦒"
    );
}

run().catch(console.error);
