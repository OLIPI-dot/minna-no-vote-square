const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
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
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function fixNewsVideos() {
    console.log('🔧 ニュース動画のピンポイント復旧を開始しますらびっ！');

    // 🎯 ターゲット：特定のニュースお題に対して、ブラウザで再生確認済みの最新公式ニュース動画を割り当てる
    const targets = [
      { title: '収集車', videoId: 'sn2DE-WZ_9U' }, 
      { title: '日鉄', videoId: 'cJB6yCvsT3A' }, // 「日本製鉄」ではなく「日鉄」にするらび！
      { title: '公示地価', videoId: 'ZmHKShWO3b4' }, 
      { title: '原油調達', videoId: '2EKQ1XkY0qY' }
    ];

    let fixedCount = 0;

    for (const target of targets) {
      console.log(`🔍 Checking surveys matching: "${target.title}"`);
      const { data: targetSurveys } = await supabase
        .from('surveys')
        .select('id, title, image_url')
        .ilike('title', `%${target.title}%`);

      if (targetSurveys && targetSurveys.length > 0) {
        for (const sv of targetSurveys) {
          console.log(`  Updating ID ${sv.id}: "${sv.title}" -> yt:${target.videoId}`);
          const { error: updateError } = await supabase
            .from('surveys')
            .update({ image_url: `yt:${target.videoId}` })
            .eq('id', sv.id);

          if (updateError) {
            console.error(`  ❌ Failed to update:`, updateError.message);
          } else {
            console.log(`  ✅ Successfully updated.`);
            fixedCount++;
          }
        }
      } else {
        console.log(`  ⚠️ No surveys found matching "${target.title}"`);
      }
    }

    if (fixedCount === 0) {
        console.log('✅ すべてのニュース動画は既に最新の状態でしたらびっ！');
    } else {
        console.log(`✨ 合計 ${fixedCount} 件のニュース動画を修復しました！`);
    }
}

fixNewsVideos();
