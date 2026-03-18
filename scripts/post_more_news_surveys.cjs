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

async function postNewsSurveys() {
    const surveys = [
        {
            title: "【エネルギー危機】石油備蓄「45日分」放出開始。日本の底力が試される今、私たちができる対策は？🛢️🛡️",
            category: "ニュース・経済",
            tags: ["石油備蓄", "ガソリン高騰", "エネルギー安全保障", "経済"],
            image_url: "yt:zk_Y044gzbA",
            options: ["節電・節約で協力する💡", "公共交通機関を優先する定期代🚇", "EVや再エネへの転換を加速させる🔋", "政府のさらなる追加策を期待する🌿"],
            comment: "ホルムズ海峡が封鎖されて、ついに日本の『宝箱』である石油備蓄が放たれたらび……！🛢️✨ 45日分って聞くと長いようで短い気もするけど、みんなで乗り越えていきたいらびね。🐰🛡️"
        },
        {
            title: "【国産AI始動】政府専用AI「源内（GENNAI）」が全府省庁へ。日本のDXはこれで加速すると思う？🤖💻",
            category: "IT・テクノロジー",
            tags: ["ガソメントAI", "源内", "国産LLM", "デジタル庁"],
            image_url: "yt:GuyVP9_Fxdk",
            options: ["業務が効率化され、行政が速くなる！🚀", "セキュリティやプライバシーが安心！🔒", "国産技術の発展に期待したい！🇯🇵", "まだ様子を見たい（実用性が不安）⚖️"],
            comment: "ついに日本オリジナルのAI『源内』くんが動き出したらび！🤖✨ 江戸時代の発明家みたいな名前でかっこいいらびね。私たちの手続きとかも、これでサクサク進むようになると嬉しいらび！🐰📱"
        },
        {
            title: "【日本初上陸】スタバ「シュークリーム フラペチーノ」が話題！あなたはもうチェックした？☕️🍮",
            category: "トレンド",
            tags: ["スターバックス", "新作", "シュークリームフラペチーノ", "春スイーツ"],
            image_url: "yt:CA4FElw3KV8",
            options: ["絶対に飲みに行く！🏃‍♀️💨", "甘そうで気になるけど迷う……🍮", "いつもの定番が一番！☕️", "スタバより家でゆっくり派🏠"],
            comment: "韓国で大人気だったメニューがいよいよ日本にも来たらび！☕️🍮 シュークリームを飲んでるみたいな感覚なのかな？想像しただけでお腹が空いてきちゃうらび……🐰🥗"
        }
    ];

    for (const s of surveys) {
        console.log(`🚀 「${s.title}」を投稿中...`);
        
        // 重複削除
        const { data: existing } = await supabase.from('surveys').select('id').eq('title', s.title);
        if (existing && existing.length > 0) {
            for (const ex of existing) {
                await supabase.from('comments').delete().eq('survey_id', ex.id);
                await supabase.from('options').delete().eq('survey_id', ex.id);
                await supabase.from('surveys').delete().eq('id', ex.id);
            }
        }

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 14);

        const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
            title: s.title,
            category: s.category,
            tags: s.tags,
            image_url: s.image_url,
            deadline: deadline.toISOString(),
            visibility: 'public'
        }]).select();

        if (surveyError) {
            console.error(`❌ 「${s.title}」の投稿失敗:`, surveyError);
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
        
        console.log(`✅ ID: ${surveyId} で完了らび！`);
    }
}

postNewsSurveys();
