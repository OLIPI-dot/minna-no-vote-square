const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env 読み込み
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY);

async function postTestQuiz() {
    console.log('🚀 テストクイズ投稿開始らび！');
    
    // 今から3分15秒後を締切にするらび（少しだけ余裕を持たせる）
    const deadline = new Date(Date.now() + 3.25 * 60 * 1000).toISOString();
    
    const title = '[テスト] らびのなぞなぞクイズ 🧩';
    const description = `ドアも窓もないのに、中に誰かが住んでいる『おうち』なーんだ？\n\nドアも窓もないお家……。一体何のことでしょうか？じっくり考えて投票してみてね！🐰🥕\n\n[[SECRET_ANSWER:正解は「たまご」でした！🥚 ふわっと浮かび上がるアニメーション、見えたかな？]]`;
    
    const { data, error } = await supabase.from('surveys').insert([{
        title,
        description,
        category: 'なぞなぞ',
        deadline,
        visibility: 'public',
        is_official: false,
        tags: ['テスト', 'なぞなぞ']
    }]).select();

    if (error) {
        console.error('❌ 投稿失敗らび...', error);
        return;
    }

    const surveyId = data[0].id;
    const options = ['たまご', 'りんご', 'メロン'];
    
    await supabase.from('options').insert(options.map(name => ({
        name,
        votes: 0,
        survey_id: surveyId
    })));

    console.log(`✅ 投稿成功！らび！！\nURL: https://minna-no-vote-square.vercel.app/s/${surveyId}\n締切時刻: ${new Date(deadline).toLocaleTimeString('ja-JP')}らび！🥕✨`);
}

postTestQuiz();
