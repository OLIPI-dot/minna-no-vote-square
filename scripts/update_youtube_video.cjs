const fs = require('fs');
const path = require('path');

// 環境変数の取得
const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
    let envFile = '';
    const localEnv = path.join(__dirname, '../.env.local');
    const rootEnv = path.join(__dirname, '../.env');
    if (fs.existsSync(localEnv)) envFile = fs.readFileSync(localEnv, 'utf8');
    else if (fs.existsSync(rootEnv)) envFile = fs.readFileSync(rootEnv, 'utf8');

    const match = envFile.split('\n').find(line => line.startsWith(`${key}=`));
    if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

async function updateSurveyVideo() {
    console.log('🎬 伝説の動画をアンケートに紐付けるよ！🐰✨');

    if (!url || !key) {
        console.error('Environment variables missing!');
        process.exit(1);
    }

    // アンケートID 213 に対し、image_url に yt:動画ID をセットする
    const surveyId = 213;
    const videoId = 'LWfsZeHr86w';

    const res = await fetch(`${url}/rest/v1/surveys?id=eq.${surveyId}`, {
        method: 'PATCH',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_url: `yt:${videoId}`
        })
    });

    if (!res.ok) {
        console.error(`❌ 更新失敗らび:`, await res.text());
        return;
    }

    console.log(`✅ 更新完了！ アンケートID: ${surveyId} に動画 [${videoId}] をセットしたよ！`);
    console.log('\n🐰🌈 これで動画が表示されるはずらびっ！✨');
}

updateSurveyVideo().catch(console.error);
