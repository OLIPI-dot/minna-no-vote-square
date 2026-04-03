const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env から環境変数を手動で読み込む
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            const v = value.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v;
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' || key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = v;
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 🧹 お掃除用関数（進化したらび！）
function cleanGarbage(str) {
    if (!str) return '';
    // 💡 文末だけでなく、[続きを読む] の直前にあるゴミも掃除するらび！
    return str
        .replace(/\s*[\[【\(]\s*[\.．… ]*\s*[\]】\)]\s*(\n*\[続きを読む\])/g, '$1')
        .replace(/\s*[\[【\(]\s*[\.．… ]*\s*[\]】\)]\s*$/g, '') 
        .trim();
}

async function runCleanup() {
    console.log('🧹 広場の「[]」を一掃する大掃除を開始するらびっ！✨');

    const { data: surveys, error: fetchError } = await supabase
        .from('surveys')
        .select('id, description')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (fetchError) {
        console.error('❌ データ取得失敗らび…', fetchError);
        return;
    }

    console.log(`✅ ${surveys.length} 件のアンケートをチェックするよ！`);

    let updateCount = 0;
    for (const survey of surveys) {
        if (!survey.description) continue;

        const cleaned = cleanGarbage(survey.description);
        if (cleaned !== survey.description) {
            const { error: updateError } = await supabase
                .from('surveys')
                .update({ description: cleaned })
                .eq('id', survey.id);
            
            if (updateError) {
                console.error(`❌ ID ${survey.id} の更新に失敗らび…`, updateError);
            } else {
                updateCount++;
                if (updateCount % 10 === 0) console.log(`🧹 ${updateCount} 件お掃除完了...`);
            }
        }
    }

    console.log(`✨ 大掃除完了らびっ！ 合計 ${updateCount} 件のゴミを消し去ったよ！ 🐰🧹✨🥕🌈🚀🐾💖`);
}

runCleanup().catch(console.error);
