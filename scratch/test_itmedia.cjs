const axios = require('axios');
const cheerio = require('cheerio');

function extractMainContent(html) {
    if (!html) return { mainText: '', paragraphs: [] };
    const $ = cheerio.load(html);

    $('aside, footer, header, nav, iframe, script, style, noscript, svg, form').remove();
    $('.related-articles, .related_articles, .recommend-box, .recommend, .ad-container, .ad, .sidebar, .menu, .tags-list, .category-list, .sns-share, .comments-area, .comment-box, .author-profile').remove();
    $('[class*="related"], [class*="recommend"], [class*="banner"], [class*="footer"], [class*="header"]').remove();

    let $body = $('article');
    if ($body.length === 0) $body = $('[class*="articleBody"], [class*="article-body"], [class*="entry-content"], main');
    if ($body.length === 0) $body = $('body');

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

async function run() {
    try {
        const url = 'https://www.itmedia.co.jp/news/articles/2409/24/news122.html'; // Example ITmedia URL
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const { mainText, paragraphs } = extractMainContent(res.data);
        console.log('Extracted length:', mainText.length);
        console.log('First 200 chars:', mainText.substring(0, 200));
        console.log('Paragraphs count:', paragraphs.length);
    } catch (e) {
        console.error(e);
    }
}
run();
