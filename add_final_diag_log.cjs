const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 診断ログの追加
content = content.replace(
    /const latest = updatedList\.find\(s => String\(s\.id\) === sid\);/g,
    "const latest = updatedList.find(s => String(s.id) === sid);\n        if (latest) console.log(`🔍 [DIAG] Setting currentSurvey [${sid}]: likes_count=${latest.likes_count}, title=${latest.title.substring(0,10)}...`);"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Diagnostic logging added to fetchSurveys!');
