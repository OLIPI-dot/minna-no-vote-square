const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

const summaryList = [
    'サンワサプライより、充電専用（データ転送不可）に対応したUSB Type-Cケーブルが登場！',
    'PCや充電器に接続した際、データ漏洩や不正アクセスのリスクを防ぐセキュリティ仕様です。',
    '出先や公共の充電スポットでも安心してデバイスを急速充電できます。'
];

const bodyContent = `サンワサプライより、接続機器間のデータ通信を行わず充電機能のみを提供する「充電オンリー（データ転送不可）」仕様のUSB Type-Cケーブルが発表されました。\n\n近年、公共の充電スタンドや第三者のPCにスマホを接続した際、バックグラウンドでデータが不正取得されるリスクが懸念されています。本製品はデータ線を物理的・仕様的に非搭載または無効化することで、接続するだけでセキュリティを確保できます。\n\n出張先やオフィス、カフェなどの外出先でバッテリーを安全に急速充電したいユーザーにとって、非常に心強いアイテムとなりそうです。`;

const rabiComment = `🐰 **らびの視点：** カフェや空港のUSBポートって便利だけど、ちょっとセキュリティが心配な時もあるよね！「充電専用」なら余計な心配なくスマホを繋げて助かるらび〜！`;

const newDesc = `[[SUMMARY:\n${summaryList.map(s => `・${s}`).join('\n')}\n]]\n\n${bodyContent}\n\n${rabiComment}`;

async function main() {
    console.log('Target ID: 21760');

    // まずID 21760を検索
    const { data: target, error: fetchErr } = await supabase
        .from('surveys')
        .select('id, title')
        .or('id.eq.21760,id.eq."21760"');

    console.log('Search result:', target, fetchErr);

    const { error: updateErr } = await supabase
        .from('surveys')
        .update({ description: newDesc })
        .eq('id', 21760);

    if (updateErr) {
        console.error('Update error:', updateErr);
    } else {
        console.log('Updated successfully!');
    }

    // 結果確認
    const { data: updated } = await supabase
        .from('surveys')
        .select('id, title, description')
        .eq('id', 21760)
        .single();

    console.log('Updated Description:\n', updated ? updated.description : 'Not found');
}

main();
