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
        title: "【新スタイル】リアルとVの融合「XTuber」はこれからの標準になる？✨",
        category: "IT・テクノロジー",
        tags: ["XTuber", "VTuber", "PANDORA", "インフルエンサー"],
        videoId: "xnNBqiIgE3c",
        options: ["新しくて面白い！", "夢が広がる", "中の人が見えるのはちょっと…", "今後の展開を見守りたい"],
        comment: "バーチャルとリアルが混ざり合う新しい拠点が新宿に……！ワクワクするらび！🐰✨ こらからのインフルエンサー活動、どう変わっていくか楽しみだね！"
    },
    {
        title: "【ニュース・経済】116万人の収益化停止。プラットフォームエコノミーの脆さをどう見る？📈",
        category: "ニュース・経済",
        tags: ["あんずチャンネル", "収益化", "YouTube規約", "AI判定"],
        videoId: "eCKDPx-UGdI",
        options: ["判定が不透明で厳しすぎる", "AI判定の限界を感じる", "規約遵守は絶対だと思う", "配信者への救済措置が必要"],
        comment: "収益化停止は配信者にとって死活問題らび……。💦 「当たり前」だと思っていた収益が突然なくなる……ビジネスの難しさを感じるニュースらびね。🐰🛡️"
    },
    {
        title: "【全力応援！】バスケ女子W杯予選。日本代表の強みはどこだと思う？🏀🔥",
        category: "スポーツ",
        tags: ["バスケットボール", "日本代表", "W杯予選", "FIBA"],
        videoId: "yvVAVuOFjFw",
        options: ["圧倒的なスピード", "精確な3ポイント", "鉄壁의ディフェンス", "チームの一体感"],
        comment: "日本代表の戦いぶりにワクワクするらび！🏀🔥 みんなの応援で、最高のプレーを引き出すらび〜っ！📣🐰"
    },
    {
        title: "【お花見2026】上野公園で桜まつり！春のお出かけ、今年の一番の楽しみは？🏠🌸",
        category: "生活",
        tags: ["上野公園", "桜まつり", "お花見", "春"],
        videoId: "P-iSMfC5OWw",
        options: ["満開の桜の下で宴会！", "静かに散策・写真撮影", "夜桜ライトアップを鑑賞", "花より団子（グルメ優先！）"],
        comment: "ついに桜の季節らびっ！🌸✨ 春の風を感じながら、みんなで楽しくお花見したいらびね〜！🍡🐰"
    },
    {
        title: "【トレンド】ABEMA 10周年「30時間フェス」。ネット配信の限界に期待する？🔥",
        category: "トレンド",
        tags: ["ABEMA", "30時間フェス", "10周年", "生放送"],
        videoId: "h8HcVHTVE7k",
        options: ["全部見る（完走）！", "お気に入り企画だけ見る", "後でダイジェストを見る", "体力がもたない…"],
        comment: "30時間連続生放送って……らびも人参を100本くらい用意して見守らないと！😱 ネット配信ならではの限界突破、楽しみらび！🐰✨"
    }
];

async function postTrends() {
    console.log('🧹 既存の重複チェック（タイトル一致）...');
    for (const s of surveys) {
        const { data: existing } = await supabase.from('surveys').select('id, title').eq('title', s.title);
        if (existing && existing.length > 0) {
            for (const ex of existing) {
                console.log(`🗑️ 重複削除: ${ex.title} (ID: ${ex.id})`);
                await supabase.from('comments').delete().eq('survey_id', ex.id);
                await supabase.from('options').delete().eq('survey_id', ex.id);
                await supabase.from('surveys').delete().eq('id', ex.id);
            }
        }
    }

    console.log('\n🚀 本日のトレンドアンケートを投稿します...');
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

        console.log(`✅ 投稿完了: ${s.title} (ID: ${surveyId})`);
    }
    console.log('\n✨ すべての投稿が完了しました！');
}

postTrends();
