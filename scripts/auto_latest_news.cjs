const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env から環境変数を手動で読み込むらび！
const envPath = path.join(__dirname, '..', '.env');
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
const supabase = createClient(supabaseUrl, supabaseKey);

const IS_DRY_RUN = process.argv.includes('--dry-run');
const LOG_FILE = path.join(__dirname, '..', 'labi_auto_post.log');

function log(msg) {
    const timestamp = new Date().toLocaleString('ja-JP');
    const logMsg = `[${timestamp}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(LOG_FILE, logMsg);
}

const RSS_FEEDS = [
    'http://kai-you.net/contents/feed.rss',
    'https://mdpr.jp/rss/attention.xml',
    'https://natalie.mu/comic/rss/news',
    'https://natalie.mu/music/rss/news',
    'https://mantan-web.jp/rss/index.rdf',
    'https://news.denfaminicogamer.jp/feed',
    'https://logtube.jp/feed/',
    'https://www.gamespark.jp/rss20/index.rdf',
    'https://www.famitsu.com/rss/fcom_all.rdf',
    'https://www.4gamer.net/rss/news_topics.xml',
    'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    'https://news.yahoo.co.jp/rss/categories/it.xml',
    'https://news.yahoo.co.jp/rss/topics/top-picks.xml'
];

/**
 * 🕵️ YouTube検索（確信度チェック付き）
 */
async function searchYouTubeVideo(query) {
    try {
        let cleanQuery = query
            .replace(/\(.*?\)|（.*?）|【.*?】|\[.*?\]/g, '')
            .replace(/ - .*?$/g, '')
            .replace(/[、。・]/g, ' ')
            .trim();

        const refined = `${cleanQuery} ニュース`;
        log(`🔎 YouTube検索: [${refined}]`);
        const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(refined)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const html = res.data;
        const videoMatches = [...html.matchAll(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g)];
        
        if (videoMatches.length > 0) {
            const firstVideo = videoMatches[0];
            const videoId = firstVideo[1];
            const videoTitle = firstVideo[2].replace(/\\u([0-9a-fA-F]{4})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16)));
            
            const mainKeywords = cleanQuery.split(/\s+/).filter(w => w.length >= 2);
            const matchCount = mainKeywords.filter(k => videoTitle.includes(k)).length;
            const matchRate = matchCount / (mainKeywords.length || 1);

            if (matchRate >= 0.4 || videoTitle.includes(mainKeywords[0])) {
                return `yt:${videoId}`;
            }
        }
    } catch (e) {
        log(`❌ YouTube検索エラー: ${e.message}`);
    }
    return null;
}

function stripHtml(str) {
    if (!str) return '';
    let text = str
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ');

    // 🧹 より強力なノイズフィルターらびっ！
    const noisePatterns = [
        /【この記事に関する別の画像を見る】.*/g,
        /\[関連記事\].*/g,
        /【関連記事\].*/g,
        /\[ 続きを読む \].*/g,
        /…続きを[読よ]む.*/g,
        /\[Photo\].*/g,
        /■[ 　]*詳細はこちら.*/g,
        /（[^）]*編集部）/g,
        /（取材協力：[^）]*）/g
    ];
    noisePatterns.forEach(p => text = text.replace(p, ''));

    return text.trim();
}

function generateOptions(category, title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    // 1. エンタメ・話題・動画配信系
    if (category === 'エンタメ' || category === '芸能' || text.includes('youTube') || text.includes('vtuber') || text.includes('楽しみ')) {
        if (text.includes('vtuber') || text.includes('youtuber') || text.includes('ライブ配信')) {
            return ['推し！・応援してる', '気になる・見てみたい', 'あまり知らない', '自分には合わないかな'];
        }
        return ['神作の予感！・期待', '気になる・見てみたい', 'あまり興味ない', '正直、微妙かも…'];
    }
    
    // 2. 驚き・事件・ショック系
    if (text.includes('驚き') || text.includes('衝撃') || text.includes('逮捕') || text.includes('事件') || text.includes('悲報')) {
        return ['これは驚いた！', 'ひどすぎる・許せない', 'ショック…・残念', '自分には関係ないかな'];
    }
    
    // 3. 議論・ニュース・社会系
    if (category === 'ニュース' || text.includes('検討') || text.includes('改定') || text.includes('導入')) {
        return ['賛成・良いと思う', '反対・良くないと思う', 'どちらとも言えない', 'もっと詳しく知りたい'];
    }

    // 4. ゲーム系🎮
    if (category === 'ゲーム' || text.includes('ゲーム') || text.includes('発売') || text.includes('攻略') || text.includes('アプデ')) {
        return ['即買い！・遊ぶ', '面白そう！気になる', '期待してたのと違うかも', 'あまりゲームはしない'];
    }

    // 5. デフォルト
    return ['賛成・良いと思う', '微妙・う〜ん…', 'とりあえず考えない', '興味がある・興奮！'];
}

/**
 * 🏷️ タグ生成（以前の強化版を維持らび！）
 */
function generateTags(title, description, category) {
    const text = (title + ' ' + (description || ''));
    const tags = [category];
    const sourceMatch = title.match(/[（\(](.*?)[）\)]$/);
    if (sourceMatch) tags.push(sourceMatch[1]);

    const dict = {
        '経済': ['経済', '投資', '証券', '暗号資産', '仮想通貨', 'ビットコイン', '金融'],
        'テクノロジー': ['AI', '最新', 'ガジェット', 'iPhone', 'スマートフォン', 'OS', 'アップデート'],
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'アイドル', 'タレント', 'コミック', 'マンガ', 'VTuber', 'YouTuber', '声優'],
        'ゲーム': ['PS5', 'Switch', 'Steam', 'ゲーム', '発売', 'アプデ', 'eスポーツ', '攻略', '新作', 'インディー'],
        '芸能': ['結婚', '熱愛', '退所', 'デビュー', '引退', '不倫', '交際']
    };
    for (const [tag, words] of Object.entries(dict)) {
        words.forEach(w => { if (text.toLowerCase().includes(w.toLowerCase())) tags.push(tag); });
    }
    return [...new Set(tags)].filter(t => t);
}

/**
 * 📖 ニュースサイトからリッチな解説文と画像を取得するらび！
 */
async function fetchRichData(url) {
    try {
        let res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        let html = res.data;

        // 🛡️ Yahoo!ニュースの「あっちへ行って」対策（PickUPページから記事本体へ）
        if (url.includes('news.yahoo.co.jp/pickup/')) {
            const articleUrl = html.match(/href="(https:\/\/news\.yahoo\.co\.jp\/articles\/[^"]+)"/)?.[1];
            if (articleUrl) {
                log(`🔗 Yahoo本体へジャンプ中: ${articleUrl}`);
                res = await axios.get(articleUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                html = res.data;
            }
        }
        
        // 1. OGP系の基本情報を取得
        const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1];
        const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1];

        // 2. 本文（<p>タグ）を深掘りして「たっぷり感」を出すらび！
        // Yahooなどは記事本体を見に行っているので、もっとたくさん取っても大丈夫！
        // 🚨 修正: ただしページ下部のナビゲーションなど「ゲーム」「総合」といったキーワードを拾わないため、厳しめにフィルターするらび！
        const pLimit = url.includes('yahoo.co.jp') ? 4 : 3; 

        const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        const mainParagraphs = pMatches
            .map(m => stripHtml(m[1]))
            .filter(txt => txt.length > 25 && 
                    !txt.includes('JavaScript') && 
                    !txt.includes('アプリ') && 
                    !txt.includes('トピックス') && 
                    !txt.includes('ログイン') &&
                    !txt.match(/総合 | ニュース | エンタメ /)) // 総合メニュー等のフィルター
            .slice(0, pLimit);

        let richDescription = mainParagraphs.join('\n\n');
        
        // もし本文が取れなかったらOGPに頼るらび
        if (richDescription.length < 50) richDescription = ogDesc || '';

        return { description: richDescription, image: ogImage };
    } catch (e) {
        log(`[Rich Fetch Error] ${url} -> ${e.message}`);
    }
    return { description: null, image: null };
}

function classifyNews(title, description) {
    const textLower = (title + ' ' + (description || '')).toLowerCase();
    const scores = { 'ニュース': 10, 'エンタメ': 0, '話題': 0, '芸能': 0, 'ゲーム': 0 };
    const keywords = {
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'アイドル', 'タレント', '漫画', 'コミック', '声優', 'youtube', 'vtuber', '動画配信', '実況'],
        '芸能': ['芸能', 'ジャニーズ', '不倫', '結婚', '熱愛', '退所', 'スター', '俳優', '女優'],
        '話題': ['sns', 'ネットで', 'バズ', '炎上', '流行', 'x', 'twitter', 'tiktok', 'インスタ'],
        'ニュース': ['政治', '経済', '社会', '事件', '事故', '科学', '国際', '物価'],
        'ゲーム': ['ps5', 'switch', 'steam', 'ゲーム', '発売', 'アプデ', '新作', 'ゲーミング', 'ハード', 'esports']
    };
    for (const [cat, words] of Object.entries(keywords)) {
        words.forEach(w => { if (textLower.includes(w)) scores[cat] += 20; });
    }
    // 🎬 出典サイトによる優先度調整
    if (textLower.includes('natalie.mu') || textLower.includes('mantan-web')) scores['エンタメ'] += 30;
    if (textLower.includes('mdpr.jp')) scores['芸能'] += 30;
    if (textLower.includes('kai-you.net')) scores['話題'] += 30;
    if (textLower.includes('denfaminicogamer')) scores['ゲーム'] += 30;

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][1] === 0 ? 'その他' : sorted[0][0];
}

async function startAutoPosting() {
    log('🚀 プレミアム自動投稿エンジン 起動らびっ！！ (長文リッチ＆エンタメ強化版) ' + (IS_DRY_RUN ? ' (DRY RUN)' : ''));
    
    // 🎲 フィードの取得順をシャッフルして、いつも同じサイトに偏らないようにするらび！
    const shuffledFeeds = [...RSS_FEEDS].sort(() => Math.random() - 0.5);
    
    let allNews = [];
    for (const feed of shuffledFeeds) {
        try {
            const response = await axios.get(feed, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const feedData = response.data;
            const items = feedData.match(/<item>([\s\S]*?)<\/item>/g) || [];
            for (const item of items) {
                const title = stripHtml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
                const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
                if (!title || !link) continue;
                allNews.push({ title, link });
            }
        } catch (e) { log(`❌ フィード取得失敗: ${feed} -> ${e.message}`); }
    }

    const { data: recentSurveys } = await supabase.from('surveys').select('title, description').order('created_at', { ascending: false }).limit(500);
    const normalize = (t) => (t || '').replace(/[\s、。！？「」『』]/g, '').toLowerCase();
    const recentNormTitles = new Set(recentSurveys?.map(s => normalize(s.title)) || []);

    let count = 0;
    const POST_LIMIT = 4; // 1回4件まで増やすらび！
    for (const news of allNews) {
        if (count >= POST_LIMIT) break;
        if (recentNormTitles.has(normalize(news.title))) continue;

        log(`🔍 リード文をリッチ化中: ${news.title}`);
        const richData = await fetchRichData(news.link);
        if (!richData.description || richData.description.length < 50) continue;

        try {
            const cat = classifyNews(news.title, richData.description);
            let imageUrl = await searchYouTubeVideo(news.title);
            if (!imageUrl) imageUrl = richData.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000';

            const tags = generateTags(news.title, richData.description, cat);
            const options = generateOptions(cat, news.title, richData.description);
            
            // 🏷️ 出典元をタイトルから抜き出すらび！
            const sourceMatch = news.title.match(/[（\(](.*?)[）\)]$/);
            const sourceName = sourceMatch ? sourceMatch[1] : 'ニュース';
            const finalDesc = `${richData.description}\n\n（出典：${sourceName}）\n\n[続きを読む](${news.link})`;

            log(`🚀 プレミアム投稿準備OK: ${news.title} (${cat}) [Options: ${options.slice(0, 2).join(',')}...]`);
            if (!IS_DRY_RUN) {
                const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: sData, error: sErr } = await supabase.from('surveys').insert([{
                    title: news.title,
                    description: finalDesc,
                    category: cat,
                    image_url: imageUrl,
                    user_id: '86819a93-5182-4299-906d-74d3202996e3',
                    is_official: true,
                    visibility: 'public',
                    tags: tags,
                    deadline
                }]).select();
                if (sErr) throw sErr;
                const surveyId = sData[0].id;
                await supabase.from('options').insert(options.map(name => ({ survey_id: surveyId, name, votes: 0 })));
                log(`✅ プレミアム投稿成功らび！: ${news.title}`);
            }
            count++;
        } catch (e) { log(`❌ 投稿失敗: ${e.message}`); }
    }
    log(`✨ 自動投稿完了らび！`);
}

startAutoPosting().catch(console.error);
