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

async function postTrialSurveys() {
    console.log('--- Posting New Trial Surveys (Game/Ent/Gourmet) ---');
    
    const newSurveys = [
        {
            title: "【ゲーム】最新作『パワフルプロ野球2026-2027』ついに発売！ || 期待の新作、もうチェックした？⚾️✨",
            category: "Game",
            image_url: "yt:wOjrANePk1c",
            options: ["予約した！/即買った！", "面白そうなら買う", "今回は見送り", "野球よりサッカー派"]
        },
        {
            title: "【ゲーム】超美麗オープンワールド『紅の砂漠』ローンチ！ || このグラフィック、次世代すぎる...！？⚔️🔥",
            category: "Game",
            image_url: "yt:VWIw_f8e9Pg",
            options: ["神ゲーの予感！", "PCスペックが心配", "様子見", "アクション苦手"]
        },
        {
            title: "【エンタメ】M!LKの新曲『好きすぎて滅！』が中毒性ヤバい || 10周年イヤー、推しの勢いどう感じる？🎶💖",
            category: "Entertainment",
            image_url: "yt:ZVUxJsPfoX8",
            options: ["最高すぎてリピ確定！", "メンバーのビジュ爆発", "これからチェックする", "前の曲の方が好き"]
        },
        {
            title: "【トレンドグルメ】まさかの大バズり！『こんにゃく串』 || ヘルシーなのに満足感、試してみたい？🍢😋",
            category: "Gourmet",
            image_url: "yt:NzGN6hcD2Ow",
            options: ["今すぐ作りたい！", "おつまみに良さそう", "こんにゃくは苦手", "既に作った！"]
        }
    ];

    for (const survey of newSurveys) {
        const { data, error } = await supabase.from('surveys').insert([survey]).select();
        if (error) {
            console.error(`Error posting "${survey.title}":`, error);
        } else {
            console.log(`Successfully posted: "${survey.title}" (ID: ${data[0].id})`);
            // Add Labi comment
            await supabase.from('comments').insert([{
                survey_id: data[0].id,
                user_id: 'labi-system',
                user_name: 'Labi',
                content: `らびからも一言！🐰 この動画、めっちゃクオリティ高いですよらびっ！✨ ぜひ全画面で見てみてくださいらび！🥕💖`
            }]);
        }
    }
}

postTrialSurveys().catch(console.error);
