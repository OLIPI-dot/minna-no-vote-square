const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 環境変数取得
const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith(key + '=')) {
                    return trimmed.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
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
    { name: 'Yahoo!トピックス(総合)', url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', priority: 1, category: "ニュース・経済" },
    { name: 'Yahoo!エンタメ', url: 'https://news.yahoo.co.jp/rss/topics/entertainment.xml', priority: 2, category: "エンタメ" },
    { name: 'Yahoo!IT', url: 'https://news.yahoo.co.jp/rss/topics/it.xml', priority: 2, category: "IT・テクノロジー" },
    { name: 'Yahoo!サイエンス', url: 'https://news.yahoo.co.jp/rss/topics/science.xml', priority: 3, category: "IT・テクノロジー" },
    { name: 'Yahoo!国内', url: 'https://news.yahoo.co.jp/rss/topics/domestic.xml', priority: 3, category: "生活" },
    { name: 'NHK主要ニュース', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', priority: 2, category: "ニュース・経済" },
    { name: 'Modelpress', url: 'https://feed.mdpr.jp/rss/export/mdpr-topics.xml', priority: 3, category: "エンタメ" },
    { name: 'LogTube(YouTuber)', url: 'https://logtube.jp/feed/', priority: 3, category: "エンタメ" },
    { name: 'PANORA(VTuber)', url: 'https://panora.tokyo/feed/', priority: 3, category: "エンタメ" },
    { name: 'まとめくすアンテナ(人気)', url: 'https://feeds.mtmx.jp/news/all/popular/feed.xml', priority: 3, category: "トレンド" }
];

// OGP情報・画像を取得する魔法 🪄
async function fetchOGPInfo(targetUrl) {
    try {
        const response = await axios.get(targetUrl, { 
            timeout: 5000, 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } 
        });
        const html = response.data;
        
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) || 
                           html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
        let desc = (ogDescMatch ? ogDescMatch[1] : (descMatch ? descMatch[1] : null));

        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
                             html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
        let image = ogImageMatch ? ogImageMatch[1] : null;

        let videoStr = null;
        const ytMatch = html.match(/youtube\.com\/embed\/([^"?]+)/) || html.match(/v=([^&" ]+)/);
        if (ytMatch && ytMatch[1] && ytMatch[1].length === 11) videoStr = `yt:${ytMatch[1]}`;
        
        if (!desc || desc.length < 40) {
            const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
            if (pMatches) {
                for (const p of pMatches) {
                    const text = p.replace(/<[^>]*>?/gm, '').trim();
                    if (text.length > 100 && !text.includes('JavaScript')) {
                        desc = text;
                        break;
                    }
                }
            }
        }

        if (desc) {
            desc = desc.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
            const boilerplates = ["JavaScript is disabled", "有効にしてください", "Loading..."];
            if (boilerplates.some(b => desc.includes(b))) desc = null;
            if (desc && desc.length > 400) desc = desc.substring(0, 400) + '...';
        }

        return { description: desc, image: image, video: videoStr };
    } catch (e) {
        return { description: null, image: null, video: null };
    }
}

async function fetchRSSNews() {
    console.log('📡 RSSソースから取得中...');
    let allNews = [];

    for (const source of RSS_SOURCES) {
        try {
            const response = await axios.get(source.url);
            const xml = response.data;
            const items = xml.match(/<item[\s\S]*?>([\s\S]*?)<\/item>/g);
            if (!items) continue;

            const newsInSource = items.map(item => {
                let title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '';
                title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
                
                let link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '';
                link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
                
                let description = item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '';
                description = description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
                
                if (title.length > 150) title = title.substring(0, 150) + '...';
                if (!title || !link || title.includes('PR:')) return null;

                return {
                    title: title,
                    link: link,
                    description: description,
                    source: source.name,
                    priority: source.priority,
                    category: source.category
                };
            }).filter(n => n);

            allNews = [...allNews, ...newsInSource];
        } catch (e) {
            console.warn(`⚠️ ${source.name} 取得失敗:`, e.message);
        }
    }
    return allNews;
}

async function fetchChannelNews() {
    console.log('📡 2chまとめアンテナから取得中...');
    try {
        const response = await axios.get('https://2ch-c.net/?p=ranking', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const html = response.data;
        const htmlMatches = html.match(/<a[^>]+class="rank_title"[^>]*>([\s\S]*?)<\/a>/g) || 
                            html.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g);
        if (!htmlMatches) return [];
        
        return htmlMatches.map(m => {
            const link = m.match(/href="([^"]+)"/)?.[1] || '';
            let title = m.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
            
            if (!link || title.length < 15 || link.includes('2ch-c.net')) return null;
            if (title.length > 150) title = title.substring(0, 150) + '...';
            
            let category = "トレンド";
            if (title.includes('アニメ') || title.includes('マンガ')) category = "アニメ";
            if (title.includes('ゲーム')) category = "ゲーム";
            if (title.includes('芸能') || title.includes('アイドル')) category = "エンタメ";
            if (title.includes('食') || title.includes('料理')) category = "グルメ";

            return {
                title: title,
                link: link,
                description: null, 
                source: '2chまとめアンテナ',
                priority: 3,
                category: category
            };
        }).filter(n => n).slice(0, 15);
    } catch (e) {
        console.error('⚠️ 2chまとめアンテナ取得失敗:', e.message);
        return [];
    }
}

function getLabiGreeting() {
    const greetings = ["やっほー！🐰✨", "ひょっこり降臨らび！🐾", "みんな、元気にしてるかな？🐰💎", "最新ニュースを持ってきたよっ！🥕"];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

function getLabiImpression(category, title) {
    const impressions = {
        "エンタメ": ["最近のトレンドは目が離せないらび！✨", "芸能界のニュース、ワクワクしちゃうねっ！🌈", "これ、らびも気になってたんだ！🎬", "華やかな話題にドキドキするらび！💖"],
        "グルメ": ["おいしそうな話題……人参も負けてられないらび！🥕🍰", "これ食べたら元気になれそうだねっ！😋", "グルメ情報はいつも楽しみらび！🍔", "お腹が空いてきちゃうらびね〜🤤"],
        "スポーツ": ["スポーツの熱気、らびにも伝わってきたよ！⚽🔥", "一生懸命な姿って、見ているだけで感動しちゃうねっ！🏆", "みんなで応援しようらび！📣", "熱い戦いに勇気をもらえるらび！🚩"],
        "IT・テクノロジー": ["最新技術ってすごーい！未来が楽しみらび！💻✨", "便利な世の中になっていくねっ！🚀", "これからの進化に期待らび！🤖", "テクノロジーの力で世界が広がるらび！🌐"],
        "アニメ": ["アニメ界の盛り上がり、らびも大好きらび！📺✨", "声優さんや制作さんの情熱がすごいねっ！🔥", "次の話が楽しみすぎるらび……！🌟", "名作の予感がするらびね！🎬"],
        "ゲーム": ["ゲームの話題はいつも胸が熱くなるねっ！🎮✨", "みんなで遊んだら楽しそうらび！🕹️", "新作情報、らびもチェックしなきゃ！🌟", "攻略法を考えちゃうらびね！🎲"],
        "ニュース・経済": ["世の中の動きをしっかりチェックらび！📉🗞️", "これからの動きが気になる重大ニュースだね……！🤔", "みんなにとって大切な情報かもしれないらび！🛡️", "未来のために知っておくべきことらび。⚖️"]
    };

    if (title.includes('結婚') || title.includes('熱愛')) return "わぁっ！おめでたい話題らびねっ！💕 心が温まるニュースらび〜💍";
    if (title.includes('引退') || title.includes('卒業')) return "えぇっ、寂しくなっちゃうね……😢 でも、これまでの活躍に心から拍手らびっ！✨";
    if (title.includes('優勝') || title.includes('世界一')) return "やったぁぁ！おめでとうらびーっ！🎊🥇 最高の瞬間を一緒に祝おうらび！🚩";
    
    const choices = impressions[category] || ["これ、すっごく気になる話題らび！👀", "みんなはどう思ってるかな？✨", "最新情報をチェックらび！🔍"];
    return choices[Math.floor(Math.random() * choices.length)];
}

function getRabiPoint(category, title) {
    const points = {
        "エンタメ": ["最新のトレンド情報らび！", "みんなの反応が気になるねっ！", "話題沸騰中のエピソードらび！"],
        "グルメ": ["おいしそうな情報にらびもお腹が空いちゃうっ！🥕", "これは要チェックなグルメスポットらびね！", "食欲をそそる素敵な話題らび！"],
        "IT・テクノロジー": ["最先端のテクノロジーにワクワクするらび！💻", "私たちの生活を変えるかもしれない大注目ニュースらび！", "驚きの最新情報を見逃さないでらび！"]
    };
    const choices = points[category] || ["らびのおすすめ注目トピックスらび！✨", "今知っておきたい話題をお届けするよっ！"];
    return choices[Math.floor(Math.random() * choices.length)];
}

function getRabiOpinion(category, title) {
    const generics = [
        "これ、今日一番の注目トピックスかもしれないらびっ！✨",
        "らびもこのニュースの続きがとっても気になるよっ！🔍",
        "みんなの投票結果を見て、また色々お話ししたいらび〜！🐰🌈",
        "広場のみんなの賢い意見を聞けるのが楽しみらびっ！✨"
    ];
    return generics[Math.floor(Math.random() * generics.length)];
}

async function postLatestNewsSurveys() {
    const rssNews = await fetchRSSNews();
    const chNews = await fetchChannelNews();
    
    let allNews = [...rssNews, ...chNews].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return Math.random() - 0.5;
    });

    if (allNews.length === 0) {
        console.error('❌ ネタが見つからなかったらび……😰');
        return;
    }

    console.log(`🔍 取得数: RSS(${rssNews.length}) + 2ch(${chNews.length})。バランスよく投稿します！`);

    let postedCount = 0;
    const maxPosts = 5;

    for (const news of allNews) {
        if (postedCount >= maxPosts) break;

        const surveyTitle = news.source === '2chまとめアンテナ' 
            ? `【話題】${news.title} 🔥💬` 
            : `【速報/注目】${news.title} 📡📰`;

        const { data: existing } = await supabase.from('surveys').select('id').eq('title', surveyTitle).limit(1);
        if (existing && existing.length > 0) continue;

        let newsDescription = news.description;
        let ogpInfo = { description: null, image: null, video: null };

        if (!newsDescription || newsDescription.length < 50 || newsDescription.includes('詳細はリンク先をチェック')) {
            console.log(`🔍 OGP取得を試みます: ${news.title}`);
            ogpInfo = await fetchOGPInfo(news.link);
            if (ogpInfo.description) newsDescription = ogpInfo.description;
        } else {
            const basicInfo = await fetchOGPInfo(news.link);
            ogpInfo.image = basicInfo.image;
            ogpInfo.video = basicInfo.video;
        }

        if (!newsDescription || newsDescription.length < 20) {
            console.log(`⏩ 内容不十分のためスキップ: ${news.title}`);
            continue;
        }

        const rabiPoint = getRabiPoint(news.category, news.title);
        const rabiOpinion = getRabiOpinion(news.category, news.title);

        const finalDescription = `📰 **ニュースの概要**\n${newsDescription}\n\n✨ **らびの注目ポイント！**\n・${rabiPoint}\n\n🐰 **らびのひとこと感想**\n${rabiOpinion}\n\n🔗 **詳しく見る（外部サイト）**\n【参考元: ${news.source}】\n${news.link}`;

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        let finalImageUrl = ogpInfo.video || ogpInfo.image || null;

        if (dryRun) {
            console.log(`🧪 [DRY-RUN] ${surveyTitle}`);
            console.log(`🖼️ Image: ${finalImageUrl}`);
            console.log(`📝 Description Preview: ${newsDescription.substring(0, 50)}...`);
        } else {
            const { data: surveyData, error: surveyError } = await supabase.from('surveys').insert([{
                title: surveyTitle,
                description: finalDescription,
                category: news.category,
                image_url: finalImageUrl,
                created_at: new Date().toISOString(),
                deadline: deadline.toISOString(),
                is_official: true
            }]).select();

            if (surveyError) {
                console.error('❌ アンケート作成失敗:', surveyError.message);
                continue;
            }

            const surveyId = surveyData[0].id;
            const options = ["非常に関心がある", "少し気になる", "今のところ静観", "詳しく調べたい"];
            await supabase.from('options').insert(
                options.map(opt => ({
                    survey_id: surveyId,
                    name: opt,
                    votes: 0
                }))
            );

            const comment = `${getLabiGreeting()} 『${news.title}』(${news.source}) \n\n${getLabiImpression(news.category, news.title)} みんなはどう思うかな？ 詳しい内容は解説文エリアのリンクもチェックしてみてね。らびと一緒に話そうらび！ 🐰🛡🥇🏆`;

            await supabase.from('comments').insert([{
                survey_id: surveyId,
                user_name: "らび🐰 (AI)",
                content: comment,
                created_at: new Date().toISOString()
            }]);
        }

        console.log(`🚀 [${news.category}] 「${surveyTitle}」 を投稿しました！`);
        postedCount++;
    }

    console.log(`🏁 今回の自動投稿（計${postedCount}件）が無事に完了したらびっ！🥕✨🥇🏆`);
}

const dryRun = process.argv.includes('--dry-run');
if (dryRun) console.log('🧪 ドライラン（検証モード）実行中...');

postLatestNewsSurveys().catch(console.error);
