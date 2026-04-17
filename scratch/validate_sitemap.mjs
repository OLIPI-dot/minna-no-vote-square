const fs = require('fs');
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');

try {
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser();
    let jsonObj = parser.parse(sitemap);
    console.log('✅ XML is valid.');
    console.log('Count:', jsonObj.urlset.url.length);
} catch (e) {
    console.error('❌ XML Parsing error:', e.message);
}
