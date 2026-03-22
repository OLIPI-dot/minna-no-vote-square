const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// fetchSurveys の finally ブロックを確認し、強化する
content = content.replace(
    /\} finally \{[\s\S]+?setIsLoading\(false\);[\s\S]+?\}/,
    `} finally {
      console.log('🔄 fetchSurveys finished (setIsLoading -> false)');
      setIsLoading(false); 
    }`
);

// また、mount 時の isLoading の初期値を false にする（フェッチが走れば true になるので、フリーズを防ぐ）
content = content.replace(
    /const \[isLoading, setIsLoading\] = useState\(true\);/,
    "const [isLoading, setIsLoading] = useState(false);"
);

// 更に、fetchSurveys の最初で確実に true にする
content = content.replace(
    /if \(!silent\) setIsLoading\(true\);/,
    "if (!silent) { console.log('⏳ fetchSurveys starting (setIsLoading -> true)'); setIsLoading(true); }"
);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx Load state reinforced and failsafe added!');
