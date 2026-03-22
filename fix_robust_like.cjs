const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// handleLikeSurvey を完全に書き換える
const newHandleLikeSurvey = `
  const handleLikeSurvey = async () => {
    if (!currentSurvey) return;
    const targetId = currentSurvey.id;
    const sid = String(targetId);
    
    // 現在の状態をチェック
    const isAlreadyLiked = likedSurveys.some(id => String(id) === sid);
    const diff = isAlreadyLiked ? -1 : 1;
    
    console.log(\`👍 [LIKE_START] surveyId: \${sid}, isAlreadyLiked: \${isAlreadyLiked}\`);

    // 1. 楽観的UI更新（ステートに即時反映）
    const updateStats = (prev) => {
      if (!prev || String(prev.id) !== sid) return prev;
      return { ...prev, likes_count: Math.max(0, (prev.likes_count || 0) + diff) };
    };
    
    setCurrentSurvey(prev => updateStats(prev));
    const mapper = s => String(s.id) === sid ? updateStats(s) : s;
    setSurveys(prev => prev.map(mapper));
    setPopularSurveys(prev => prev.map(mapper));

    // 2. ローカルストレージ（既読状態）の更新
    const newLikedIds = isAlreadyLiked
      ? likedSurveys.filter(id => String(id) !== sid)
      : [...likedSurveys, sid];
    setLikedSurveys(newLikedIds);
    localStorage.setItem('liked_surveys', JSON.stringify(newLikedIds));

    // 3. 🛡️ ガード: DBからの同期による上書きを10秒間防ぐ
    manualUpdatesRef.current[sid] = Date.now();

    // 4. DB更新 (RPC)
    try {
      const { error } = await supabase.rpc('increment_survey_like', {
        survey_id: targetId,
        increment_val: diff
      });
      if (error) {
        console.error('❌ increment_survey_like RPC Error:', error);
        // エラー時はガードを解除して同期させる
        delete manualUpdatesRef.current[sid];
      } else {
        console.log('✅ increment_survey_like RPC Success');
      }
    } catch (err) {
      console.error('🔥 [FATAL] handleLikeSurvey RPC Crash:', err);
    }
  };
`;

// 既存の handleLikeSurvey を検索して置換
const startToken = "const handleLikeSurvey = async () => {";
const endToken = "const toggleWatch = (e, id) => {";

const startIndex = content.indexOf(startToken);
const endIndex = content.indexOf(endToken);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + newHandleLikeSurvey + "\n  " + content.substring(endIndex);
    console.log('handleLikeSurvey replaced successfully!');
} else {
    console.error('Could not find handleLikeSurvey blocks to replace!');
}

// VIEW_COOLDOWN_MS を 30秒 に短縮する（動作確認をしやすくするため）
content = content.replace(/const VIEW_COOLDOWN_MS = 600000;/g, "const VIEW_COOLDOWN_MS = 30000;");

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx updated with robust like/view logic!');
