const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. fetchSurveys 内のマージロジックを極限まで堅牢にする
// 既存の setCurrentSurvey(prev => { ... }) ブロックを丸ごと置換
const newSetCurrentSurvey = `
      setCurrentSurvey(prev => {
        if (!prev) return null;
        const sid = String(prev.id);
        const lastUpdate = manualUpdatesRef.current[sid];
        const latest = updatedList.find(s => String(s.id) === sid);
        
        if (!latest) return prev;

        // 🛡️ 超重要ガード：もし手動更新から10秒以内なら、DBの値が古く（0等）ても無視する
        if (lastUpdate && Date.now() - lastUpdate < 10000) {
          return prev; 
        }

        // 🛡️ バックアップガード：もし最新データで likes_count が 0 になっているが、
        // 既存のステートでは 1 以上あり、かつまだ「いいね済」リストに入っているなら、
        // DB側の反映遅延と考えて 0 での上書きを防ぐ。
        const isStillLiked = likedSurveys.some(id => String(id) === sid);
        let finalLikes = latest.likes_count;
        if (finalLikes === 0 && prev.likes_count > 0 && isStillLiked) {
           finalLikes = prev.likes_count;
        }

        return { ...latest, likes_count: finalLikes };
      });
`;

// 正規表現で対象の setCurrentSurvey 呼び出し箇所を探して置換
content = content.replace(/setCurrentSurvey\(prev => \{[\s\S]+?\}\);[\s\S]+?setSurveys/m, newSetCurrentSurvey + "\n\n      setSurveys");

// 2. setSurveys のマッピングでも同様の保護をかける
content = content.replace(/return prevList\.map\(newS => \{[\s\S]+?\}\);/, `return updatedList.map(newS => {
          const sid = String(newS.id);
          const lastUpdate = manualUpdatesRef.current[sid];
          const prevS = prevList.find(s => String(s.id) === sid);

          if (lastUpdate && Date.now() - lastUpdate < 10000 && prevS) {
            return prevS;
          }
          
          // 一覧側でも同様の 0 上書き防止を適用
          const isStillLiked = likedSurveys.some(id => String(id) === sid);
          let finalLikes = newS.likes_count;
          if (finalLikes === 0 && prevS && prevS.likes_count > 0 && isStillLiked) {
            finalLikes = prevS.likes_count;
          }
          
          return { ...newS, likes_count: finalLikes };
        });`);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx reinforced with Atomic Merge Protection!');
