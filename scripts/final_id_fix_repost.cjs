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

const surveys = [
    {
        title: "【衝撃】田舎暮らしYouTuber「村八分」裁判。自分だったら……？⚖️🧱",
        category: "エンタメ",
        tags: ["YouTuber", "りんの田舎暮らし", "村八分", "裁判"],
        videoId: "8P0PhUCQ1n4", // 最新の裁判進展・敗訴ニュース
        options: ["すぐ逃げる！", "徹底的に戦う", "知人を頼る", "そもそも田舎に住まない"],
        comment: "裁判、衝撃の展開らびっ……。💦 みんなが安心して暮らせる広場（コミュニティ）を、ここから少しずつ考えていきたいらび！🐰🛡️"
    },
    {
        title: "【閲覧注意】生き物系配信者の「ネズミ寿司」動画。規制すべき？🐭🍣",
        category: "エンタメ",
        tags: ["飯島レンジ", "炎上", "規約", "衝撃動画"],
        videoId: "s9dicueCXy4", // 本人解説動画（再生確認済）
        options: ["表現の自由", "厳しく規制すべき", "ゾーニングが必要", "チャンネル通報レベル"],
        comment: "らびっ……！？😱 これが噂の「ちゅートロ」らび……？ みんなはこういう過激な動画、どう思う……？🐰🥕"
    },
    {
        title: "【激震】人気YouTuberの一斉「収益化停止」。これからの配信者はどうなる？💰⚠️",
        category: "エンタメ",
        tags: ["あんずチャンネル", "収益化", "YouTube規約", "AI判定"],
        videoId: "eCKDPx-UGdI", // 本人報告動画（最新）
        options: ["他プラットフォームへ移住", "有料ファンクラブ化", "潔く引退", "修正して再申請を目指す"],
        comment: "大手チャンネルでも収益化が止まっちゃうなんて、配信者の世界は本当に厳しいらび……。💦 みんなの「推し」の活動も心配らび〜っ！🐰✨"
    },
    {
        title: "【30周年】今年の「てりたま」、もう食べた？🍔✨",
        category: "グルメ",
        tags: ["マクドナルド", "てりたま", "春の風物詩", "30周年"],
        videoId: "d4sJHkpgvsc", // マクドナルド公式2026年CM
        options: ["食べたよ！", "これから食べる！", "30周年おめでとう！"],
        comment: "30周年おめでとうらびっ！🍔✨ 春といえばやっぱりコレだよね！らびも瀬戸内レモンのやつが気になってるらび〜っ！🍋🐰"
    }
];

async function finalVideoFixRepost() {
    console.log('🧹 不備のあるアンケートを一掃中...');
    const patterns = ["%村八分%", "%ネズミ寿司%", "%収益化停止%", "%てりたま%"];
    for (const p of patterns) {
        const { data: existing } = await supabase.from('surveys').select('id').ilike('title', p);
        if (existing) {
            for (const s of existing) {
                console.log(`🗑️ ID ${s.id} を削除中...`);
                await supabase.from('comments').delete().eq('survey_id', s.id);
                await supabase.from('options').delete().eq('survey_id', s.id);
                await supabase.from('surveys').delete().eq('id', s.id);
            }
        }
    }

    console.log('🚀 再生確認済みIDで再投稿中...');
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

        console.log(`✅ 完了: ${s.title} (ID: ${surveyId}, Video: ${imageUrl})`);
    }
    console.log('✨ すべて完了しました！');
}

finalVideoFixRepost();
