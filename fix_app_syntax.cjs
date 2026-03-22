const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// incrementView を async にする（6つのスペースインデントに注意）
content = content.replace("      const incrementView = () => {", "      const incrementView = async () => {");

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx syntax fixed (incrementView is now async)!');
