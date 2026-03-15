const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function postHirasakaSurvey() {
    console.log('--- Posting Hiroshi Hirasaka Survey ---');
    
    const survey = {
        title: "【自然グルメ】平坂寛さんの衝撃検証！ || イカの精子、食べたら本当に危険なの...？🦑🧪",
        category: "グルメ",
        image_url: "yt:HzGvruyBg7Q",
        visibility: "public",
        tags: ["自然系", "平坂寛", "衝撃検証"]
    };

    const options = [
        "平坂さんなら安心（？）して見れる",
        "そんなの絶対マネしたくない！ｗ",
        "自然の神秘と食欲の両立がすごい",
        "平坂さんの動画よく見てます！"
    ];

    // 1. Insert Survey
    const { data: surveyRes, error: surveyErr } = await supabase.from('surveys').insert([survey]).select();
    
    if (surveyErr) {
        console.error('Survey Insert Error:', surveyErr.message);
        return;
    }

    const surveyId = surveyRes[0].id;
    console.log(`- Survey Created (ID: ${surveyId})`);

    // 2. Insert Options
    const optionRows = options.map(name => ({
        survey_id: surveyId,
        name: name,
        votes: 0
    }));

    const { error: optionErr } = await supabase.from('options').insert(optionRows);
    if (optionErr) {
        console.error(`- Option Insert Error:`, optionErr.message);
    } else {
        console.log(`- ${options.length} Options Added.`);
    }

    // 3. Add Labi Comment
    await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_id: 'labi-system',
        user_name: 'Labi',
        content: "おりぴさんおすすめの平坂寛さん！🐰✨ 動画で見るとさらに迫力満点ですねらびっ！自然の力ってすご〜い！🥕🌊"
    }]);

    console.log('--- Post Completed! ---');
}

postHirasakaSurvey().catch(console.error);
