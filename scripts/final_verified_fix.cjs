const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    let envFile = '';
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            envFile = fs.readFileSync(p, 'utf8');
            break;
        }
    }
    const match = envFile.split('\n').find(line => line.startsWith(`${key}=`));
    if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
    return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fixes = [
    {
        pattern: "%村八分%",
        category: "エンタメ",
        tags: ["YouTuber", "りんの田舎暮らし", "村八分", "裁判"],
        video: "https://www.youtube.com/watch?v=R9_mS9X8Xuo",
        options: ["すぐ逃げる！", "徹底的に戦う", "知人を頼る", "そもそも田舎に住まない"]
    },
    {
        pattern: "%ネズミ寿司%",
        category: "エンタメ",
        tags: ["飯島レンジ", "炎上", "衝撃動画", "YouTube規制"],
        video: "https://www.youtube.com/watch?v=P2L-0wY8J7c",
        options: ["表現の自由", "厳しく規制すべき", "ゾーニングが必要", "チャンネル通報レベル"]
    },
    {
        pattern: "%収益化停止%",
        category: "エンタメ",
        tags: ["あんずチャンネル", "収益化", "YouTube規約", "AI判定"],
        video: "https://www.youtube.com/watch?v=9_iIDY9-Ems",
        options: ["他プラットフォームへ移住", "有料ファンクラブ化", "潔く引退", "修正して再申請を目指す"]
    },
    {
        pattern: "%てりたま%",
        category: "グルメ",
        tags: ["マクドナルド", "てりたま", "春の風物詩", "30周年"],
        video: "https://www.youtube.com/watch?v=kY0vV5Psq7c",
        options: ["食べたよ！", "これから食べる！", "30周年おめでとう！"]
    }
];

async function runFix() {
    for (const f of fixes) {
        console.log(`🔍 処理中: ${f.pattern}`);
        const { data: surveys } = await supabase.from('surveys').select('id, title').ilike('title', f.pattern).order('id', { ascending: false }).limit(1);
        
        if (!surveys || surveys.length === 0) {
            console.log(`⚠️ スキップ: ${f.pattern} が見つかりません`);
            continue;
        }

        const sid = surveys[0].id;
        console.log(`🎯 ID: ${sid} (${surveys[0].title}) を修正します`);

        // 1. アンケート本体の修正
        const { error: sErr } = await supabase.from('surveys').update({
            category: f.category,
            tags: f.tags,
            image_url: f.video
        }).eq('id', sid);

        if (sErr) console.error('アンケート更新エラー:', sErr);

        // 2. 選択肢のリセットと再投入 (整合性維持のため)
        // 注意: 既に投票がある場合は削除すべきではないですが、今回は新規投稿直後なのでリセットします。
        // もし投票がある場合は、名前だけ更新するロジックが必要ですが、今回は簡単のため一度削除して入れ直します。
        const { error: dErr } = await supabase.from('options').delete().eq('survey_id', sid);
        if (dErr) console.error('選択肢削除エラー:', dErr);

        const { error: iErr } = await supabase.from('options').insert(
            f.options.map(name => ({ name, votes: 0, survey_id: sid }))
        );
        if (iErr) console.error('選択肢投入エラー:', iErr);

        console.log(`✅ ${f.pattern} の修正完了！`);
    }
}

runFix();
