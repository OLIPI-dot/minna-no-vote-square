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
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

const surveys = [
    {
        title: "【衝撃】田舎暮らしYouTuber「村八分」裁判。自分だったら……？⚖️🧱",
        category: "ニュース・経済",
        tags: ["YouTuber", "りんの田舎暮らし", "村八分", "裁判"],
        videoId: "7Go1lDnBUVs", // ABEMA Prime (埋め込み確認済)
        options: ["すぐ逃げる！", "徹底的に戦う", "知人を頼る", "そもそも田舎に住まない"],
        comment: "裁判の結果、驚きましたね。💦 地域コミュニティのあり方について、皆さんの率直な意見を聞かせてほしいらび！🐰🛡️"
    },
    {
        title: "【閲覧注意】生き物系配信者の「ネズミ寿司」動画。規制すべき？🐭🍣",
        category: "エンタメ",
        tags: ["飯島レンジ", "炎上", "規約", "衝撃動画"],
        videoId: "s9dicueCXy4", // 本人解説動画 (埋め込み確認済)
        options: ["表現の自由", "厳しく規制すべき", "ゾーニングが必要", "チャンネル通報レベル"],
        comment: "過激なコンテンツの是非は難しい問題らび……。😱 皆さんは動画プラットフォームのルール、どうあるべきだと思いますか？🐰🥕"
    },
    {
        title: "【激震】人気YouTuberの一斉「収益化停止」。これからの配信者はどうなる？💰⚠️",
        category: "IT・テクノロジー",
        tags: ["あんずチャンネル", "収益化", "YouTube規約", "AI判定"],
        videoId: "eCKDPx-UGdI", // 本人報告動画 (埋め込み確認済)
        options: ["他プラットフォームへ移住", "有料ファンクラブ化", "潔く引退", "修正して再申請を目指す"],
        comment: "収益化停止は配信者にとって死活問題らび……。💦 これからの個人クリエイターの生き残り戦略、気になりますね！🐰✨"
    },
    {
        title: "【30周年】今年の「てりたま」、もう食べた？🍔✨",
        category: "グルメ",
        tags: ["マクドナルド", "てりたま", "春の風物詩", "30周年"],
        videoId: "d4sJHkpgvsc", // マクドナルド公式 (埋め込み確認済)
        options: ["食べたよ！", "これから食べる！", "30周年おめでとう！"],
        comment: "マクドナルドの「てりたま」が30周年！🍔✨ 春の楽しみといえばこれですよね。皆さんはもう食べましたか？らび〜っ！🐰🍔"
    }
];

async function cleanupAndRepost() {
    console.log('🧹 既存の不備・重複アンケートを削除中...');
    const patterns = ["%村八分%", "%ネズミ寿司%", "%収益化停止%", "%てりたま%"];
    for (const p of patterns) {
        const { data: existing } = await supabase.from('surveys').select('id, title').ilike('title', p);
        if (existing && existing.length > 0) {
            for (const s of existing) {
                console.log(`🗑️ 削除対象: ${s.title} (ID: ${s.id})`);
                await supabase.from('comments').delete().eq('survey_id', s.id);
                await supabase.from('options').delete().eq('survey_id', s.id);
                await supabase.from('surveys').delete().eq('id', s.id);
            }
        }
    }

    console.log('\n🚀 検証済み動画IDで再投稿を開始します...');
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    for (const s of surveys) {
        const imageUrl = `yt:${s.videoId}`;

        const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
            title: s.title,
            category: s.category,
            tags: s.tags,
            image_url: imageUrl,
            deadline: deadline.toISOString(),
            visibility: 'public'
        }]).select();

        if (surveyError) {
            console.error(`❌ 失敗: ${s.title}`, surveyError);
            continue;
        }

        const surveyId = surveyData[0].id;

        await supabase.from('options').insert(
            s.options.map(name => ({ name, votes: 0, survey_id: surveyId }))
        );

        await supabase.from('comments').insert([{
            survey_id: surveyId,
            user_name: 'らび🐰(AI)',
            content: s.comment,
            edit_key: 'labi_bot'
        }]);

        console.log(`✅ 正常投稿: ${s.title} (ID: ${surveyId}, Video: ${imageUrl})`);
    }
    console.log('\n✨ すべての作業が完了しました！');
}

cleanupAndRepost();
