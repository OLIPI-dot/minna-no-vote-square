const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    let envFile = '';
    if (fs.existsSync('.env.local')) envFile = fs.readFileSync('.env.local', 'utf8');
    else if (fs.existsSync('.env')) envFile = fs.readFileSync('.env', 'utf8');
    const match = envFile.split('\n').find(line => line.startsWith(`${key}=`));
    if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function fixLatestThree() {
    const targets = [
        { id: 284, vid: 'xuuhAluPaVA' }, // 米テロ対策トップ辞任
        { id: 283, vid: 'zycWcR-qS7s' }, // イラン 米との緊張緩和案を拒否
        { id: 282, vid: '2EKQ1XkY0qY' }  // 首相訪米
    ];

    for (const target of targets) {
        console.log(`🔧 ID: ${target.id} の動画を修復中...`);
        const { error } = await supabase
            .from('surveys')
            .update({ image_url: `yt:${target.vid}` })
            .eq('id', target.id);
        
        if (error) console.error(`❌ ID: ${target.id} の修復失敗:`, error.message);
        else console.log(`✅ ID: ${target.id} の修復完了らび！`);
    }
}

fixLatestThree();
