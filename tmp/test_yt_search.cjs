const axios = require('axios');

async function searchYouTubeVideo(title) {
    try {
        console.log(`🔍 YouTube検索中: ${title}`);
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
        const res = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = res.data;
        
        // 動画IDを抽出 (watch?v=XXXXXXXXXXX)
        // 最初の11桁のIDを取得
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (match && match[1]) {
            console.log(`✅ 検索成功: ${match[1]}`);
            return match[1];
        }
        console.log('❌ 動画が見つかりませんでした。');
        return null;
    } catch (e) {
        console.error('⚠️ 検索エラー:', e.message);
        return null;
    }
}

// テスト実行
const testTitles = [
    "松村沙友理 赤ちゃん YouTube",
    "ブループロトコル ニュース",
    "NHK ニュース 速報"
];

(async () => {
    for (const t of testTitles) {
        await searchYouTubeVideo(t);
    }
})();
