const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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



// 🤖 AI自動要約・タグ生成用の標準プロンプト定義（JSONフォーマット＆十分なmax_tokens）
const AI_SUMMARY_OPTIONS = {
    max_tokens: 2048, // 文章が途中で途切れないよう十分に確保
    temperature: 0.7
};

const AI_SUMMARY_PROMPT = (articleContent) => `
以下のフォーマットのJSON形式のみを出力してください。余計な解説文やマークダウンの枠組みは不要です。

{
  "point1_title": "要点見出し1（15字以内）",
  "point1_desc": "要点説明1（60〜80字）",
  "point2_title": "要点見出し2（15字以内）",
  "point2_desc": "要点説明2（60〜80字）",
  "rabi_comment": "記事の具体名に触れたらびの感想（50〜70字）",
  "keyword_title": "専門用語（なければ空文字）",
  "keyword_desc": "用語の1行解説（なければ空文字）",
  "tags": ["固有名詞1", "固有名詞2", "トピック"],
  "survey_question": "記事の核心を突いた投票の問いかけ（30字以内）",
  "survey_options": [
    "選択肢1（前向き・期待・賛成の意見）",
    "選択肢2（別の視点やこだわり）",
    "選択肢3（慎重・懸念・反対・様子見の意見）",
    "選択肢4（あまり関心がない・様子見）"
  ]
}

【必須ルール（絶対遵守）】
・point1_title, point1_desc, point2_title, point2_desc, rabi_comment, tags, survey_question, survey_options のキーは【いかなる場合も省略せず、必ず全て】出力してください。
・要約（desc）は必ず60〜80文字程度で、読者にニュースのメリットや変更点がしっかり伝わる充実した内容にしてください。※【重要】本文の冒頭1〜2文をそのままコピー＆ペーストすることは絶対に禁止です。記事全体の趣旨を咀嚼してあなた自身の言葉で要約してください。タイトルの丸写しも厳禁です。
・rabi_comment に関する禁止事項：「話題のニュースだね！みんなはどう思う？」のような、どの記事にも使い回せる汎用的な定型文の出力は【厳禁】です。必ず「記事の中身（例：実質7万円は安いね！、噴火警戒は心配だね、等）」に感情を動かされたコメントにし、明るく親しみやすい語尾（うさぎキャラ）にしてください。
・keyword_title と keyword_desc は原則必須です。一般的な平易なニュース以外は必ず記事内の重要キーワードを1つ選んで解説を出力してください。
・tags の最優先ルール：記事タイトルに含まれる「作品名（例：ポケモンスリープ、ポケモン）」「製品名（例：iPhone、Galaxy）」「企業名」は【必ず最優先で1〜2個目にタグとして抽出】してください。
・tags に「注目トピック」「ニュース」「イベント」などの抽象的で無意味なワードは出力禁止です。記事本文から直接3〜4個抽出してください。
・survey_options は必ず4つの文字列の配列として出力してください。
・途中で文章が切れないよう、必ず完全なJSON形式で最後まで出力してください。

【記事テキスト】
${articleContent}
`.trim();



// 🤖 Gemini APIクライアントの初期化（APIキーがない場合はnull → フォールバック処理へ）
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let geminiModel = null;
if (GEMINI_API_KEY) {
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        log('🤖 Gemini AI モデル初期化完了らび！');
    } catch (e) {
        log(`⚠️ Gemini初期化エラー: ${e.message}（フォールバック処理を使用します）`);
    }
} else {
    log('⚠️ GEMINI_API_KEY が設定されていません。AI要約はフォールバック処理を使用します。');
}

/**
 * 🤖 Gemini APIで要約を生成（JSON形式・最大3回リトライ）
 */
async function generateAISummary(articleContent) {
    if (!geminiModel || !articleContent || articleContent.length < 50) return null;
    
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        if (attempt > 1) {
            log(`⏳ API無料枠レート制限（429）回避のため、大きく65秒待機します... (試行 ${attempt}/3)`);
            await new Promise(r => setTimeout(r, 65000));
        }
        try {
            const truncated = articleContent.substring(0, 2500); // 少し増やして情報量を確保
            const result = await geminiModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: AI_SUMMARY_PROMPT(truncated) }] }],
                generationConfig: {
                    maxOutputTokens: AI_SUMMARY_OPTIONS.max_tokens,
                    temperature: AI_SUMMARY_OPTIONS.temperature,
                    responseMimeType: "application/json",
                }
            });
            const responseText = result.response.text().trim();
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/(\{[\s\S]*\})/);
            const jsonString = jsonMatch ? jsonMatch[1].trim() : responseText;
            
            if (jsonString) {
                const parsed = JSON.parse(jsonString);
                // 全ての必須キーが存在し、かつ空文字でないことを厳格にチェック
                if (
                    parsed && 
                    parsed.point1_title?.trim() && parsed.point1_desc?.trim() && 
                    parsed.point2_title?.trim() && parsed.point2_desc?.trim() && 
                    parsed.rabi_comment?.trim() &&
                    Array.isArray(parsed.tags) &&
                    parsed.survey_question?.trim() &&
                    Array.isArray(parsed.survey_options) &&
                    parsed.survey_options.length === 4
                ) {
                    log(`✨ AI要約＆タグ生成成功！(試行 ${attempt}回目)`);
                    return parsed;
                } else {
                    throw new Error("必須フィールド（point2_descやrabi_commentなど）が欠落しています");
                }
            } else {
                throw new Error("JSONフォーマットとしてパースできませんでした");
            }
        } catch (e) {
            lastError = e.message;
            log(`⚠️ AI要約エラー (試行 ${attempt}/3): ${e.message}`);
        }
    }
    
    log(`❌ AI要約、3回のリトライでも失敗しました: ${lastError}`);
    return null;
}



// 🚫 古いブラックリストやタグフィルター（filterTags）は完全撤廃されました

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
    // 追加の強力なノイズ除去（他記事の混入を防止！）
    $('[class*="pickup"], [id*="pickup"], [class*="ranking"], [id*="ranking"], [class*="popular"], [id*="popular"], [class*="readmore"], [id*="readmore"], [class*="list"], [id*="list"], [class*="link"], [id*="link"]').remove();
    $('.article-list, .article_list, .post-list, .p-pickup, .c-pickup, .c-article_list, .related-links, .new-articles').remove();

    // 2. メイン本文エリア（articleやmain、主要コンテナ）を特定
    let $body = $('article');
    if ($body.length === 0) $body = $('[class*="articleBody"], [class*="article-body"], [class*="entry-content"], main');
    if ($body.length === 0) $body = $('body');

    // 3. 本文中の段落（<p>）を抽出
    const paragraphs = [];
    $body.find('br').replaceWith('\n');
    $body.find('p, div.article-body-inner, div.paragraph').each((_, el) => {
        const rawText = $(el).text().trim();
        const lines = rawText.split('\n').map(l => l.trim().replace(/\s+/g, ' ')).filter(Boolean);
        lines.forEach(txt => {
            if (txt.length >= 20 &&
                !txt.includes('JavaScript') &&
                !txt.includes('利用規約') &&
                !txt.includes('プライバシー') &&
                !txt.includes('Cookie') &&
                !txt.match(/^[Cc]opyright/) &&
                !txt.match(/^All rights/)) {
                paragraphs.push(txt);
            }
        });
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
        // アコーディオン表示用に、3行でカットせず十分な長さを取得するらび！
        const mainParagraphs = paragraphs.slice(0, 20); 

        let richDescription = '';
        mainParagraphs.forEach(para => {
            richDescription += `${para}\n\n`;
        });
        richDescription = richDescription.trim();

        // ⚡ 要約カード用: Gemini AIで高品質な要約を生成！
        let summaryObj = null;

        // 🤖 Gemini APIで要約を生成（APIキーがある場合）
        const fullText = mainText || richDescription || ogDesc || '';
        log(`📄 抽出した本文の長さ: ${fullText.length}文字`);
        
        if (geminiModel && fullText.length >= 50) {
            summaryObj = await generateAISummary(fullText);
            
            // 🤖 AIAPIを呼び出した場合のみ、レート制限対策として15秒待機する（成功・失敗問わず）
            log(`⏳ API無料枠の安全のため、次の処理まで15秒待機します...`);
            await new Promise(r => setTimeout(r, 15000));
        }

        // 🚫 従来の手抜きフォールバック（タイトルのコピペ代用など）は完全撤廃。
        // AI生成に失敗した場合は、summaryObjはnullのままとなり、正しい要約データのみがDBに保存されます。

        if (summaryObj) {
            richDescription = `[[SUMMARY:\n${JSON.stringify(summaryObj, null, 2)}\n]]\n\n${richDescription}`;
        }

        return { description: richDescription, image: ogImage, mainText: fullText, summaryObj };
    } catch (e) {
        log(`[Rich Fetch Error] ${url} -> ${e.message}`);
    }
    return { description: null, image: null, summaryObj: null };
}

function classifyNews(title, description) {
    const textLower = (title + ' ' + (description || '')).toLowerCase();
    const scores = { 'ニュース': 30, 'エンタメ': 0, '話題': 0, '芸能': 0, 'ゲーム': 0 }; // ニュースに底上げスコアを付与らび！🥕🛡️
    const keywords = {
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'アイドル', '漫画', 'コミック', '声優', 'youtube', 'vtuber', '動画配信', '実況'],
        '芸能': ['芸能', 'ジャニーズ', '不倫', '結婚', '熱愛', '退所', 'スター', '俳優', '女優', 'タレント', '芸人'], '話題': ['sns', 'ネットで', 'バズ', '炎上', '流行', 'x', 'twitter', 'tiktok', 'インスタ'],
        'ニュース': ['政治', '経済', '社会', '事件', '事故', '科学', '国際', '物価'],
        'ゲーム': ['ps5', 'switch', 'steam', 'ゲーム', 'プレイステーション', 'ニンテンドー', 'esports', 'rpg', 'fps', 'インディー', 'mod', 'pcゲーム', 'xbox', 'オープンワールド', '新作タイトル']
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

                allNews.push({ title, link, pubDateStr });
            }
        } catch (e) {
            log(`❌ フィード取得失敗: ${feed} -> ${e.message}`);
        }
    }

    const { data: recentSurveys } = await supabase.from('surveys').select('title, description').order('created_at', { ascending: false }).limit(500);
    const normalize = (t) => (t || '').replace(/[\s、。！？「」『』]/g, '').toLowerCase();
    const recentNormTitles = new Set(recentSurveys?.map(s => normalize(s.title)) || []);

    let count = 0;
    let attemptCount = 0;
    const POST_LIMIT = 2; // 1回2件まで厳選！ (1日4回実行で合計最大8本/日) 🥕
    const MAX_ATTEMPTS = 5; // 無限ループ防止！詳細取得にいく記事は上位5件までに制限するらび！

    for (const news of allNews) {
        if (count >= POST_LIMIT) break;
        if (attemptCount >= MAX_ATTEMPTS) {
            log(`⚠️ 最大試行回数（${MAX_ATTEMPTS}回）に達したため、処理を打ち切ります。`);
            break;
        }
        if (recentNormTitles.has(normalize(news.title))) continue;

        attemptCount++;
        log(`🔍 リード文をリッチ化中 (${attemptCount}/${MAX_ATTEMPTS}): ${news.title}`);
        const richData = await fetchRichData(news.link);

        if (!richData.description || richData.description.length < 50) continue;

        try {
            const cat = classifyNews(news.title, richData.description);
            let imageUrl = await searchYouTubeVideo(news.title);
            if (!imageUrl) imageUrl = richData.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000';

            // 🏷️ 要約AIが生成したタグをそのまま使用（フォールバック完全撤廃）
            let tags = [];
            if (richData.summaryObj && Array.isArray(richData.summaryObj.tags)) {
                tags = richData.summaryObj.tags.map(t => String(t).trim()).filter(t => t.length > 0);
            }
            let options = ['とても興味がある！', '普通に気になる・知りたい', 'あまり関心がない', '正直、どうでもいいかな'];
            if (richData.summaryObj && Array.isArray(richData.summaryObj.survey_options) && richData.summaryObj.survey_options.length >= 4) {
                options = richData.summaryObj.survey_options.slice(0, 4);
            }

            // 🏷️ 出典元をタイトルから抜き出すらび！
            const sourceMatch = news.title.match(/[（\(](.*?)[）\)]$/);
            const sourceName = sourceMatch ? sourceMatch[1] : 'ニュース';

            // ⚠️ AI要約が生成できなかった場合は、本文の文字数に関わらず強制スキップ！
            // （タイトルや短いキャプションだけの淡白な記事が投稿されるのを防ぐらび！）
            if (!richData.summaryObj) {
                log(`⚠️ 警告: AI要約の生成に失敗したため、投稿を強制スキップします: ${news.title}`);
                continue;
            }

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
                    deadline,
                    source_published_at: news.pubDateStr ? new Date(news.pubDateStr).toISOString() : null
                }]).select();
                if (sErr) throw sErr;
                const surveyId = sData[0].id;
                await supabase.from('options').insert(options.map(name => ({ survey_id: surveyId, name, votes: 0 })));
                log(`✅ プレミアム投稿成功らび！: ${news.title}`);
            }
            count++;
        } catch (e) { log(`❌ 投稿失敗: ${e.message}`); }
    }
    if (count === 0) {
        log(`❌ 投稿件数が0件だったため、エラーとして異常終了します。`);
        process.exit(1);
    }
    log(`✨ 自動投稿完了らび！`);
}

startAutoPosting().catch(console.error);
