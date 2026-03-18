const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const files = ['.env.local', '.env'];
    for (const f of files) {
        if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf8');
            const match = content.split('\n').find(line => line.startsWith(`${key}=`));
            if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function repostFix() {
    const targets = [
        { title: '【速報/注目】米テロ対策トップ辞任 戦争不支持 📡📰', vid: 'xuuhAluPaVA', category: 'ニュース・経済', tags: ["速報", "注目", "話題"], options: ['非常に支持する', 'ある程度支持する', 'あまり支持しない', '全く支持しない', 'わからない'] },
        { title: '【速報/注目】イラン 米との緊張緩和案を拒否 📡📰', vid: 'zycWcR-qS7s', category: 'ニュース・経済', tags: ["速報", "注目", "話題"], options: ['非常に懸念する', 'ある程度懸念する', 'あまり気にしない', '全く気にしない', 'わからない'] },
        { title: '【速報/注目】首相訪米 トランプ氏の出方焦点 📡📰', vid: 'ykAeAdxAcPc', category: 'ニュース・経済', tags: ["速報", "注目", "話題"], options: ['非常に期待する', 'ある程度期待する', 'あまり期待しない', '全く期待しない', 'わからない'] }
    ];

    console.log('🚀 正しい動画付きでアンケートを再投稿しますらび！');

    for (const t of targets) {
        const { data, error } = await supabase.from('surveys').insert([{
            title: t.title,
            category: t.category,
            image_url: `yt:${t.vid}`,
            tags: t.tags,
            visibility: 'public',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }]).select();

        if (error) {
            console.error(`❌ 「${t.title}」の投稿失敗:`, error.message);
            continue;
        }

        const surveyId = data[0].id;
        console.log(`✅ 「${t.title}」を投稿完了！ (ID: ${surveyId})`);

        const opts = t.options.map(o => ({ survey_id: surveyId, name: o, votes: 0 }));
        await supabase.from('options').insert(opts);
        
        await supabase.from('comments').insert([{
            survey_id: surveyId,
            user_name: 'らび🐰(AI)',
            content: '本物のニュース動画を見つけてきたよ！みんなの意見を聞かせてねっ！🥕✨',
            edit_key: 'labi_bot'
        }]);
    }
}

repostFix();
