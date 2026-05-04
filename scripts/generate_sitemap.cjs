const fs = require('fs');
const path = require('path');

// 環境変数の取得
const getEnv = (key) => {
    if (process.env[key]) return process.env[key];
    let envFile = '';
    const locations = [
        path.join(__dirname, '../.env.local'),
        path.join(__dirname, '../.env'),
        path.join(__dirname, '.env.local'),
        path.join(__dirname, '.env')
    ];
    for (const loc of locations) {
        if (fs.existsSync(loc)) {
            envFile = fs.readFileSync(loc, 'utf8');
            const match = envFile.split('\n').find(line => line.trim().startsWith(`${key}=`));
            if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const SITE_URL = 'https://minna-no-vote-square.vercel.app';

const escapeXml = (unsafe) => {
    return (unsafe || '').replace(/[<>&"']/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
        }
    });
};

// 🧼 XML1.0で許容されない制御文字を削ぎ落とすらび！✨
const sanitizeXml = (str) => {
    return (str || '').replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, '');
};

if (!url || !key) {
    console.error('Environment variables missing!');
    process.exit(1);
}

async function generateSitemap() {
    try {
        console.log('探検開始！アンケートの道しるべ（サイトマップ）を作るよ！🐰🗺️');
        const res = await fetch(`${url}/rest/v1/surveys?visibility=eq.public&select=id,created_at`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        if (!res.ok) {
            console.error('アンケートの取得に失敗したらび…', await res.text());
            return;
        }

        const surveys = await res.json();
        console.log(`✅ ${surveys.length} 件のアンケートを見つけたよ！`);

        const now = new Date().toISOString().split('T')[0];
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        xml += '  <!-- メインページ -->\n';
        xml += `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        xml += '  <!-- 静的コンテンツ -->\n';
        xml += `  <url>\n    <loc>${SITE_URL}/about.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.8</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${SITE_URL}/contact.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${SITE_URL}/terms.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.3</priority>\n  </url>\n`;
        xml += `  <url>\n    <loc>${SITE_URL}/privacy.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.3</priority>\n  </url>\n`;


        surveys.forEach(survey => {
            try {
                const date = new Date(survey.created_at).toISOString().split('T')[0];
                xml += `  <url>\n    <loc>${SITE_URL}/s/${survey.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
            } catch (e) {
                console.warn(`⚠️ アンケートID ${survey.id} の処理をスキップらび:`, e.message);
            }
        });

        xml += `</urlset>`;

        const outputPath = path.join(__dirname, '../public/sitemap.xml');
        fs.writeFileSync(outputPath, xml, 'utf8');
        console.log(`✨ サイトマップが完成したよ！場所: ${outputPath} 🐰🥕`);
    } catch (err) {
        console.error('💥 サイトマップ作成中に致命的なエラーが発生したらび…', err);
    }
}

generateSitemap().catch(console.error);
