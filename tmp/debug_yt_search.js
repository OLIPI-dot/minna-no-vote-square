const axios = require('axios');
const fs = require('fs');

async function debugSearch() {
    const title = '首相訪米 トランプ氏の出方焦点';
    const searchQuery = encodeURIComponent(`${title} ニュース公式`);
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    console.log(`Searching: ${searchUrl}`);
    const searchRes = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });

    fs.writeFileSync('youtube_search_debug.html', searchRes.data);
    
    const videoDataList = searchRes.data.match(/\{"videoId":"[^"]+","title":\{"runs":\[\{"text":"[^"]+"\}\]\}[^\}]+\}/g);
    console.log('Found videoDataList length:', videoDataList ? videoDataList.length : 'null');
    
    if (videoDataList) {
        videoDataList.slice(0, 3).forEach((v, i) => console.log(`[${i}] ${v.substring(0, 100)}...`));
    } else {
        const simpleMatches = searchRes.data.match(/"videoId":"([^"]+)"/g);
        console.log('Simple matches length:', simpleMatches ? simpleMatches.length : 'null');
    }
}

debugSearch();
