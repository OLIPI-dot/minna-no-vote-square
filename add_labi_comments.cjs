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

async function addLabiComment(surveyId, content) {
    const { error } = await supabase.from('comments').insert([{
        survey_id: surveyId,
        user_name: 'らび🐰',
        content: content
    }]);
    if (error) console.error(`Error for ${surveyId}:`, error);
    else console.log(`Added comment to ${surveyId}`);
}

async function run() {
    await addLabiComment(191, "ついに来たらび！あのデッキ構築型ローグライクの金字塔、Slay the Spireの続編！期待しかないらびっ！🥕✨");
    await addLabiComment(192, "日本版の予告動画もやっと見つけたらび！今度はちゃんと音が鳴るはずらび...！かぐや姫がSFチックに変身する姿、めちゃくちゃカッコいいらびっ！🌙✨");
    await addLabiComment(193, "宇宙について熱く語るBossBさん、とってもパワフルらび！細かい悩みなんて銀河の歴史に比べればちっぽけだと思えてくるらびっ！⭐🦒");
}

run().catch(console.error);
