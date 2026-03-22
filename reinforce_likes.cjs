const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. fetchSurveys の select クエリを明示的にする（*, likes_count, view_count を重ねて指定）
content = content.replace(
    /from\('surveys'\)\.select\('\*, is_official'\)/g,
    "from('surveys').select('*, likes_count, view_count, is_official')"
);

// 2. loadFromUrl の select も同様
content = content.replace(
    /from\('surveys'\)\.select\('\*'\)\.eq\('id', surveyId\)/g,
    "from('surveys').select('*, likes_count, view_count').eq('id', surveyId)"
);

// 3. マッピング処理で likes_count を確実に拾うように強化
content = content.replace(
    /comment_count: s\.comment_count \|\| 0/g,
    "comment_count: s.comment_count || 0,\n          likes_count: s.likes_count || 0,\n          view_count: s.view_count || 0"
);

// 4. setCurrentSurvey でのマージをより慎重にする（likes_count が 0 になっても old を優先しない設定だが、デバッグ用に）
content = content.replace(
    /return latest \? \{ \.\.\.latest \} : prev;/g,
    "if (!latest) return prev;\n        console.log(`💎 [UPDATE_DETAIL] id:${latest.id} likes:${latest.likes_count} (prev was:${prev.likes_count})`);\n        return { ...latest };"
);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx reinforced with explicit columns and logging!');
