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
        category: "エンタメ", // エンタメに変更
        tags: ["YouTuber", "りんの田舎暮らし", "村八分", "裁判"],
        video: "https://www.youtube.com/watch?v=R9_mS9X8Xuo",
        options: ["すぐ逃げる！", "徹底的に戦う", "知人を頼る", "そもそも田舎に住まない"],
        comment: "りんさん、裁判勝訴おめでとうらびっ！✨ でも、こんなことが現実にあるなんて本当に胸が痛むよね……。みんなが安心して暮らせる広場（コミュニティ）を作っていきたいらび！🐰🛡️"
    },
    {
        title: "【閲覧注意】生き物系配信者の「ネズミ寿司」動画。規制すべき？🐭🍣",
        category: "エンタメ",
        tags: ["飯島レンジ", "炎上", "規約", "衝撃動画"],
        video: "https://www.youtube.com/watch?v=P2L-0wY8J7c",
        options: ["表現の自由", "厳しく規制すべき", "ゾーニングが必要", "チャンネル通報レベル"],
        comment: "らびっ……！？😱 タイムラインに流れてきて、らびもブルブル震えちゃったよぉ……。みんなはこういう過激な動画、どう思う……？🐰🥕"
    },
    {
        title: "【激震】人気YouTuberの一斉「収益化停止」。これからの配信者はどうなる？💰⚠️",
        category: "エンタメ", // エンタメに変更
        tags: ["あんずチャンネル", "収益化", "YouTube規約", "AI判定"],
        video: "https://www.youtube.com/watch?v=9_iIDY9-Ems",
        options: ["他プラットフォームへ移住", "有料ファンクラブ化", "潔く引退", "修正して再申請を目指す"],
        comment: "100万人以上いても収益化が止まっちゃうなんて、配信者の世界は本当に厳しいらび……。💦 でも、ファンのみんなとの絆があれば、きっと新しい道が見つかるはずらびっ！🐰✨"
    },
    {
        title: "【30周年】今年の「てりたま」、もう食べた？🍔✨",
        category: "グルメ",
        tags: ["マクドナルド", "てりたま", "春の風物詩", "30周年"],
        video: "https://www.youtube.com/watch?v=kY0vV5Psq7c",
        options: ["食べたよ！", "これから食べる！", "30周年おめでとう！"],
        comment: "30周年おめでとうらびっ！🍔✨ 春といえばやっぱりコレだよね！らびも瀬戸内レモンのやつが気になってるらび〜っ！🍋🐰"
    }
];

async function postSurveys() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    for (const s of surveys) {
        console.log(`🚀 投稿中: ${s.title}`);
        
        // 1. アンケート挿入 (image_url に動画URLを入れる)
        const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
            title: s.title,
            category: s.category,
            tags: s.tags,
            image_url: s.video,
            deadline: deadline.toISOString(),
            visibility: 'public'
        }]).select();

        if (surveyError) {
            console.error(`❌ アンケート失敗 (${s.title}):`, surveyError);
            continue;
        }

        const surveyId = surveyData[0].id;

        // 2. 選択肢挿入
        const { error: optionError } = await supabase.from('options').insert(
            s.options.map(name => ({ name, votes: 0, survey_id: surveyId }))
        );

        if (optionError) console.error(`❌ 選択肢失敗 (${s.title}):`, optionError);

        // 3. らびのコメント挿入
        const { error: commentError } = await supabase.from('comments').insert([{
            survey_id: surveyId,
            user_name: 'らび🐰(AI)',
            content: s.comment,
            edit_key: 'labi_bot'
        }]);

        if (commentError) console.error(`❌ コメント失敗 (${s.title}):`, commentError);

        console.log(`✅ 再投稿完了: ${s.title} (ID: ${surveyId})`);
    }
}

postSurveys();
