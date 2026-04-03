const axios = require('axios');
const fs = require('fs');
const path = require('path');

// auto_latest_news.cjs から関数を擬似的にインポートらび！
const scriptPath = path.join(__dirname, 'auto_latest_news.cjs');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 直接実行できるように一部を抽出
function stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
}

function generateTags(title, description, category) {
    const text = (title + ' ' + (description || ''));
    const tags = [category];
    const sourceMatch = title.match(/[（\(](.*?)[）\)]$/);
    if (sourceMatch) tags.push(sourceMatch[1]);
    const keywordDictionary = {
        '経済': ['経済', '投資', '証券', '暗号資産', '仮想通貨', 'ビットコイン', '金融', '取引所', '改定', '追加'],
        'テクノロジー': ['AI', '最新', 'ガジェット', 'iPhone', 'スマートフォン', 'OS', 'アップデート', '発表', '発売'],
        '社会': ['事件', '事故', '政治', '裁判', '逮捕', '検討', '指針'],
    };
    for (const [tag, words] of Object.entries(keywordDictionary)) {
        words.forEach(w => { if (text.includes(w)) tags.push(tag); });
    }
    return [...new Set(tags)].filter(t => t);
}

// テスト実行！
const testTitle = "暗号資産トレジャリー企業、TOPIXに新規追加せず——JPX要領改定(NADA NEWS)";
const testDesc = "日本取引所グループ（JPX）は、暗号資産を保有する企業のTOPIX採用を見送る方針を固めました。要領改定により...";
const testCat = "ニュース";

console.log("--- 🧪 タグ生成テスト ---");
console.log("Title:", testTitle);
const tags = generateTags(testTitle, testDesc, testCat);
console.log("Resulting Tags:", tags);

if (tags.includes('経済') && tags.includes('NADA NEWS') && tags.includes('ニュース')) {
    console.log("✅ テスト成功らびっ！ 完璧なタグが作れるようになってるよ！");
} else {
    console.log("❌ まだ足りないみたいらび…");
}
