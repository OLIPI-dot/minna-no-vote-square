const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// fetchSurveys 関数の内容を抽出して置換。ブラケットの整合性を強制的に正す。
// 注意: この置換は非常に慎重に行う必要がある。
// まず、誤った位置にある閉じブラケットを削除し、正しい位置（最後に）に配置する。

// 1236-1237行目付近にある、tryとif(surveyIds)を閉じてしまっているブラケットを特定して削除
// (これらは isActuallyAdmin の前に存在している)
content = content.replace(
    /\s+console\.log\('📊 fetchSurveys voteMap \[diag\]:', voteMap\);[\s\S]+?\}\s+\}\s+\}\s+\}\s+\/\/ 👑 管理者チェック/,
    (match) => {
        // 余分な閉じブラケット } } } } を削除して // 👑 へ繋ぐ
        // 中身の options 同期ロジックなどは生かしたまま
        return match.replace(/\}\s+\}\s+\}\s+\}/, '}'); // 必要な分だけ残す、あるいは後で調整
    }
);

// ... というか、もっと確実にやるために、マーカーを使って置換する。

// 1. fetchSurveys の開始から catch の直前までを抽出し、構文を整理する
// (泥臭いけど、確実なのは文字列結合)

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed early brackets in App.jsx (First Pass)');
