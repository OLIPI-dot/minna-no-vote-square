const fs = require('fs');
const path = require('path');

const getEnv = (key) => {
    const localEnv = path.join(__dirname, '../.env.local');
    if (fs.existsSync(localEnv)) {
        const lines = fs.readFileSync(localEnv, 'utf8').split('\n');
        for (const line of lines) {
            if (line.trim().startsWith(`${key}=`)) {
                return line.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
            }
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

const summaryList = [
    'サンワサプライより、充電専用（データ転送不可）に対応したUSB Type-Cケーブルが登場！',
    'PCや充電器に接続した際、データ漏洩や不正アクセスのリスクを防ぐセキュリティ仕様です。',
    '出先や公共の充電スポットでも安心してデバイスを急速充電できます。'
];

const bodyContent = `サンワサプライより、接続機器間のデータ通信を行わず充電機能のみを提供する「充電オンリー（データ転送不可）」仕様のUSB Type-Cケーブルが発表されました。\n\n近年、公共の充電スタンドや第三者のPCにスマホを接続した際、バックグラウンドでデータが不正取得されるリスクが懸念されています。本製品はデータ線を物理的・仕様的に非搭載または無効化することで、接続するだけでセキュリティを確保できます。\n\n出張先やオフィス、カフェなどの外出先でバッテリーを安全に急速充電したいユーザーにとって、非常に心強いアイテムとなりそうです。`;

const rabiComment = `🐰 **らびの視点：** カフェや空港のUSBポートって便利だけど、ちょっとセキュリティが心配な時もあるよね！「充電専用」なら余計な心配なくスマホを繋げて助かるらび〜！`;

const newDesc = `[[SUMMARY:\n${summaryList.map(s => `・${s}`).join('\n')}\n]]\n\n${bodyContent}\n\n${rabiComment}`;

async function main() {
    console.log('PATCH REST API で ID 21760 を更新中...');
    const res = await fetch(`${url}/rest/v1/surveys?id=eq.21760`, {
        method: 'PATCH',
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            description: newDesc
        })
    });

    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response:', data);
}

main().catch(console.error);
