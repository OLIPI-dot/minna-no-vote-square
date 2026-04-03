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
    'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    'https://news.yahoo.co.jp/rss/categories/it.xml',
    'https://news.yahoo.co.jp/rss/categories/entertainment.xml',
    'https://logtube.jp/feed/',
    'https://realsound.jp/tech/index.xml'
];

/**
 * 🕵️ YouTubeで「本当に合っている」動画を探す高度な機能らび！
 */
async function searchYouTubeVideo(query) {
    try {
        // 1. 検索クエリを「ピカピカ」に掃除するらび！ (配信元名や余計な情報を消すよ)
        let cleanQuery = query
            .replace(/\(.*?\)|（.*?）|【.*?】|\[.*?\]/g, '') // カッコの中身（配信元など）を消す
            .replace(/（[^）]*$|【[^】]*$|\[[^\]]*$/g, '') // 閉じ忘れカッコを消す
            .replace(/ - .*?$/g, '') // ハイフン以降のニュースサイト名を消す
            .replace(/[、。・]/g, ' ') // 読点などを空白に変えてマッチしやすくする
            .trim();

        // 検索ワードが短くなりすぎないように調整
        const refined = cleanQuery.length < 10 ? `${cleanQuery} ニュース` : `${cleanQuery} ニュース`;
        
        log(`🔎 YouTube検索開始: [${refined}]`);
        const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(refined)}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
            }
        });
        const html = res.data;
        
        // 2. 「videoRenderer」を狙い撃ちして、最初の動画情報を抜き出すらび！ (おすすめ棚を回避するよ)
        // 💡 最初の videoRenderer オブジェクトを探す
        const videoMatches = [...html.matchAll(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g)];
        
        if (videoMatches.length > 0) {
            const firstVideo = videoMatches[0];
            const videoId = firstVideo[1];
            const videoTitle = firstVideo[2].replace(/\\u([0-9a-fA-F]{4})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16)));
            
            log(`📺 見つかった動画: "${videoTitle}" (ID: ${videoId})`);

            // 3. 確信度チェック！ (ニュースタイトルの重要な言葉が動画タイトルに含まれているか？)
            const mainKeywords = cleanQuery.split(/\s+/).filter(w => w.length >= 2);
            const matchCount = mainKeywords.filter(k => videoTitle.includes(k)).length;
            const matchRate = matchCount / (mainKeywords.length || 1);

            if (matchRate >= 0.4 || videoTitle.includes(mainKeywords[0])) {
                log(`✅ 確信度OK! (キーワード一致: ${matchCount}/${mainKeywords.length})`);
                return `yt:${videoId}`;
            } else {
                log(`⚠️ 確信度が低いためスキップらび: ${matchRate.toFixed(2)} (タイトルが合いません)`);
            }
        } else {
            log(`❌ 動画が見つかりませんでしたらび…`);
        }
    } catch (e) {
        log(`❌ YouTube検索エラー: ${e.message}`);
    }
    return null;
}

function stripHtml(str) {
    if (!str) return '';
    return str
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#45;/g, '-')
        .replace(/(\s*(?:続きを読む|続きを[読よ]む|詳細はこちら|詳細を見る|Read more|…|[\. ]{2,}|[\s\.\-]+$))+/gi, '')
        .replace(/\s*[\[【]\s*[\.．… ]*\s*[\]】]\s*$/g, '') 
        .replace(/\s+/g, ' ') 
        .trim();
}

function classifyNews(title, description) {
    const textLower = (title + ' ' + (description || '')).toLowerCase();
    const scores = {
        'ニュース': 10,
        'エンタメ': 0,
        '話題': 0,
        'レビュー': 0,
        'コラム': 0,
        'ネタ': 0,
        '芸能': 0,
        'らび': 0
    };
    const isTrustedTechSite = /watch\.impress\.co\.jp|itmedia\.co\.jp|mynavi\.jp|ascii\.jp|gizmodo\.jp|phileweb\.com|digitallife\.jp|realsound\.jp\/tech/.test(description || '');
    if (isTrustedTechSite) scores['ニュース'] += 100;
    const isYouTuberSite = /logtube\.jp/.test(description || '');
    if (isYouTuberSite) scores['エンタメ'] += 50; 
    const keywords = {
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'ライブ', 'アイドル', 'タレント', '披露宴', '結婚', '離婚', 'ファン', 'イベント', '漫画', 'マンガ', 'コミック', 'ゲーム', 'youtuber', 'ユーチューバー', '動画配信', '実況', 'vtuber', 'tiktok'],
        '話題': ['sns', 'ネットで', 'バズ', '炎上', '論争', '話題に', '流行', 'Twitter', 'ツイッター', 'Instagram', 'インスタ', 'Threads'],
        'ニュース': ['政治', '経済', '社会', '事件', '事故', '国際', '科学', '医療'],
        'レビュー': ['レビュー', '使ってみた', '試用', '検証', '実機'],
        'コラム': ['コラム', '解説', '考察', '考え方', 'まとめ'],
        'ネタ': ['面白', '爆笑', '衝撃', '驚き'],
        '芸能': ['週刊誌', '熱愛', '破局', '引退', '復帰', '舞台挨拶'],
        'らび': ['ウサギ', 'うさぎ', '可愛い', '癒やし']
    };
    for (const [cat, words] of Object.entries(keywords)) {
        words.forEach(w => { if (textLower.includes(w)) scores[cat] += 10; });
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    if (top[1] === 0) return 'その他';
    return top[0];
}

function generateTags(title, description) {
    const text = (title + ' ' + (description || ''));
    const tags = [];
    if (text.includes('YouTube') || text.includes('YouTuber') || /youtuber|ユーチューバー/i.test(text)) tags.push('YouTuber');
    if (text.includes('SNS') || text.includes('Twitter') || text.includes('公式')) tags.push('SNS');
    if (text.includes('最新') || text.includes('話題')) tags.push('話題');
    if (text.includes('映画') || text.includes('ドラマ')) tags.push('エンタメ');
    return [...new Set(tags)];
}

async function fetchOgpDescription(url) {
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const html = res.data;
        const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
        if (ogDesc) return stripHtml(ogDesc[1]);
        const metaDesc = html.match(/<meta name="description" content="([^"]+)"/i);
        if (metaDesc) return stripHtml(metaDesc[1]);
    } catch (e) {
        log(`[OGP Fetch Error] ${url} -> ${e.message}`);
    }
    return null;
}

async function startAutoPosting() {
    log('🚀 自動投稿エンジン起動らび！ ' + (IS_DRY_RUN ? ' (DRY RUN MODE)' : ''));
    let allNews = [];
    for (const feed of RSS_FEEDS) {
        try {
            log(`📡 フィードを取得中...: ${feed}`);
            const response = await axios.get(feed, {
                timeout: 30000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const feedData = response.data;
            const items = feedData.match(/<item>([\s\S]*?)<\/item>/g) || [];
            log(`✨ ${items.length} 件の記事を見つけたよ！`);
            for (const item of items) {
                try {
                    const title = stripHtml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1]);
                    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1];
                    let description = stripHtml(item.match(/<description>([\s\S]*?)<\/description>/)?.[1]);
                    if (!title || !link) continue;
                    const cat = classifyNews(title, description);
                    const tags = generateTags(title, description);
                    allNews.push({ title, link, description, category: cat, tags });
                } catch (itemError) {
                    log(`⚠️ ニュース項目の解析に失敗したけど、次へ進むらび: ${itemError.message}`);
                }
            }
        } catch (feedError) {
            log(`❌ フィード取得に失敗したけど、他のフィードを試すらび: ${feed} -> ${feedError.message}`);
        }
    }
    const { data: recentSurveys } = await supabase
        .from('surveys')
        .select('title, description')
        .order('created_at', { ascending: false })
        .limit(2000);
    const normalize = (t) => {
        let text = t || '';
        text = text.replace(/^【(速報|更新|最新|注目|重要)】/i, '');
        text = text.replace(/^\[(新着|修正|告知)\]/i, '');
        return text.replace(/[\s\t\n\r、。！？「」『』“”"‘’!?,.．．…—―‐－\(\)（）\[\]［］【】]/g, '').toLowerCase();
    };
    const recentNormTitles = new Set(recentSurveys?.map(s => normalize(s.title)) || []);
    const recentLinks = new Set(recentSurveys?.map(s => {
        const match = s.description?.match(/\[続きを読む\]\((.*?)\)/);
        return match ? match[1].trim() : null;
    }).filter(l => l) || []);
    let count = 0;
    const categoryCounts = {};
    const now = new Date();
    const jstHour = (now.getUTCHours() + 9) % 24;
    let maxPosts = 2;
    let maxPerCategory = 1;
    let newsMax = 1;
    if (jstHour >= 19 && jstHour <= 23) {
        maxPosts = 5;
        maxPerCategory = 2;
        newsMax = 3;
    } else if (jstHour === 12 || (jstHour >= 7 && jstHour <= 8)) {
        maxPosts = 3;
        maxPerCategory = 1;
        newsMax = 2;
    } else if (jstHour >= 2 && jstHour <= 5) {
        maxPosts = 1;
        maxPerCategory = 1;
        newsMax = 1;
    }
    log(`[Dynamic Limit] JST ${jstHour}時なので、最大 ${maxPosts}件（ニュースは${newsMax}件まで）投稿するらび！`);
    for (const news of allNews) {
        if (count >= maxPosts) break; 
        if (recentLinks.has(news.link.trim())) {
            log(`[Skip] URLが重複しています: ${news.title}`);
            continue;
        }
        const normCurrent = normalize(news.title);
        if (recentNormTitles.has(normCurrent)) {
            log(`[Skip] タイトルが実質的に重複しています: ${news.title}`);
            continue;
        }
        let effectiveDescription = news.description;
        if (!effectiveDescription || effectiveDescription.length < 400) {
            log(`[Lazy OGP] 内容が薄いため再取得を試みます: ${news.title}`);
            const ogpData = await fetchOgpDescription(news.link);
            if (ogpData && ogpData.length > (effectiveDescription || '').length) {
                effectiveDescription = ogpData;
            }
        }
        if (!effectiveDescription || effectiveDescription.length < 50) {
            log(`[Skip] 内容が不十分です: ${news.title}`);
            continue;
        }
        try {
            const cat = news.category;
            const isNewsLike = (cat === 'ニュース' || cat === 'その他');
            const currentCatMax = (isNewsLike ? newsMax : maxPerCategory);
            if (categoryCounts[cat] >= currentCatMax) continue;
            
            // ✨ 動画検索の質が上がったらびっ！
            let video = await searchYouTubeVideo(news.title);
            let imageUrl = video || '';
            
            if (!imageUrl && news.category === 'ニュース') {
                imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000';
            }
            if (!imageUrl) {
                log(`[Skip] 画像/動画が見つかりません: ${news.title}`);
                continue;
            }
            log(`🚀 投稿準備OK: ${news.title} (${cat})`);
            if (!IS_DRY_RUN) {
                const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: sData, error: sErr } = await supabase.from('surveys').insert([{
                    title: news.title,
                    description: effectiveDescription + '\n\n[続きを読む](' + news.link + ')',
                    category: cat,
                    image_url: imageUrl,
                    user_id: '86819a93-5182-4299-906d-74d3202996e3',
                    is_official: true,
                    visibility: 'public',
                    tags: news.tags,
                    deadline
                }]).select();
                if (sErr) throw sErr;
                const surveyId = sData[0].id;
                await supabase.from('options').insert([
                    { survey_id: surveyId, name: 'あり', votes: 0 },
                    { survey_id: surveyId, name: 'なし', votes: 0 },
                    { survey_id: surveyId, name: 'わからない', votes: 0 }
                ]);
                log(`✅ 投稿成功らび！: ${news.title}`);
            } else {
                log(`[DRY RUN] 投稿: ${news.title} [${cat}]`);
            }
            count++;
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        } catch (e) {
            log(`❌ 投稿失敗: ${news.title} -> ${e.message}`);
        }
    }
    log(`✨ 自動投稿完了らび！合計: ${count}件`);
}

startAutoPosting().catch(console.error);
