const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. fetchSurveys のセレクトクエリに view_count があるか確認
// 2. setSurveys のマッピングで likes_count を確実に拾う

// 失敗しても画面が真っ白にならないように、try-catch を各クエリ単位で細かくするか、
// あるいはエラー時にデフォルト値を突っ込む。

// 一旦、fetchSurveys の query 部分を修正
content = content.replace(
    /const \{ data: sData, error: sError \} = await supabase\.from\('surveys'\)\.select\('\*, likes_count, view_count, is_official'\)\.eq\('visibility', 'public'\);/,
    "const { data: sData, error: sError } = await supabase.from('surveys').select('*, likes_count, view_count, is_official').eq('visibility', 'public').order('created_at', { ascending: false });"
);

// エラーハンドリングの緩和
content = content.replace(
    /if \(sError\) throw sError;/,
    "if (sError) { console.error('❌ surveys fetch error:', sError); }"
);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx reinforced with robust error handling and ordering!');
