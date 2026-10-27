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
const SITE_URL = 'https://www.minna-no-vote-square.com';

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

// 🌸 [[SUMMARY: ...]] のJSONを綺麗にパースして自然な要約文を生成するらび！
const formatCleanSummary = (rawDesc, title) => {
    if (!rawDesc) {
        return `「${title || 'アンケート'}」についてみんなの意見や投票結果をリアルタイム公開中！`;
    }

    let text = '';
    if (rawDesc.includes('[[SUMMARY:')) {
        try {
            const match = rawDesc.match(/\[\[SUMMARY:\s*([\s\S]*?)\s*\]\]/);
            if (match && match[1]) {
                const json = JSON.parse(match[1]);
                const parts = [];
                if (json.point1_desc) parts.push(json.point1_desc);
                if (json.point2_desc) parts.push(json.point2_desc);
                if (json.rabi_comment) parts.push(json.point2_desc ? json.rabi_comment : json.rabi_comment);
                text = parts.join(' ').trim();
            }
        } catch (e) {
            // JSONパース失敗時も正規表現で安全に本文を救出
        }
        if (!text) {
            const p1 = rawDesc.match(/"point1_desc"\s*:\s*"([^"]+)"/);
            const p2 = rawDesc.match(/"point2_desc"\s*:\s*"([^"]+)"/);
            const rabi = rawDesc.match(/"rabi_comment"\s*:\s*"([^"]+)"/);
            const parts = [p1 && p1[1], p2 && p2[1], rabi && rabi[1]].filter(Boolean);
            text = parts.length > 0
                ? parts.join(' ').trim()
                : rawDesc.replace(/\[\[SUMMARY:[\s\S]*?(\]\]|$)/g, '').trim();
        }
    } else {
        text = rawDesc;
    }

    text = text
        .replace(/<[^>]*>?/gm, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/[#*`_~]/g, '')
        .replace(/（出典：.*?）/g, '')
        .replace(/【続きを読む】/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) {
        return `「${title || 'アンケート'}」についてみんなの投票結果や意見をチェック！`;
    }

    return text.length > 200 ? text.substring(0, 200) + '...' : text;
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
            const cleanDesc = formatCleanSummary(survey.description, survey.title);
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
