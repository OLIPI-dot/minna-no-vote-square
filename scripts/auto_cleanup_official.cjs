const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. 環境変数の読み込み (GitHub Actions または Local)
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 環境変数が設定されていません。(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function autoCleanupOfficial() {
    console.log('🧹 公式ニュースのお掃除スクリプトを開始しますらび！');

    // 60日前の日付を計算
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`📅 基準日: ${sixtyDaysAgo} 以前の公式ニュースを検索します。`);

    // 1. 削除対象の公式ニュースを取得
    // 🛡️ ユーザーの投稿を絶対に消さないために eq('is_official', true) を必須にする！
    const { data: oldSurveys, error: fetchErr } = await supabase
        .from('surveys')
        .select('id, title, created_at')
        .eq('is_official', true)
        .lt('created_at', sixtyDaysAgo);

    if (fetchErr) {
        console.error('❌ 削除対象の検索中にエラーが発生しました:', fetchErr);
        process.exit(1);
    }

    if (!oldSurveys || oldSurveys.length === 0) {
        console.log('✨ 60日以上経過した古い公式ニュースはありませんでした。お掃除終了らび！');
        return;
    }

    console.log(`🗑️ 削除対象の公式ニュースを ${oldSurveys.length} 件発見しました！`);
    const targetIds = oldSurveys.map(s => s.id);

    // バッチ削除のための関数
    const batchDelete = async (table, column, ids) => {
        let totalDeleted = 0;
        for (let i = 0; i < ids.length; i += 200) {
            const chunk = ids.slice(i, i + 200);
            const { error: dErr } = await supabase.from(table).delete().in(column, chunk);
            if (dErr) {
                console.error(`❌ ${table} の削除エラー:`, dErr);
            } else {
                totalDeleted += chunk.length;
            }
        }
        return totalDeleted;
    };

    // 2. 関連する「選択肢(options)」を削除（ゴミデータ迷子防止）
    console.log('🧹 関連する選択肢を削除中...');
    await batchDelete('options', 'survey_id', targetIds);

    // 3. 関連する「コメント(comments)」を削除
    console.log('🧹 関連するコメントを削除中...');
    await batchDelete('comments', 'survey_id', targetIds);

    // 4. アンケート本体(surveys)を削除
    console.log('🧹 アンケート本体を削除中...');
    const deletedSurveysCount = await batchDelete('surveys', 'id', targetIds);

    console.log(`✅ お掃除完了！ ${deletedSurveysCount} 件の古い公式ニュースを完全に消去しましたらびっ！🥕`);
}

autoCleanupOfficial().catch(err => {
    console.error('❌ 予期せぬエラーが発生しました:', err);
    process.exit(1);
});
