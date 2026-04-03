const axios = require('axios');
const fs = require('fs');
const path = require('path');

function stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

/**
 * 🗳️ 感情豊かな選択肢の生成テスト
 */
function generateOptions(category, title, description) {
    const text = (title + ' ' + (description || '')).toLowerCase();
    if (category === 'エンタメ' || category === '話題' || text.includes('楽しみ') || text.includes('期待')) {
        return ['楽しみ！・期待してる', '気になる・見てみたい', 'あまり興味ない', '正直、微妙…'];
    }
    if (text.includes('驚き') || text.includes('衝撃') || text.includes('逮捕') || text.includes('事件')) {
        return ['これは驚いた！', 'ひどすぎる・許せない', 'ショック…・残念', '自分には関係ないかな'];
    }
    if (category === 'ニュース' || text.includes('検討') || text.includes('導入')) {
        return ['賛成・良いと思う', '反対・良くないと思う', 'どちらとも言えない', 'もっと詳しく知りたい'];
    }
    return ['賛成・良いと思う', '微妙・う〜ん…', 'とりあえず考えない', '興味がある・興奮！'];
}

// テスト
const testCases = [
    { cat: 'エンタメ', title: '大原優乃「初めての時代劇」に反響', desc: '時代劇に初挑戦した大原優乃さんのビジュアルが公開され...' },
    { cat: 'ニュース', title: '暗号資産増税、政府が検討開始か', desc: '財務省は暗号資産の課税強化について検討を開始しました...' },
    { cat: '社会', title: '【速報】都内繁華街で爆発事故、3名負傷', desc: '正午ごろ、新宿区内の飲食店でガス爆発とみられる衝撃的な事故が発生...' }
];

console.log("--- 🗳️ 選択肢生成テスト ---");
testCases.forEach(tc => {
    console.log(`[${tc.cat}] ${tc.title}`);
    console.log("Options:", generateOptions(tc.cat, tc.title, tc.desc));
    console.log("---");
});

async function testFetchRichData() {
    console.log("--- 📖 スクレイピングテスト(Yahooニュースなどの想定) ---");
    const testUrl = 'https://news.yahoo.co.jp/rss/topics/top-picks.xml'; // あくまでフィードから1つURLを抜く
    try {
        const res = await axios.get('https://news.yahoo.co.jp/');
        const html = res.data;
        const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        const mainParagraphs = pMatches
            .map(m => stripHtml(m[1]))
            .filter(txt => txt.length > 30)
            .slice(0, 3);

        console.log("Fetched Paragraphs Count:", mainParagraphs.length);
        console.log("First Paragraph Snippet:", mainParagraphs[0]?.substring(0, 50) + "...");
    } catch (e) {
        console.log("Fetch Error:", e.message);
    }
}

testFetchRichData();
