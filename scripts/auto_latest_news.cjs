const axios = require('axios');
const cheerio = require('cheerio');
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
    // 🥇 ニュース・時事・総合（最優先らび！）
    'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    'https://news.yahoo.co.jp/rss/categories/it.xml',
    'https://mantan-web.jp/rss/index.rdf',
    'http://kai-you.net/contents/feed.rss',

    // 🥈 エンタメ・トレンド
    'https://mdpr.jp/rss/attention.xml',
    'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    'https://natalie.mu/comic/rss/news',
    'https://natalie.mu/music/rss/news',

    // 🥉 ゲーム・サブカル
    'https://news.denfaminicogamer.jp/feed',
    'https://www.gamespark.jp/rss20/index.rdf',
    'https://www.famitsu.com/rss/fcom_all.rdf',
    'https://www.4gamer.net/rss/news_topics.xml',

    // 🏷️ その他
    'https://logtube.jp/feed/'
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
        /（取材協力：[^）]*）/g,
        /^\d+コメント\d+件/g,
        /◆.*?はこちら/g,
        /📌.*?はこちら/g,
        /【おすすめ記事】.*/g,
        /【写真】.*/g
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
        return ['大賛成！・進めるべき', '賛成寄り・良いと思う', '反対寄り・不安がある', '大反対！・見直すべき'];
    }

    // 4. 定番（フォールバック）
    return ['とても興味がある！', '普通に気になる・知りたい', 'あまり関心がない', '正直、どうでもいいかな'];
}

// 🤖 AI自動要約・タグ生成用の標準プロンプト定義（要約2点＋初心者向け用語解説1点）
const AI_SUMMARY_PROMPT = (articleContent) => `
あなたはニュースサイトの編集者です。
提供された記事テキストから、読者が30秒で理解できる「注目ポイント（2点）」と「主要用語のざっくり解説（1点）」を作成してください。

【出力フォーマット】
1. **[見出し（15文字以内）]**: 内容説明（50〜80文字程度）
2. **[見出し（15文字以内）]**: 内容説明（50〜80文字程度）
・**[記事内の専門用語や略語]**とは：初心者にもわかる1行解説（40文字以内）

【出力例】
1. **[キャリアの垣根を解消]**: 日本国内の「RCS」によるメッセージが、通信キャリアやOSの壁を越えて相互利用できるようになりました。
2. **[暗号化で安全性も向上]**: GoogleとAppleが共同推進し、AndroidとiPhone間でのやり取りの安全性が高まります。
・**RCS**とは：SMSの進化版で、写真や動画も送れる次世代メッセージ規格。

【必須ルール】
・箇条書き（1と2）は【必ず2つ】出力してください。1つだけで終わらせるのは禁止です。
・記事内で使われている専門用語や略語（例：RCS、自動運転、生成AIなど）を1つピックアップし、読者がググらなくても意味がわかる1行解説を添えてください。
・必ず「メイン本文」のみを対象とし、関連記事や広告テキストは完全に無視してください。

【記事テキスト】
${articleContent}
`.trim();

const AI_TAG_PROMPT = (articleContent) => `
あなたはニュースの分類を行う専門家です。
提供された記事テキストを分析し、最も関連性の高いタグを3〜5個抽出してください。

【タグ抽出のルール】
・必ず記事の「メイン本文」の内容に直接関係するキーワードのみを選定してください。
・サイドバーや関連記事、広告、サイトのナビゲーションに由来する単語は【絶対に】除外してください。
・固有名詞（製品名、企業名、人物名）、主要カテゴリ（「SSD」「自動運転」など）を優先してください。
・「ニュース」「話題」「最新」などの一般的すぎる抽象的な単語は除外してください。

【出力フォーマット】
カンマ区切りで出力してください（例: タグ1, タグ2, タグ3）

【記事テキスト】
${articleContent}
`.trim();

// 🚫 NGタグ・ブラックリストフィルター（抽象的すぎる単語やノイズを自動除外！）
const BLACKLIST_TAGS = ['ニュース', '最新ニュース', '話題', 'まとめ', 'おすすめ', 'トピックス', '最新', '速報', 'アンケート'];

function filterTags(tags) {
    return (tags || [])
        .map(tag => String(tag).trim())
        .filter(tag => tag.length >= 2 && tag.length <= 15)
        .filter(tag => !BLACKLIST_TAGS.includes(tag))
        .filter(tag => !tag.includes('(') && !tag.includes(')') && !tag.includes('【') && !tag.includes('】'));
}

/**
 * 🏷️ タグ生成（本文優先＆ブラックリスト強化版！）
 */
function generateTags(category, title, description) {
    const tags = new Set();
    const text = (title + ' ' + (description || '')).toLowerCase();

    // カテゴリを基本タグに入れる（ただし除外リストに入っていない場合のみ）
    if (category && category.length <= 10 && !BLACKLIST_TAGS.includes(category)) {
        tags.add(category);
    }

    const keywordMap = {
        'アニメ': 'アニメ', 'ゲーム': 'ゲーム', '映画': '映画', '漫画': '漫画', 'コミック': 'コミック',
        'youtube': 'YouTube', 'vtuber': 'VTuber',
        '芸能': '芸能', 'ジャニーズ': '芸能', 'アイドル': 'アイドル', 'お笑い': 'お笑い',
        '事件': '社会', '政治': '政治', '経済': '経済', '社会': '社会', '物価': '経済',
        'sns': 'SNS', '新感覚': '注目作', 'コラボ': 'コラボ', 'アプリ': 'スマホアプリ', 'イベント': 'イベント',
        '期間限定': '期間限定', '新発売': '新発売', 'グルメ': 'グルメ', 'スイーツ': 'スイーツ',
        '発表': '公式発表', 'switch': 'Nintendo Switch', 'ps5': 'PS5', 'iphone': 'iPhone', 'mac': 'Mac', 'apple': 'Apple',
        'ai': '生成AI', 'gemini': 'Gemini', 'claude': 'Claude', 'chatgpt': 'ChatGPT', 'usb': 'ガジェット',
        '大雨': '防災', '氾濫': '防災', '地震': '防災', '避難': '防災', 'steam': 'Steam'
    };

    // テキストをスキャンして具体的なキーワードタグを抽出
    for (const [kw, tagName] of Object.entries(keywordMap)) {
        if (text.includes(kw.toLowerCase())) {
            tags.add(tagName);
        }
    }

    // フィルタリング（ブラックリスト・長さチェック）
    let cleanTags = filterTags(Array.from(tags).filter(t => t !== title));

    // もしタグが不足している場合は、カテゴリに応じた具体的タグを補う
    if (cleanTags.length < 2) {
        const fallback = {
            'ゲーム': 'ゲーム特集',
            'エンタメ': 'エンタメ特集',
            'テクノロジー': 'テクノロジー',
            '社会': '社会',
            '生活': 'ライフスタイル'
        };
        const extra = fallback[category] || '注目トピック';
        if (!cleanTags.includes(extra)) cleanTags.push(extra);
    }

    return cleanTags.slice(0, 5);
}

/**
 * 📖 Cheerioを使ってHTMLから不要なナビや広告を除去し、メイン本文を抽出するらび！
 */
function extractMainContent(html) {
    if (!html) return { mainText: '', paragraphs: [] };
    const $ = cheerio.load(html);

    // 1. 関連記事、サイドバー、ナビゲーション、広告、スクリプトなどの不要タグを完全削除
    $('aside, footer, header, nav, iframe, script, style, noscript, svg, form').remove();
    $('.related-articles, .related_articles, .recommend-box, .recommend, .ad-container, .ad, .sidebar, .menu, .tags-list, .category-list, .sns-share, .comments-area, .comment-box, .author-profile').remove();
    $('[class*="related"], [class*="recommend"], [class*="banner"], [class*="footer"], [class*="header"]').remove();

    // 2. メイン本文エリア（articleやmain、主要コンテナ）を特定
    let $body = $('article');
    if ($body.length === 0) $body = $('[class*="articleBody"], [class*="article-body"], [class*="entry-content"], main');
    if ($body.length === 0) $body = $('body');

    // 3. 本文中の段落（<p>）を抽出
    const paragraphs = [];
    $body.find('p').each((_, el) => {
        const txt = $(el).text().trim().replace(/\s+/g, ' ');
        if (txt.length >= 30 &&
            !txt.includes('JavaScript') &&
            !txt.includes('利用規約') &&
            !txt.includes('プライバシー') &&
            !txt.includes('Cookie') &&
            !txt.match(/^[Cc]opyright/) &&
            !txt.match(/^All rights/)) {
            paragraphs.push(txt);
        }
    });

    const mainText = paragraphs.join('\n\n').trim();
    return { mainText, paragraphs };
}

/**
 * 📖 ニュースサイトからリッチな解説文と画像を取得するらび！
 */
async function fetchRichData(url, newsTitle = '') {
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

        // 2. Cheerioを使ってクリーンな本文と段落を抽出
        const { mainText, paragraphs } = extractMainContent(html);
        const mainParagraphs = paragraphs.slice(0, 3);

        let richDescription = '';
        mainParagraphs.forEach(para => {
            richDescription += `${para}\n\n`;
        });
        richDescription = richDescription.trim();

        // ⚡ 要約カード用: 30秒で理解できる要点（ポイント）を抽出してSUMMARYタグを生成
        const summaryLines = mainParagraphs.slice(0, 3).map(para => {
            const sentenceMatch = para.match(/^(.+?[。！])/);
            let s = sentenceMatch ? sentenceMatch[1] : para;
            s = s.trim().replace(/^([1-9]|[\u2460-\u2468]|[①-⑨])(?![0-9])[.\s、・]?/, '').replace(/^###\s*/, '');
            return `・${s.length > 100 ? s.substring(0, 98) + '…' : s}`;
        }).filter(Boolean);

        if (summaryLines.length > 0) {
            richDescription = `[[SUMMARY:\n${summaryLines.join('\n')}\n]]\n\n${richDescription}`;
        } else if (ogDesc && ogDesc.length > 20) {
            richDescription = `[[SUMMARY:\n・${ogDesc.substring(0, 100)}\n]]\n\n${ogDesc}`;
        }

        return { description: richDescription, image: ogImage };
    } catch (e) {
        log(`[Rich Fetch Error] ${url} -> ${e.message}`);
    }
    return { description: null, image: null };
}

function classifyNews(title, description) {
    const textLower = (title + ' ' + (description || '')).toLowerCase();
    const scores = { 'ニュース': 30, 'エンタメ': 0, '話題': 0, '芸能': 0, 'ゲーム': 0 }; // ニュースに底上げスコアを付与らび！🥕🛡️
    const keywords = {
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'アイドル', '漫画', 'コミック', '声優', 'youtube', 'vtuber', '動画配信', '実況'],
        '芸能': ['芸能', 'ジャニーズ', '不倫', '結婚', '熱愛', '退所', 'スター', '俳優', '女優', 'タレント', '芸人'], '話題': ['sns', 'ネットで', 'バズ', '炎上', '流行', 'x', 'twitter', 'tiktok', 'インスタ'],
        'ニュース': ['政治', '経済', '社会', '事件', '事故', '科学', '国際', '物価'],
        'ゲーム': ['ps5', 'switch', 'steam', 'ゲーム', 'プレイステーション', 'ニンテンドー', 'esports', 'rpg', 'fps', 'インディーゲーム']
    };
    for (const [cat, words] of Object.entries(keywords)) {
        words.forEach(w => { if (textLower.includes(w)) scores[cat] += 20; });
    }
    // 🎬 出典サイトによる優先度調整
    if (textLower.includes('mdpr.jp')) scores['芸能'] += 30;
    if (textLower.includes('kai-you.net')) scores['話題'] += 30;
    if (textLower.includes('denfaminicogamer')) scores['ゲーム'] += 30;

    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sorted[0][1] === 0 ? 'その他' : sorted[0][0];
}

async function startAutoPosting() {
    log('🚀 プレミアム自動投稿エンジン 起動らびっ！！ (長文リッチ＆エンタメ強化版) ' + (IS_DRY_RUN ? ' (DRY RUN)' : ''));

    // 🎲 ニュース系フィード（上位4件）を固定し、残りをシャッフルして多様性を出すらび！
    const priorityFeeds = RSS_FEEDS.slice(0, 4);
    const otherFeeds = RSS_FEEDS.slice(4).sort(() => Math.random() - 0.5);
    const orderedFeeds = [...priorityFeeds, ...otherFeeds];

    let allNews = [];
    for (const feed of orderedFeeds) {
        try {
            const response = await axios.get(feed, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const feedData = response.data;
            const items = feedData.match(/<item>([\s\S]*?)<\/item>/g) || [];
            for (const item of items) {
                const title = stripHtml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
                const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
                const pubDateStr = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || item.match(/<dc:date>([\s\S]*?)<\/dc:date>/)?.[1];

                if (!title || !link) continue;

                // 🕒 鮮度チェック: 24時間以内の記事だけを採用するらび！
                if (pubDateStr) {
                    const pubDate = new Date(pubDateStr);
                    const now = new Date();
                    const diffMs = now - pubDate;
                    if (diffMs > 24 * 60 * 60 * 1000) {
                        // log(`⏳ 古い記事をスキップ: ${title} (${pubDate.toLocaleString()})`);
                        continue;
                    }
                } else {
                    // 日付が取れない場合、不確実なのでスキップするのが安全らび
                    continue;
                }

                allNews.push({ title, link });
            }
        } catch (e) {
            log(`❌ フィード取得失敗: ${feed} -> ${e.message}`);
        }
    }

    const { data: recentSurveys } = await supabase.from('surveys').select('title, description').order('created_at', { ascending: false }).limit(500);
    const normalize = (t) => (t || '').replace(/[\s、。！？「」『』]/g, '').toLowerCase();
    const recentNormTitles = new Set(recentSurveys?.map(s => normalize(s.title)) || []);

    let count = 0;
    const POST_LIMIT = 12; // 1回12件まで大幅増量！ ニュース大盛りらびっ！！🥕🚀🔥
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

            const tags = generateTags(cat, news.title, richData.description);
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
