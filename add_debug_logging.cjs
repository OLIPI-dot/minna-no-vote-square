const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// ログ出力ポイントを追加
content = content.replace(
    /const filteredBaseSurveys = useMemo\(\(\) => \{/,
    "const filteredBaseSurveys = useMemo(() => {\n    console.log('🔍 [filteredBaseSurveys] Input Surveys Count:', surveys.length);"
);

content = content.replace(
    /return base;/,
    "console.log('🔍 [filteredBaseSurveys] Final Count:', base.length, 'SortMode:', sortMode, 'Filter:', filterCategory);\n    return base;"
);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx reinforced with diagnostic logs!');
