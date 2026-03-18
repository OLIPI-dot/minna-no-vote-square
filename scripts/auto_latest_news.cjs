const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// 環境変数取得
const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
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

// ニュースソース設定
const RSS_SOURCES = [
    { name: 'Yahoo!トピックス', url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', priority: 1 },
    { name: 'NHK主要ニュース', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', priority: 2 }
];

async function fetchAllNews() {
    console.log('📡 複数のソースから最新ニュースを取得中...');
    let allNews = [];

    for (const source of RSS_SOURCES) {
        try {
            const response = await axios.get(source.url);
            const xml = response.data;
            const items = xml.match(/<item>([\s\S]*?)<\/item>/g);
            if (!items) continue;

            const parsed = items.map(itemXml => {
                const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
                const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
                const title = titleMatch ? titleMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim() : '';
                return {
                    title: title,
                    link: linkMatch ? linkMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim() : '',
                    source: source.name,
                    priority: source.priority
                };
            }).filter(n => n.title);

            allNews = allNews.concat(parsed);
        } catch (e) {
            console.error(`⚠️ ${source.name} の取得失敗:`, e.message);
        }
    }

    // 優先度と鮮度でソート（簡易）
    return allNews.sort((a, b) => a.priority - b.priority);
}

function getLabiGreeting() {
    const hour = (new Date(new Date().getTime() + 9 * 60 * 60 * 1000)).getUTCHours();
    if (hour >= 5 && hour < 11) return "おはようらびっ！🌅 朝の最新ニュースを3つ厳選して届けに来たよ。";
    if (hour >= 11 && hour < 17) return "こんにちはらび！🕛 お昼休みにぴったりの注目ニュース3選だよ。";
    return "こんばんはらびっ！🌃 今日の締めくくりに、話題のニュースを3つ振り返ろうらび。";
}

async function postLatestNewsSurveys() {
    const newsItems = await fetchAllNews();
    if (!newsItems || newsItems.length === 0) {
        console.error('❌ ニュースの取得に失敗したみたい……😰');
        return;
    }

    console.log(`🔍 取得数: ${newsItems.length}件。重複を避けて3件投稿しますらび！`);

    let postedCount = 0;
    const maxPosts = 3;

    for (const news of newsItems) {
        if (postedCount >= maxPosts) break;

        const surveyTitle = `【速報/注目】${news.title} 📡📰`;

        // 重複チェック
        const { data: existing } = await supabase.from('surveys').select('id').eq('title', surveyTitle).limit(1);
        if (existing && existing.length > 0) {
            console.log(`⏩ スキップ: 「${news.title}」は投稿済みらび。`);
            continue;
        }

        console.log(`🚀 「${surveyTitle}」を投稿します！ (${news.source})`);

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        // YouTube でマッチする動画を簡易検索する魔法 🥕
        let videoId = "Live_News_Placeholder";
        try {
            console.log(`🔍 YouTube で「${news.title}」の公式ニュースを探しています...`);
            // 公式ニュースチャンネルを優先するキーワード
            const searchQuery = encodeURIComponent(`${news.title} ニュース公式`);
            const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
            const searchRes = await axios.get(searchUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });

            // ytInitialData から動画情報を抽出する
            const dataMatch = searchRes.data.match(/var ytInitialData = (\{.*?\});/);
            const ytData = dataMatch ? JSON.parse(dataMatch[1]) : null;

            if (ytData && ytData.contents) {
                const contents = ytData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
                
                for (const item of contents) {
                    const video = item.videoRenderer;
                    if (video && video.videoId) {
                        const vid = video.videoId;
                        const vTitle = video.title.runs[0].text;
                        
                        // ❌ NGワードチェック（ライブ中や配信予定を避ける）
                        const ngWords = ['LIVE', 'ライブ', '配信中', '生放送', '予告', 'Upcoming'];
                        const isNG = ngWords.some(word => vTitle.includes(word));
                        
                        if (!isNG) {
                            videoId = vid;
                            console.log(`📺 再生可能な動画を発見！: "${vTitle}" (ID: ${videoId})`);
                            break;
                        } else {
                            console.log(`⏩ スキップ（NGワード）: "${vTitle}"`);
                        }
                    }
                }
            } else {
                console.log('⚠️ ytInitialData の取得に失敗したため、旧方式の抽出を試みます...');
                const matches = searchRes.data.match(/"videoId":"([^"]+)"/g);
                if (matches && matches.length > 0) {
                    videoId = matches[0].split(':')[1].replace(/"/g, '');
                }
            }
        } catch (searchErr) {
            console.error('⚠️ YouTube 検索中にエラーらび:', searchErr.message);
        }

        const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
            title: surveyTitle,
            category: "ニュース・経済",
            tags: ["速報", "注目", news.source, "話題"],
            image_url: `yt:${videoId}`,
            deadline: deadline.toISOString(),
            visibility: 'public'
        }]).select();

        if (surveyError) {
            console.error(`❌ 「${news.title}」の投稿失敗:`, surveyError);
            continue;
        }

        const surveyId = surveyData[0].id;
        const options = ["非常に関心がある", "少し気になる", "今のところ静観", "詳しく調べたい"];

        await supabase.from('options').insert(
            options.map(name => ({ name, votes: 0, survey_id: surveyId }))
        );

        const greeting = getLabiGreeting();
        const comment = `${greeting}📰✨ 『${news.title}』が話題になってるみたいらび！ (${news.source}) \n\nみんなはどう思うかな？ 詳しい内容は公式（ ${news.link} ）もチェックしてみてね。らびと一緒に世の中の「今」について話そうらび！🐰🛡️🥇🏆`;

        await supabase.from('comments').insert([{
            survey_id: surveyId,
            user_name: 'らび🐰(AI)',
            content: comment,
            edit_key: 'labi_bot'
        }]);

        console.log(`✅ ID: ${surveyId} で完了らび！`);
        postedCount++;
    }

    console.log(`🏁 今回の自動投稿（計${postedCount}件）が無事に完了したらびっ！🥕✨🥇🏆`);
}

postLatestNewsSurveys();
