const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function cleanAndPost() {
    console.log('--- Cleaning & Re-posting Hirasaka Surveys ---');
    
    // 1. Trying to delete old ones (IDs 203, 204)
    // Note: Delete might also be restricted, but let's try.
    const { error: delErr } = await supabase.from('surveys').delete().in('id', [203, 204]);
    if (delErr) {
        console.warn('Delete might have failed:', delErr.message);
    } else {
        console.log('Delete command sent (IDs 203, 204).');
    }

    // 2. Re-post with "自然"
    const surveys = [
        {
            survey: {
                title: "【自然グルメ】平坂寛さんの衝撃検証！ || イカの精子、食べたら本当に危険なの...？🦑🧪",
                category: "自然",
                image_url: "yt:HzGvruyBg7Q",
                visibility: "public",
                tags: ["自然系", "平坂寛", "衝撃検証"]
            },
            options: ["平坂さんなら安心（？）して見れる", "そんなの絶対マネしたくない！ｗ", "自然の神秘と食欲の両立がすごい", "平坂さんの動画よく見てます！"]
        },
        {
            survey: {
                title: "【自然の脅威】平坂寛さんのハブ咬傷体験！ || 毒蛇に噛まれるとどうなるの...！？🐍🏥",
                category: "自然",
                image_url: "yt:QE5T0s6SGFI",
                visibility: "public",
                tags: ["自然系", "平坂寛", "ハブ", "検証"]
            },
            options: ["平坂さんの探究心、凄すぎる...！", "見てるだけで痛そう（マネできない）", "自然の勉強になった", "平坂さんの動画よく見てます！"]
        }
    ];

    for (const item of surveys) {
        const { data, error } = await supabase.from('surveys').insert([item.survey]).select();
        if (error) {
            console.error(`Post Error for "${item.survey.title}":`, error.message);
            continue;
        }
        const sid = data[0].id;
        console.log(`New Survey Created: ID ${sid} ("${item.survey.category}")`);

        const rows = item.options.map(o => ({ survey_id: sid, name: o, votes: 0 }));
        await supabase.from('options').insert(rows);
        
        await supabase.from('comments').insert([{
            survey_id: sid,
            user_id: 'labi-system',
            user_name: 'Labi',
            content: "新カテゴリ『自然』🌿 に変更して再掲しましたらびっ！これでアイコンもバッチリ！平坂さんワールドを楽しんでね！🥕✨"
        }]);
    }
}

cleanAndPost().catch(console.error);
