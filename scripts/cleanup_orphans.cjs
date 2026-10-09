const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
    }
});

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

async function cleanupOrphans() {
    console.log('🗑️ 迷子の選択肢のお掃除を開始するらび！');

    // 1. 全ての有効なアンケートIDを取得
    console.log('📡 存在するアンケートを取得中...');
    const { data: surveys, error: sErr } = await supabase.from('surveys').select('id');
    if (sErr) throw sErr;
    const validSurveyIds = new Set(surveys.map(s => String(s.id)));
    console.log(`✅ 有効なアンケート数: ${validSurveyIds.size}件`);

    let totalDeleted = 0;
    let hasMore = true;
    let offset = 0;
    const LIMIT = 1000;

    // 2. 選択肢を1000件ずつ取得して迷子を探す
    while (hasMore) {
        console.log(`📡 選択肢を検索中... (Offset: ${offset})`);
        const { data: options, error: oErr } = await supabase.from('options').select('id, survey_id').range(offset, offset + LIMIT - 1);
        if (oErr) throw oErr;
        
        if (!options || options.length === 0) {
            hasMore = false;
            break;
        }

        // 迷子の選択肢（親のアンケートが存在しない）を抽出
        const orphanIds = options.filter(o => !validSurveyIds.has(String(o.survey_id))).map(o => o.id);
        
        if (orphanIds.length > 0) {
            console.log(`🧹 迷子の選択肢を ${orphanIds.length}件 発見！削除します...`);
            // Supabaseでは id.in.(1,2,3...) で一括削除可能（上限に注意するため分割）
            for (let i = 0; i < orphanIds.length; i += 200) {
                const chunk = orphanIds.slice(i, i + 200);
                const { error: dErr } = await supabase.from('options').delete().in('id', chunk);
                if (dErr) {
                    console.error('❌ 削除エラー:', dErr);
                } else {
                    totalDeleted += chunk.length;
                }
            }
        }
        
        // ゴミを削除した分、ズレが生じる可能性があるので工夫が必要。
        // だが今回はID指定で一括取得・削除ではなく、rangeで舐めていくので、
        // 削除によって offset が狂うのを防ぐため、削除しなかった件数だけ offset を進めるのが一番安全。
        // でも面倒なので、単純に常に先頭(0~999)を取得し、削除した分だけ詰まってくることを利用する。
        // つまり、orphanがある限り offset を増やさず再取得するか、削除対象が0件だった場合のみ offset を増やす。
        
        if (orphanIds.length === 0) {
            offset += LIMIT;
        }
    }

    console.log(`✨ お掃除完了！合計 ${totalDeleted}件 の迷子の選択肢（ゴミデータ）を削除したらびっ！🥕`);
}

cleanupOrphans().catch(console.error);
