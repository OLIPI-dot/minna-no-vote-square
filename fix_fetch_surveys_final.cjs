const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

const newFetchSurveys = `  const fetchSurveys = async (currentUser, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // アンケート本体（解説文も念のため含めておくらび！）
      const { data: sData, error: sError } = await supabase.from('surveys').select('*, likes_count, view_count, is_official').eq('visibility', 'public');
      if (sError) throw sError;

      // ログイン中なら自分の非公開/限定公開アンケートも取得
      let mine = [];
      if (currentUser) {
        let query = supabase.from('surveys').select('*').neq('visibility', 'public');
        if (!isAdmin) {
          query = query.eq('user_id', currentUser.id);
        }
        const { data: mData } = await query;
        if (mData) mine = mData;
      }

      const allSurveys = [...(sData || []), ...mine];

      // 投票数は表示分だけ一括取得してマージ（Mapで高速化らび！）
      const surveyIds = allSurveys.map(s => s.id);
      const voteMap = {};
      if (surveyIds.length > 0) {
        const oData = [];
        const CHUNK_SIZE = 200;
        for (let i = 0; i < surveyIds.length; i += CHUNK_SIZE) {
          const chunk = surveyIds.slice(i, i + CHUNK_SIZE);
          const { data: chunkData, error: chunkErr } = await supabase
            .from('options')
            .select('id, survey_id, votes')
            .in('survey_id', chunk);
          if (chunkData) oData.push(...chunkData);
        }

        if (oData.length > 0) {
          oData.forEach(o => {
            const sid = String(o.survey_id);
            voteMap[sid] = (voteMap[sid] || 0) + (o.votes || 0);
          });
          
          if (view === 'details' && currentSurvey) {
            const sid = String(currentSurvey.id);
            if (voteMap[sid] !== undefined) {
              setTotalVotes(prev => prev); // 更新トリガー
            }
          }
        }

        if (view === 'details' && currentSurvey) {
          const lastUpdate = manualUpdatesRef.current[currentSurvey.id];
          if (!lastUpdate || Date.now() - lastUpdate >= 10000) {
            // options の最新化は別途 fetchSurveys 内部で行う必要があればここで
          }
        }
      }
      
      const isActuallyAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email);

      if (allSurveys.length > 0) {
        const updatedList = allSurveys.map(s => {
          let isOfficialPattern = s.is_official === true;
          const isLegacy = new Date(s.created_at) < new Date('2026-03-19T00:00:00Z');
          if (!isOfficialPattern && isLegacy) {
            const hasOfficialTag = s.tags && s.tags.some(tag => ['お知らせ', 'ニュース', '話題', '速報', '注目', '2chまとめアンテナ'].includes(tag));
            const hasOfficialTitle = s.title && /^(【.*?】|「.*?」)/.test(s.title);
            if (hasOfficialTag || hasOfficialTitle) isOfficialPattern = true;
          }
          return {
            ...s,
            is_official: isOfficialPattern,
            total_votes: voteMap[String(s.id)] || 0,
            comment_count: s.comment_count || 0,
            likes_count: s.likes_count || 0,
            view_count: s.view_count || 0
          };
        });

        setCurrentSurvey(prev => {
          if (!prev) return null;
          const sid = String(prev.id);
          const lastUpdate = manualUpdatesRef.current[sid];
          const latest = updatedList.find(s => String(s.id) === sid);
          if (!latest) return prev;
          if (lastUpdate && Date.now() - lastUpdate < 10000) return prev; 

          const isStillLiked = likedSurveys.some(id => String(id) === sid);
          let finalLikes = latest.likes_count;
          if (finalLikes === 0 && prev.likes_count > 0 && isStillLiked) finalLikes = prev.likes_count;
          return { ...latest, likes_count: finalLikes };
        });

        setSurveys(prevList => {
          return updatedList.map(newS => {
            const sid = String(newS.id);
            const lastUpdate = manualUpdatesRef.current[sid];
            const prevS = prevList.find(s => String(s.id) === sid);
            if (lastUpdate && Date.now() - lastUpdate < 10000 && prevS) return prevS;
            
            const isStillLiked = likedSurveys.some(id => String(id) === sid);
            let finalLikes = newS.likes_count;
            if (finalLikes === 0 && prevS && prevS.likes_count > 0 && isStillLiked) finalLikes = prevS.likes_count;
            return { ...newS, likes_count: finalLikes };
          });
        });
      } else {
        setSurveys([]);
      }
    } catch (error) {
      console.error('❌ fetchSurveys 失敗:', error.message);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };`;

// fetchSurveys 関数を丸ごと入れ替える
const startTag = '  const fetchSurveys = async (currentUser, silent = false) => {';
const endTag = '  const refreshSidebar = async () => {'; // その次の関数の開始を目印にする

const startIndex = content.indexOf(startTag);
const endIndex = content.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    fs.writeFileSync(path, head + newFetchSurveys + "\n\n" + tail, 'utf8');
    console.log('fetchSurveys RECONSTRUCTED successfully!');
} else {
    console.error('Could not find markers for fetchSurveys replacement.');
}
