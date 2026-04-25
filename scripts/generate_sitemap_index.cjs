const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://minna-no-vote-square.vercel.app';

async function generateSitemapIndex() {
    try {
        console.log('🏗️ サイトマップ・インデックス（道しるべの親玉）を作るよ！🐰🏰');
        const now = new Date().toISOString();
        
        // 通常のsitemap.xmlをこれに置き換えるらび！
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap_surveys_v2.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

        const outputPath = path.join(__dirname, '../public/sitemap.xml');
        fs.writeFileSync(outputPath, xml);
        console.log(`✨ サイトマップ・インデックスが完成したよ！場所: ${outputPath} 🐰🔱`);
    } catch (err) {
        console.error('💥 インデックス作成中にエラーが発生したらび…', err);
    }
}

generateSitemapIndex().catch(console.error);
