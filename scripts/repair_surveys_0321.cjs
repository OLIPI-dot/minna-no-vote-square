const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env 読み込み
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function generateTags(title, content) {
    const titleLower = title.toLowerCase();
    const contentLower = (content || '').toLowerCase();
    const tagScores = {};
    const addTag = (tag, score = 1) => {
        tagScores[tag] = (tagScores[tag] || 0) + score;
    };
    const genres = [
        { name: 'ゲーム', keywords: ['ゲーム', '新作', '発売', 'プレイ', '攻略', 'switch', 'ps5', 'xbox', 'steam', 'スマホゲー'] },
        { name: 'IT・技術', keywords: ['ai', 'スマホ', 'アプリ', 'ガジェット', 'web', '開発', 'openai', 'google', 'apple', 'microsoft'] },
        { name: 'エンタメ', keywords: ['映画', 'ドラマ', 'アニメ', '芸能', '俳優', 'アイドル', 'youtuber', 'vtuber', 'ライブ', 'イベント'] },
        { name: '経済', keywords: ['株価', 'ビジネス', '投資', '円安', '賃上げ', '決算', '銀行'] },
        { name: 'ライフスタイル', keywords: ['グルメ', '料理', '健康', '掃除', '節約', '旅行', 'ファッション'] },
        { name: 'スポーツ', keywords: ['プロ野球', '大谷', 'サッカー', 'ゴルフ', 'テニス', '五輪', 'マラソン'] }
    ];
    genres.forEach(g => {
        g.keywords.forEach(kw => {
            if (titleLower.includes(kw)) addTag(g.name, 4);
            else if (contentLower.includes(kw)) addTag(g.name, 2);
        });
    });
    const subTags = [
        { name: 'Switch', keywords: ['switch', 'スイッチ'] },
        { name: 'PS5', keywords: ['ps5', 'playstation', 'プレステ'] },
        { name: 'Steam', keywords: ['steam'] },
        { name: 'Apple', keywords: ['apple', 'iphone', 'ipad', 'mac'] },
        { name: 'Google', keywords: ['google', 'android', 'pixel'] },
        { name: '任天堂', keywords: ['nintendo', '任天堂', 'ポケモン', 'マリオ', 'ピクミン'] },
        { name: 'ソニー', keywords: ['sony', 'ソニー'] },
        { name: 'Microsoft', keywords: ['microsoft', 'windows', 'xbox'] },
        { name: 'YouTuber', keywords: ['youtuber', 'ユーチューバー'] },
        { name: 'VTuber', keywords: ['vtuber', 'ブイチューバー'] }
    ];
    subTags.forEach(s => {
        s.keywords.forEach(kw => {
            if (titleLower.includes(kw)) addTag(s.name, 5);
            else if (contentLower.includes(kw)) addTag(s.name, 3);
        });
    });
    const fullText = titleLower + ' ' + contentLower;
    const isBreaking = ['発表', '決定', '公開', '発売', '開始', '解禁', '速報'].some(kw => fullText.includes(kw));
    if (isBreaking) addTag('ニュース', 2);
    const brackets = title.match(/【([^】]+)】/g);
    if (brackets) {
        brackets.forEach(b => {
            const word = b.replace(/[【】]/g, '').trim();
            if (word.length >= 2 && word.length <= 12 && !/速報|まとめ|更新|一覧/.test(word)) {
                addTag(word, 3);
            }
        });
    }
    let sortedTags = Object.entries(tagScores).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
    if (sortedTags.length < 1) sortedTags.push('ニュース');
    if (sortedTags.length < 2) sortedTags.push('話題');
    return sortedTags.slice(0, 4);
}

async function startRepair() {
    console.log("🛠️ 既存アンケートの修復を開始するらび！ (超・安全重視版)");
    
    const today = new Date();
    today.setHours(today.getHours() - 36);

    const { data: surveys, error: sErr } = await supabase
        .from('surveys')
        .select('*')
        .eq('is_official', true)
        .gte('created_at', today.toISOString());

    if (sErr) return console.error("Fetch error:", sErr);
    console.log(`対象件数: ${surveys.length}件`);

    for (const s of surveys) {
        // 💬 全コメントを取得
        const { data: comments } = await supabase
            .from('comments')
            .select('content')
            .eq('survey_id', s.id);

        // 🔗 リンクを探す (コメント優先、なければ今の説明文から)
        let link = '';
        if (comments) {
            for (const c of comments) {
                const match = c.content.match(/(?:https?:\/\/[^\s)]+)/);
                if (match && !match[0].includes('supabase')) {
                    link = match[0].replace(/[）\)]$/, '');
                    break;
                }
            }
        }
        
        if (!link) {
            // 今の説明文にリンクがあれば救出するらび！
            const mdMatch = s.description?.match(/\[(?:続きを読む|出典元)[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
            const rawMatch = s.description?.match(/(https?:\/\/[^\s)]+)/i);
            if (mdMatch) link = mdMatch[1];
            else if (rawMatch && !rawMatch[0].includes('supabase')) link = rawMatch[1] || rawMatch[0];
        }

        // ⚠️ リンクが見つからない場合は、掃除も更新もしない (安全第一！)
        if (!link) {
            console.log(`  [Skip] ${s.id}: リンク未発見らび。現状を維持するよ。`);
            continue;
        }

        // 🧹 掃除: 末尾の余計なものを一掃する
        // リンクが確実に手に入った状態でのみ掃除を実行するらび！
        let cleanDesc = (s.description || '')
            .replace(/\n*(\[.*?\]\(https?:\/\/[^\s)]+\)|(?:続きを読む|続きを[読よ]む|詳細はこちら|詳細を見る|出典元|Read more|…|[\(（].*?[\)）]|[\. ]{2,}|[\s\.\-]+))*$/gi, '')
            .trim();

        // 📝 正しいリンクを1つだけ付与！
        cleanDesc += `\n\n[続きを読む](${link})`;

        const newTags = generateTags(s.title, cleanDesc);

        console.log(`  [Update] ${s.id}: ${s.title.substring(0, 15)}...`);
        const { error: uErr } = await supabase
            .from('surveys').update({ description: cleanDesc, tags: newTags }).eq('id', s.id);

        if (uErr) console.log(`[Update Failed] ${s.id}: ${uErr.message}`);

        // 💬 らびのコメントから重複リンクを掃除
        if (comments) {
            for (const c of comments) {
                if (c.content.includes('【らび🐰のひとりごと】')) {
                    const cleanComment = c.content.replace(/\n\n\[[^\]]+\]\(https?:\/\/[^\s)]+\)/gi, '').trim();
                    if (cleanComment !== c.content) {
                        await supabase.from('comments').update({ content: cleanComment }).eq('survey_id', s.id).eq('content', c.content);
                    }
                }
            }
        }
    }

    console.log("✨ 修復試行完了らびっ！");
}

startRepair();
