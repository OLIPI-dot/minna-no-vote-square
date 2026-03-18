const axios = require('axios');

async function testSearch(title) {
    console.log(`\n🔍 Test Search for: "${title}"`);
    const searchQuery = encodeURIComponent(`${title} ニュース公式`);
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    try {
        const searchRes = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        const dataMatch = searchRes.data.match(/var ytInitialData = (\{.*?\});/);
        const ytData = dataMatch ? JSON.parse(dataMatch[1]) : null;

        if (ytData && ytData.contents) {
            const contents = ytData.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
            
            for (const item of contents) {
                const video = item.videoRenderer;
                if (video && video.videoId) {
                    const vid = video.videoId;
                    const vTitle = video.title.runs[0].text;
                    const ngWords = ['LIVE', 'ライブ', '配信中', '生放送', '予告', 'Upcoming'];
                    const isNG = ngWords.some(word => vTitle.includes(word));
                    
                    if (!isNG) {
                        console.log(`✅ Found: "${vTitle}" (ID: ${vid})`);
                        return;
                    } else {
                        console.log(`⏩ Skip (NG): "${vTitle}"`);
                    }
                }
            }
        }
        console.log('❌ No valid video found.');
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

async function runTests() {
    await testSearch('首相訪米 トランプ氏の出方焦点');
    await testSearch('イラン 米との緊張緩和案を拒否');
    await testSearch('米テロ対策トップ辞任 戦争不支持');
}

runTests();
