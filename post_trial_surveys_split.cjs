const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function postTrialSurveys() {
    console.log('--- Final Flow: Posting Trial Surveys ---');
    
    const surveyData = [
        {
            survey: {
                title: "【最速】パワプロ2026-2027 発売！ || 最新作のオープニング、もう見た？⚾️✨",
                category: "Game",
                image_url: "yt:wOjrANePk1c",
                visibility: "public"
            },
            options: ["予約した！/もう遊んでる", "面白そうなら買う", "様子見中", "他ゲーで忙しい"]
        },
        {
            survey: {
                title: "【2026年覇権か？】紅の砂漠 ついに始動 || このグラフィックは次世代すぎる！⚔️🔥",
                category: "Game",
                image_url: "yt:VWIw_f8e9Pg",
                visibility: "public"
            },
            options: ["神ゲーの予感！", "PCスペック上げて待つ", "様子見", "アクション苦手"]
        },
        {
            survey: {
                title: "【トレンド】M!LK「好きすぎて滅！」MV || 10周年アニバーサリーの勢いが凄い！🎶💖",
                category: "Entertainment",
                image_url: "yt:ZVUxJsPfoX8",
                visibility: "public"
            },
            options: ["中毒性ヤバい！", "ビジュ最高！", "あとで見る", "前の曲の方が好き"]
        },
        {
            survey: {
                title: "【バズり飯】ヘルシー＆激ウマ！「こんにゃく串」 || 今夜のおかずに試してみたい？🍢😋",
                category: "Gourmet",
                image_url: "yt:NzGN6hcD2Ow",
                visibility: "public"
            },
            options: ["即作りたい！", "おつまみに良さそう", "こんにゃく苦手", "既に作った！"]
        }
    ];

    for (const item of surveyData) {
        console.log(`Posting Survey: ${item.survey.title}`);
        
        // 1. Insert Survey
        const { data: surveyRes, error: surveyErr } = await supabase.from('surveys').insert([item.survey]).select();
        
        if (surveyErr) {
            console.error('Survey Insert Error:', surveyErr.message);
            continue;
        }

        const surveyId = surveyRes[0].id;
        console.log(`- Survey Created (ID: ${surveyId})`);

        // 2. Insert Options
        const optionRows = item.options.map(name => ({
            survey_id: surveyId,
            name: name,
            votes: 0
        }));

        const { error: optionErr } = await supabase.from('options').insert(optionRows);
        if (optionErr) {
            console.error(`- Option Insert Error for ID ${surveyId}:`, optionErr.message);
        } else {
            console.log(`- ${item.options.length} Options Added.`);
        }

        // 3. Add Labi Comment
        const { error: commentErr } = await supabase.from('comments').insert([{
            survey_id: surveyId,
            user_id: 'labi-system',
            user_name: 'Labi',
            content: "らびからも一言！🐰 この動画、最新でめちゃくちゃトレンドですよらびっ！✨ ぜひチェックして投票してね！🥕💖"
        }]);

        if (commentErr) console.error(`- Comment Insert Error:`, commentErr.message);
        else console.log(`- Labi Comment Added.`);
    }
    
    console.log('--- All Posts Completed! ---');
}

postTrialSurveys().catch(console.error);
