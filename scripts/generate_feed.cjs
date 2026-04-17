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

async function generateFeed() {
    try {
        console.log('🚀 Atomフィード（最新ニュース特急便）を生成するらびっ！！');
        // 最新50件を取得
        const res = await fetch(`${url}/rest/v1/surveys?visibility=eq.public&select=id,title,description,created_at&order=created_at.desc&limit=50`, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        if (!res.ok) {
            console.error('フィード用のデータ取得に失敗したらび…', await res.text());
            return;
        }

        const surveys = await res.json();
        const now = new Date().toISOString();

        let atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>みんなのアンケート広場 - 最新ニュースアンケート</title>
  <subtitle>みんなの本音が集まる広場。最新のトレンドやニュースについてアンケート実施中！</subtitle>
  <link href="${SITE_URL}/atom.xml" rel="self"/>
  <link href="${SITE_URL}/"/>
  <updated>${now}</updated>
  <id>${SITE_URL}/</id>
  <author>
    <name>守護霊らび</name>
  </author>\n`;

        surveys.forEach(survey => {
            const date = new Date(survey.created_at).toISOString();
            const cleanDesc = (survey.description || '').replace(/<[^>]*>?/gm, '').substring(0, 200) + '...';
            atom += `  <entry>
    <title>${escapeXml(sanitizeXml(survey.title))}</title>
    <link href="${SITE_URL}/s/${survey.id}"/>
    <id>${SITE_URL}/s/${survey.id}</id>
    <updated>${date}</updated>
    <summary>${escapeXml(sanitizeXml(cleanDesc))}</summary>
  </entry>\n`;
        });

        atom += `</feed>`;

        const outputPath = path.join(__dirname, '../public/atom.xml');
        fs.writeFileSync(outputPath, atom, 'utf8');
        console.log(`✨ Atomフィードが完成したよ！場所: ${outputPath} 🐰🛰️`);
    } catch (err) {
        console.error('💥 フィード作成中にエラーが発生したらび…', err);
    }
}

generateFeed().catch(console.error);
