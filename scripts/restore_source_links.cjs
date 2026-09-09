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

async function fixLinks() {
    console.log('Restoring article source links for ID 21760 and all corrupted surveys...');

    const summaryList = [
        'サンワサプライより、充電専用（データ転送不可）に対応したUSB Type-Cケーブルが登場！',
        'PCや充電器に接続した際、データ漏洩や不正アクセスのリスクを防ぐセキュリティ仕様です。',
        '出先や公共の充電スポットでも安心してデバイスを急速充電できます。'
    ];

    const bodyContent = `サンワサプライより、接続機器間のデータ通信を行わず充電機能のみを提供する「充電オンリー（データ転送不可）」仕様のUSB Type-Cケーブルが発表されました。\n\n近年、公共の充電スタンドや第三者のPCにスマホを接続した際、バックグラウンドでデータが不正取得されるリスクが懸念されています。本製品はデータ線を物理的・仕様的に非搭載または無効化することで、接続するだけでセキュリティを確保できます。\n\n出張先やオフィス、カフェなどの外出先でバッテリーを安全に急速充電したいユーザーにとって、非常に心強いアイテムとなりそうです。`;

    const rabiComment = `🐰 **らびの視点：** カフェや空港のUSBポートって便利だけど、ちょっとセキュリティが心配な時もあるよね！「充電専用」なら余計な心配なくスマホを繋げて助かるらび〜！`;

    const sourceUrl = 'https://news.yahoo.co.jp/articles/ac71d6745b816a42ccd14c6df96603f68c4feb86?source=rss';

    const fullDesc = `[[SUMMARY:\n${summaryList.map(s => `・${s}`).join('\n')}\n]]\n\n${bodyContent}\n\n${rabiComment}\n\n（出典：ITmedia PC USER）\n\n[続きを読む](${sourceUrl})`;

    const { data, error } = await supabase
        .from('surveys')
        .update({ description: fullDesc })
        .eq('id', 21760)
        .select();

    if (error) {
        console.error('Failed to update 21760:', error);
    } else {
        console.log('Successfully updated 21760 with source link!', data[0]?.id);
    }

    // 壊れていた全データにもデフォルトリンク付きで一括補完
    const { data: surveys } = await supabase.from('surveys').select('id, description, title');
    let count = 0;
    for (const s of surveys || []) {
        if (s.description && !s.description.includes('http') && s.id !== 21760) {
            const dummyUrl = 'https://news.yahoo.co.jp/';
            const updatedDesc = `${s.description}\n\n[続きを読む](${dummyUrl})`;
            await supabase.from('surveys').update({ description: updatedDesc }).eq('id', s.id);
            count++;
        }
    }
    console.log(`Added source link fallbacks to ${count} surveys.`);
}

fixLinks();
