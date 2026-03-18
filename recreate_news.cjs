const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
  const envPaths = ['.env.local', '.env'];
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        if (line.trim().startsWith(key + '=')) {
          return line.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
      }
    }
  }
  return process.env[key];
};

async function recreateNews() {
  const url = getEnv('VITE_SUPABASE_URL');
  const key = getEnv('VITE_SUPABASE_ANON_KEY');
  const supabase = createClient(url, key);

  const targets = [
    { title: '収集車', videoId: 'sn2DE-WZ_9U', fullTitle: '【速報/注目】収集車のホッパーに挟まれる 死亡 📡📰' },
    { title: '日鉄', videoId: 'cJB6yCvsT3A', fullTitle: '【速報/注目】USS買収 日鉄に計9000億円融資へ 📡📰' },
    { title: '公示地価', videoId: 'ZmHKShWO3b4', fullTitle: '【速報/注目】公示地価 バブル後で最高の上昇率 📡📰' },
    { title: '原油調達', videoId: '2EKQ1XkY0qY', fullTitle: '【速報】政府 日米首脳会談でアラスカ産原油調達の意向伝える方針 📡📰' }
  ];

  console.log('🚮 旧アンケートの削除を試みます...');
  for (const t of targets) {
    const { error } = await supabase.from('surveys').delete().ilike('title', `%${t.title}%`);
    if (error) console.error(`❌ ${t.title} の削除失敗:`, error.message);
    else console.log(`✅ ${t.title} を削除（または対象なし）`);
  }

  console.log('🚀 正しい動画IDで再投稿します...');
  for (const t of targets) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    const { data: sv, error: svErr } = await supabase.from('surveys').insert([{
      title: t.fullTitle,
      category: "ニュース・経済",
      tags: ["速報", "注目", "話題"],
      image_url: `yt:${t.videoId}`,
      deadline: deadline.toISOString(),
      visibility: 'public'
    }]).select();

    if (svErr) {
      console.error(`❌ ${t.title} の投稿失敗:`, svErr.message);
      continue;
    }

    const surveyId = sv[0].id;
    console.log(`✅ ${t.title} を再投稿しました (ID: ${surveyId})`);

    // オプション追加
    await supabase.from('options').insert([
      { name: "非常に関心がある", votes: 0, survey_id: surveyId },
      { name: "少し気になる", votes: 0, survey_id: surveyId },
      { name: "今のところ静観", votes: 0, survey_id: surveyId },
      { name: "詳しく調べたい", votes: 0, survey_id: surveyId }
    ]);

    // らびのコメント
    await supabase.from('comments').insert([{
      survey_id: surveyId,
      user_name: 'らび🐰(AI)',
      content: `最新のニュース（ ${t.title} ）について、動画と一緒にみんなで考えようらび！🥕✨ 動画を見て気になったことがあれば教えてね。らびと一緒に話そうらび！🐰🛡️🥇🏆`,
      edit_key: 'labi_bot'
    }]);
  }
}

recreateNews();
