const fs = require('fs');
let css = fs.readFileSync('src/App.css', 'utf8');
const badTextStart = '/* 広告が読み込まれたらプレースホルダー(応援ボタン)を隠す魔法✨ */';
const idx = css.indexOf(badTextStart);
if(idx !== -1) {
    css = css.substring(0, idx);
}
css += `/* 広告が読み込まれたらプレースホルダー(応援ボタン)を隠す魔法✨ */\n.adsense-container-wrapper:has(ins[data-ad-status="unfilled"]) .ads-placeholder {\n  display: flex !important;\n}\n.adsense-container-wrapper:has(ins[data-ad-status="filled"]) .ads-placeholder {\n  display: none !important;\n}\n`;
fs.writeFileSync('src/App.css', css);
console.log('Fixed CSS syntax');
