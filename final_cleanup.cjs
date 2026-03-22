const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. sortMode の初期値を 'new' に戻す
content = content.replace(
    /const \[sortMode, setSortMode\] = useState\('today'\); \/\/ デフォルトを今日のものに変更らび！/,
    "const [sortMode, setSortMode] = useState('new');"
);

// 2. 診断ログ（🔍）を削除する
content = content.replace(/console\.log\('🔍 \[filteredBaseSurveys\] Input Surveys Count:', surveys\.length\);/g, "");
content = content.replace(/console\.log\('🔍 \[filteredBaseSurveys\] Final Count:', base\.length, 'SortMode:', sortMode, 'Filter:', filterCategory\);/g, "");

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx is now CLEAN and CORRECT! Carrot 🥕');
