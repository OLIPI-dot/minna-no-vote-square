const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function postHabuSurvey() {
    console.log('--- Posting Hiroshi Hirasaka Habu Survey ---');
    
    const survey = {
        title: "【自然の脅威】平坂寛さんのハブ咬傷体験！ || 毒蛇に噛まれるとどうなるの...！？🐍🏥",
        category: "その他",
        image_url: "yt:QE5T0s6SGFI",
        visibility: "public",
        tags: ["自然系", "平坂寛", "ハブ", "検証"]
    };

    const options = [
        "平坂さんの探究心、凄すぎる...！",
        "見てるだけで痛そう（マネできない）",
        "自然・毒蛇の勉強になった",
        "平坂さんのチャンネル、最高！"
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
        content: "おりぴさんが教えてくれたハブの動画、らびも見ました...！🐰💉 腫れ方がすごくてドキドキしましたらび。自然界に挑む平坂さん、かっこいいけど心配になっちゃうらびっ！🥕✨"
    }]);

    console.log('--- Post Completed! ---');
}

postHabuSurvey().catch(console.error);
