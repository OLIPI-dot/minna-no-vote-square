const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 本文が実質空かどうかを判定
function isBodyMissing(desc) {
    if (!desc) return true;
    // SUMMARY/らびコメント/出典/リンクを除いた「本文」部分を抽出
    let body = desc
        .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')
        .replace(/🐰 \*\*らびの視点：\*\*[\s\S]*?(?=\n\n|$)/, '')
        .replace(/[\(（]\s*出典\s*[:：][^\)）\n]+[\)）]?/gi, '')
        .replace(/\[続き[をに]読む\]\(https?:\/\/[^\s)]+\)/g, '')
        .replace(/https?:\/\/[^\s)]+/g, '')
        .replace(/続き[をに]読む/g, '')
        .replace(/マイページ[\s\S]*?JavaScriptが無効になっています/g, '')
        .replace(/マイページ[\s\S]*?トピックス一覧/g, '')
        .trim();

    // 空 or 30文字未満なら本文欠損とみなす
    return body.length < 30;
}

// タイトルから綺麗な解説テキストを生成
function generateBody(title) {
    const cleanTitle = title
        .replace(/\([^)]+\)$/, '')
        .replace(/（[^）]+）$/, '')
        .trim();

    const summaryList = [
        `『${cleanTitle}』に関する注目のニュース・トピックスです。`,
        '話題の最新動向について、みんなの意見や考えを共有しましょう。',
        '選択肢からあなたの考えに最も近いものを選んで投票に参加してください！'
    ];

    const bodyContent = `本アンケートは『${cleanTitle}』のニュースをテーマに作成されています。\n\n話題の最新動向や社会的な関心について、みなさんのご意見を募集しています。下の選択肢よりあなたの考えを選んで投票に参加してみてください！`;

    const rabiComment = `🐰 **らびの視点：** この話題、みんなはどう捉えているのかな？ぜひ投票して教えてほしいらび！`;

    return { summaryList, bodyContent, rabiComment };
}

async function fixAll() {
    console.log('=== 本文欠損アンケート 全件修復スクリプト ===');

    // 全件取得（1000件ずつ）
    let allSurveys = [];
    let from = 0;
    const batchSize = 1000;
    while (true) {
        const { data, error } = await supabase
            .from('surveys')
            .select('id, title, description')
            .range(from, from + batchSize - 1);
        if (error) { console.error('Fetch error:', error); break; }
        if (!data || data.length === 0) break;
        allSurveys = allSurveys.concat(data);
        if (data.length < batchSize) break;
        from += batchSize;
    }

    console.log(`Total surveys: ${allSurveys.length}`);

    let fixCount = 0;
    for (const s of allSurveys) {
        if (isBodyMissing(s.description)) {
            const { summaryList, bodyContent, rabiComment } = generateBody(s.title);

            // 既存の出典・リンクを保持
            const existingSource = s.description?.match(/[\(（]\s*出典\s*[:：]([^\)）\n]+)[\)）]?/i);
            const existingLink = s.description?.match(/https?:\/\/[^\s)]+/);

            const summaryBlock = `[[SUMMARY:\n${summaryList.map(x => `・${x}`).join('\n')}\n]]`;

            let newDesc = `${summaryBlock}\n\n${rabiComment}\n\n${bodyContent}`;

            if (existingSource) {
                newDesc += `\n\n（出典：${existingSource[1].trim()}）`;
            }
            if (existingLink) {
                newDesc += `\n\n${existingLink[0]}`;
            }

            const { error: updateErr } = await supabase
                .from('surveys')
                .update({ description: newDesc })
                .eq('id', s.id);

            if (updateErr) {
                console.error(`Failed ID ${s.id}:`, updateErr);
            } else {
                fixCount++;
                if (fixCount % 20 === 0) {
                    console.log(`[${fixCount}] Fixed ID ${s.id}: "${s.title.substring(0, 30)}..."`);
                }
            }
        }
    }

    console.log(`\n🎉 Complete! Fixed ${fixCount} surveys with missing body text.`);
}

fixAll();
