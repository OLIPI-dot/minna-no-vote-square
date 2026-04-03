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
        let cleanQuery = query
            .replace(/\(.*?\)|（.*?）|【.*?】|\[.*?\]/g, '')
            .replace(/（[^）]*$|【[^】]*$|\[[^\]]*$/g, '')
            .replace(/ - .*?$/g, '')
            .replace(/[、。・]/g, ' ')
            .trim();

        const refined = cleanQuery.length < 10 ? `${cleanQuery} ニュース` : `${cleanQuery} ニュース`;
        
        log(`🔎 YouTube検索開始: [${refined}]`);
        const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(refined)}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
            }
        });
        const html = res.data;
        const videoMatches = [...html.matchAll(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g)];
        
        if (videoMatches.length > 0) {
            const firstVideo = videoMatches[0];
            const videoId = firstVideo[1];
            const videoTitle = firstVideo[2].replace(/\\u([0-9a-fA-F]{4})/g, (m, p1) => String.fromCharCode(parseInt(p1, 16)));
            
            log(`📺 見つかった動画: "${videoTitle}" (ID: ${videoId})`);

            const mainKeywords = cleanQuery.split(/\s+/).filter(w => w.length >= 2);
            const matchCount = mainKeywords.filter(k => videoTitle.includes(k)).length;
            const matchRate = matchCount / (mainKeywords.length || 1);

            if (matchRate >= 0.4 || videoTitle.includes(mainKeywords[0])) {
                log(`✅ 確信度OK! (キーワード一致: ${matchCount}/${mainKeywords.length})`);
                return `yt:${videoId}`;
            } else {
                log(`⚠️ 確信度が低いためスキップらび: ${matchRate.toFixed(2)} (不一致)`);
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

/**
 * 🏷️ 記事から豊富なタグを自動生成するらび！
 */
function generateTags(title, description, category) {
    const text = (title + ' ' + (description || ''));
    const tags = [category]; // 1. カテゴリを必ずタグにするらび！

    // 2. 配信元をタグとして抽出するらび！（スポーツ報知、ITmediaなど）
    const sourceMatch = title.match(/[（\(](.*?)[）\)]$/);
    if (sourceMatch) {
        tags.push(sourceMatch[1]);
    }

    // 3. キーワード辞書によるタグ付けらびっ！
    const keywordDictionary = {
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'ライブ', 'アイドル', 'タレント', '披露宴', '結婚', '俳優', '女優', '声優', 'インスタ', '出演'],
        '経済': ['経済', '投資', '証券', '暗号資産', '仮想通貨', 'ビットコイン', '金融', '取引所', '改定', '追加'],
        'テクノロジー': ['AI', '最新', 'ガジェット', 'iPhone', 'スマートフォン', 'OS', 'アップデート', '発表', '発売'],
        '話題': ['SNS', 'Twitter', 'X', '炎上', '論争', '話題に', '流行'],
        'スポーツ': ['野球', 'サッカー', '移籍', '勝利', '引退', '復帰', '優勝'],
        '社会': ['事件', '事故', '政治', '裁判', '逮捕', '検討', '指針'],
        'YouTuber': ['YouTube', 'YouTuber', 'ユーチューバー', '動画配信', '実況', 'VTuber']
    };

    for (const [tag, words] of Object.entries(keywordDictionary)) {
        words.forEach(w => {
            if (text.includes(w)) tags.push(tag);
        });
    }

    // 重複を消して、きれいなタグの配列を返すよ！
    return [...new Set(tags)].filter(t => t);
}

function classifyNews(title, description) {
    const textLower = (title + ' ' + (description || '')).toLowerCase();
    const scores = {
        'ニュース': 10,
        'エンタメ': 0,
        '話題': 0,
        '芸能': 0
    };
    const isTrustedTechSite = /watch\.impress\.co\.jp|itmedia\.co\.jp|mynavi\.jp|ascii\.jp|gizmodo\.jp|phileweb\.com|digitallife\.jp|realsound\.jp\/tech/.test(description || '');
    if (isTrustedTechSite) scores['ニュース'] += 100;
    const keywords = {
        'エンタメ': ['映画', 'ドラマ', 'アニメ', '音楽', 'アイドル', 'タレント', '漫画', 'ゲーム'],
        '話題': ['sns', 'ネットで', 'バズ', '炎上', '流行', 'Twitter', 'インスタ'],
        'ニュース': ['政治', '経済', '社会', '事件', '事故', '国際', '科学', '医療'],
        '芸能': ['週刊誌', '熱愛', '破局', '引退', '復帰', '舞台挨拶']
    };
    for (const [cat, words] of Object.entries(keywords)) {
        words.forEach(w => { if (textLower.includes(w)) scores[cat] += 10; });
    }
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    if (top[1] === 0) return 'その他';
    return top[0];
}

/**
 * 🖼️ ニュースサイトから「本物の画像（OGP）」と詳細を取得する機能らび！
 */
async function fetchOgpData(url) {
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const html = res.data;
        
        // 解説文の取得
        const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
        const metaDesc = html.match(/<meta name="description" content="([^"]+)"/i);
        const description = stripHtml(ogDesc?.[1] || metaDesc?.[1] || '');

        // アイキャッチ画像（OGP）の取得らび！
        const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i);
        const image = ogImage?.[1] || null;

        return { description, image };
    } catch (e) {
        log(`[OGP Fetch Error] ${url} -> ${e.message}`);
    }
    return { description: null, image: null };
}

async function startAutoPosting() {
    log('🚀 自動投稿エンジン起動らび！ (タグ＆画像強化版) ' + (IS_DRY_RUN ? ' (DRY RUN MODE)' : ''));
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
                    const category = classifyNews(title, description);
                    allNews.push({ title, link, description, category });
                } catch (itemError) {
                    log(`⚠️ 解析失敗: ${itemError.message}`);
                }
            }
        } catch (feedError) {
            log(`❌ フィード取得失敗: ${feed} -> ${feedError.message}`);
        }
    }

    const { data: recentSurveys } = await supabase
        .from('surveys')
        .select('title, description')
        .order('created_at', { ascending: false })
        .limit(2000);

    const normalize = (t) => (t || '').replace(/[\s\t\n\r、。！？「」『』“”"‘’!?,.．．…—―‐－\(\)（）\[\]［］【】]/g, '').toLowerCase();
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
    if (jstHour >= 19 && jstHour <= 23) maxPosts = 5;
    else if (jstHour === 12 || (jstHour >= 7 && jstHour <= 8)) maxPosts = 3;

    for (const news of allNews) {
        if (count >= maxPosts) break; 
        if (recentLinks.has(news.link.trim())) continue;
        if (recentNormTitles.has(normalize(news.title))) continue;

        // 🖼️ 本物の画像と詳細情報を深掘りするらび！
        log(`🔍 詳細を深掘り中: ${news.title}`);
        const ogpData = await fetchOgpData(news.link);
        let effectiveDescription = ogpData.description || news.description;
        
        if (!effectiveDescription || effectiveDescription.length < 50) {
            log(`[Skip] 内容が不十分らび: ${news.title}`);
            continue;
        }

        try {
            const cat = news.category;
            if (categoryCounts[cat] >= 2) continue;

            // 🎥 動画の確信度チェック！
            let imageUrl = await searchYouTubeVideo(news.title);
            
            // 🖼️ 動画が見つからなかったら、本物のOGP画像を使うよ！
            if (!imageUrl) {
                if (ogpData.image) {
                    log(`✨ 本物の画像(OGP)を採用らび！: ${ogpData.image}`);
                    imageUrl = ogpData.image;
                } else {
                    log(`💡 最終手段のプレースホルダを採用らびっ。`);
                    imageUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000';
                }
            }

            // 🏷️ 賑やかなタグを作るらび！
            const tags = generateTags(news.title, effectiveDescription, cat);

            log(`🚀 投稿準備OK: ${news.title} (${cat}) [Tags: ${tags.join(', ')}]`);
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
                    tags: tags,
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
                log(`[DRY RUN] 投稿: ${news.title} [${cat}] tags:[${tags.join(', ')}]`);
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
