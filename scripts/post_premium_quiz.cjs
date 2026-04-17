const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env 読み込み (dotenvがないので自前でやるらび！)
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function postPremiumQuiz() {
  console.log('🚀 プレミアムなぞなぞを投稿するらび！');
  
  // 3分後の締切
  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + 3);
  
  const description = `[[QUIZ_QUESTION: パンはパンでも、食べられないパンは？ ]]

超定番なぞなぞらび！みんなは分かるかな？🐰🥕

[[QUIZ_HINT: 料理に使う道具だよ！🍳 ]]

[[SECRET_ANSWER: 正解は「フライパン」でした！🍳✨ ]]`;

  const { data: survey, error: sError } = await supabase
    .from('surveys')
    .insert([{
      title: '[らびテスト] 定番なぞなぞクイズ プレミアム版 ✨',
      description: description,
      category: 'なぞなぞ',
      deadline: deadline.toISOString(),
      user_id: '9bd03c3f-c89b-46a4-998a-785311b7dfa9', 
      image_url: '/category_thumbs/nazo.png',
      tags: ['なぞなぞ', 'テスト']
    }])
    .select();

  if (sError) {
    console.error('❌ 投稿失敗:', sError);
    return;
  }

  const surveyId = survey[0].id;
  console.log('✅ アンケート作成完了 ID:', surveyId);

  const options = ['フライパン', 'メロンパン', '食パン', 'パンダ'];
  const { error: oError } = await supabase
    .from('options')
    .insert(options.map(name => ({
      name,
      votes: 0,
      survey_id: surveyId
    })));

  if (oError) {
    console.error('❌ 項目追加失敗:', oError);
  } else {
    console.log('✨ すべての準備が整ったらび！広場を確認してみてね！');
  }
}

postPremiumQuiz();
