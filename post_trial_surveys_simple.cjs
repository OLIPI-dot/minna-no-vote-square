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
    console.log('--- Posting New Trial Surveys ---');
    
    const newSurveys = [
        {
            title: "【最新】パワプロ2026-2027 発売！ || みんなの期待度はどれくらい？⚾️",
            category: "Game",
            image_url: "yt:wOjrANePk1c",
            options: ["予約した！", "面白そうなら買う", "様子見", "野球よりサッカー"]
        },
        {
            title: "【次世代RPG】紅の砂漠 ついに登場！ || この映像美、凄すぎない？⚔️",
            category: "Game",
            image_url: "yt:VWIw_f8e9Pg",
            options: ["神ゲー確定！", "PCスペック不足", "様子見", "アクション苦手"]
        },
        {
            title: "【エンタメ】M!LK 好きすぎて滅！ MV || 10周年イヤーは伊達じゃない！🎶",
            category: "Entertainment",
            image_url: "yt:ZVUxJsPfoX8",
            options: ["中毒性ヤバい！", "ビジュ最高", "あとで見る", "前の曲派"]
        },
        {
            title: "【グルメ】ブーム到来！？ こんにゃく串 || ヘルシーでお手軽なバズり飯🍢",
            category: "Gourmet",
            image_url: "yt:NzGN6hcD2Ow",
            options: ["即作りたい！", "おつまみに最高", "こんにゃく苦手", "既に作った！"]
        }
    ];

    for (const survey of newSurveys) {
        console.log(`Attempting: ${survey.title}`);
        const { data, error } = await supabase.from('surveys').insert([survey]).select();
        if (error) {
            console.error('Post Error:', error);
        } else if (data && data.length > 0) {
            console.log(`Success! ID: ${data[0].id}`);
            await supabase.from('comments').insert([{
                survey_id: data[0].id,
                user_id: 'labi-system',
                user_name: 'Labi',
                content: "らびからも一言！🐰 この動画、最高にワクワクしますよらびっ！✨"
            }]);
        } else {
            console.log('No data returned.');
        }
    }
}

postTrialSurveys().catch(console.error);
