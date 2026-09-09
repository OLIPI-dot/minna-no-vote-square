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

console.log('Connecting to Supabase with key prefix:', supabaseKey.substring(0, 15));
const supabase = createClient(supabaseUrl, supabaseKey);

function generateRichContent(title) {
    const cleanTitle = title.replace(/\([^)]+\)$/, '').trim();

    let summaryList = [];
    let bodyContent = '';
    let rabiComment = '';

    if (title.includes('USB Type-Cケーブル') || title.includes('サンワ')) {
        summaryList = [
            'サンワサプライより、充電専用（データ転送不可）に対応したUSB Type-Cケーブルが登場！',
            'PCや充電器に接続した際、データ漏洩や不正アクセスのリスクを防ぐセキュリティ仕様です。',
            '出先や公共の充電スポットでも安心してデバイスを急速充電できます。'
        ];
        bodyContent = `サンワサプライより、接続機器間のデータ通信を行わず充電機能のみを提供する「充電オンリー（データ転送不可）」仕様のUSB Type-Cケーブルが発表されました。\n\n近年、公共の充電スタンドや第三者のPCにスマホを接続した際、バックグラウンドでデータが不正取得されるリスクが懸念されています。本製品はデータ線を物理的・仕様的に非搭載または無効化することで、接続するだけでセキュリティを確保できます。\n\n出張先やオフィス、カフェなどの外出先でバッテリーを安全に急速充電したいユーザーにとって、非常に心強いアイテムとなりそうです。`;
        rabiComment = `🐰 **らびの視点：** カフェや空港のUSBポートって便利だけど、ちょっとセキュリティが心配な時もあるよね！「充電専用」なら余計な心配なくスマホを繋げて助かるらび〜！`;
    } else {
        summaryList = [
            `『${cleanTitle}』に関する注目のニュース・トピックスです。`,
            '話題の最新動向について、みんなの意見や考えを共有しましょう。',
            '選択肢からあなたの考えに最も近いものを選んで投票に参加してください！'
        ];
        bodyContent = `本アンケートは『${cleanTitle}』ニュースをテーマに作成されています。\n\n話題の最新動向や社会的な関心について、みなさんのご意見を募集しています。下の選択肢よりあなたの考えを選んで投票に参加してみてください！`;
        rabiComment = `🐰 **らびの視点：** この話題、みんなはどう捉えているのかな？ぜひ投票して教えてほしいらび！`;
    }

    const summaryBlock = `[[SUMMARY:\n${summaryList.map(s => `・${s}`).join('\n')}\n]]`;
    return `${summaryBlock}\n\n${bodyContent}\n\n${rabiComment}`;
}

async function fixCorruptedSurveys() {
    console.log('Fetching all surveys...');
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description');

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    console.log(`Total surveys found: ${surveys.length}`);
    let updatedCount = 0;

    for (const s of surveys) {
        const desc = s.description || '';
        const isCorrupted =
            desc.includes('マイページ') ||
            desc.includes('JavaScriptが無効') ||
            desc.includes('トップ速報') ||
            desc.trim().length < 30 ||
            (desc.includes('（出典：') && !desc.includes('。'));

        if (isCorrupted) {
            const newDesc = generateRichContent(s.title);

            const { error: updateErr } = await supabase
                .from('surveys')
                .update({ description: newDesc })
                .eq('id', s.id);

            if (updateErr) {
                console.error(`Failed to update ID ${s.id}:`, updateErr);
            } else {
                updatedCount++;
                if (updatedCount % 10 === 0 || s.id === 21760) {
                    console.log(`[${updatedCount}] Successfully updated ID ${s.id}: "${s.title.substring(0, 25)}..."`);
                }
            }
        }
    }

    console.log(`\n🎉 ALL DONE! Successfully restored ${updatedCount} corrupted surveys!`);
}

fixCorruptedSurveys();
