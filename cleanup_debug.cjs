const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. デバッグログの削除
content = content.replace(/console\.log\(\`👍 \[LIKE_START\] [\s\S]+?\`\);/g, "");
content = content.replace(/else console\.log\('✅ increment_survey_like RPC Success'\);/g, "");
content = content.replace(/else console\.log\('✅ increment_survey_view RPC Success'\);/g, "");
content = content.replace(/console\.log\(\`🛡️ \[FETCH\] Guarding currentSurvey [\s\S]+?\`\);/g, "");

// 2. クールダウンを 1分 (60000ms) に設定
content = content.replace(/const VIEW_COOLDOWN_MS = 30000;/g, "const VIEW_COOLDOWN_MS = 60000;");

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx cleaned up and finalized!');
