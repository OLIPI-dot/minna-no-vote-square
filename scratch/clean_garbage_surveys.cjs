/**
 * 🧹 ゴミ文章が入ったアンケートを検索して修正するスクリプト
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
let supabaseUrl = '', serviceKey = '';
envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (!k) return;
    const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
    if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = val;
});
const supabase = createClient(supabaseUrl, serviceKey);

// ゴミ文章を検知するキーワード
const GARBAGE_PATTERNS = [
    'JavaScriptの設定を有効にしてください',
    'JavaScriptが無効になっています',
    'すべての機能を利用するためには',
    'のXより',
    'さん（@',
    'Cookieを有効',
    'プライバシーポリシーに同意',
    'ログインしてください',
    'JavaScript の設定を変更する方法',
];

async function cleanGarbageSurveys() {
    console.log('🔍 ゴミ文章を含むアンケートを検索中...');

    // 最近500件を取得
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description')
        .order('created_at', { ascending: false })
        .limit(500);

    if (error) {
        console.error('❌ 取得エラー:', error.message);
        return;
    }

    console.log(`📦 ${surveys.length}件を確認中...`);

    const badSurveys = surveys.filter(s => {
        if (!s.description) return false;
        return GARBAGE_PATTERNS.some(p => s.description.includes(p));
    });

    console.log(`\n⚠️ ゴミ文章が入ったアンケート: ${badSurveys.length}件`);

    if (badSurveys.length === 0) {
        console.log('✅ 問題ありませんでした！');
        return;
    }

    // 表示して確認
    badSurveys.slice(0, 10).forEach(s => {
        const snippet = s.description.substring(0, 150).replace(/\n/g, '↵');
        console.log(`  ID: ${s.id} - ${s.title.substring(0, 40)}...`);
        console.log(`    説明: ${snippet}`);
        console.log('');
    });

    console.log('\n🗑️ これらのアンケートを削除します...');

    // まずoptionsを削除してからsurveysを削除（外部キー制約のため）
    for (const s of badSurveys) {
        const { error: optErr } = await supabase
            .from('options')
            .delete()
            .eq('survey_id', s.id);

        if (optErr) {
            console.error(`  ❌ options削除失敗 ID:${s.id} - ${optErr.message}`);
            continue;
        }

        const { error: delErr } = await supabase
            .from('surveys')
            .delete()
            .eq('id', s.id);

        if (delErr) {
            console.error(`  ❌ survey削除失敗 ID:${s.id} - ${delErr.message}`);
        } else {
            console.log(`  ✅ 削除完了: [${s.id}] ${s.title.substring(0, 40)}`);
        }
    }

    console.log(`\n✨ 修正完了！${badSurveys.length}件のゴミアンケートを削除しました！`);
}

cleanGarbageSurveys().catch(console.error);
