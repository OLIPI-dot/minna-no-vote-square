const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. fetchSurveys の後にあった useEffect と refreshSidebar をまとめて削除
// 1223行目から1279行目あたりまで（refreshSidebar定義を含む）
content = content.replace(
    /\s+useEffect\(\(\) => \{[\s\S]+?return \(\) => supabase\.removeChannel\(ch\);[\s\S]+?\}, \[user\]\);[\s\S]+?const refreshSidebar = async \(\) => \{[\s\S]+?setEndingSoonSurveys[\s\S]+?\}\s+\};[\s\S]+?useEffect\(\(\) => \{ refreshSidebar\(\); \}, \[\]\);/,
    `
  // 📡 グローバルな変更を監視（頻度を極限まで抑えるらび！）
  useEffect(() => {
    fetchSurveys(user);
    const ch = supabase.channel('global-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'surveys' }, () => fetchSurveys(user, true))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);`
);

// 2. refreshSidebar で使っていたステート更新を useMemo に置き換える
// liveSurveys, popularSurveys, endingSoonSurveys の useState は残っているので、
// それらを計算する useMemo を追加する。

content = content.replace(
    /const \[endingSoonSurveys, setEndingSoonSurveys\] = useState\(\[\]\);/,
    "const [endingSoonSurveys, setEndingSoonSurveys] = useState([]);"
);

// 既存の recommendedSurveys などの近くに sidebar 用の計算を追加
content = content.replace(
    /\/\/ 💎 あなたへのおすすめ[\s\S]+?\}, \[surveys\]\);/,
    `// 💎 あなたへのおすすめ（高スコアな数件）
  const recommendedSurveys = useMemo(() => {
    return [...surveys]
      .filter(s => s.visibility === 'public')
      .sort((a, b) => {
        const scoreA = (a.total_votes || 0) * SCORE_VOTE_WEIGHT + (a.view_count || 0);
        const scoreB = (b.total_votes || 0) * SCORE_VOTE_WEIGHT + (b.view_count || 0);
        return scoreB - scoreA;
      })
      .slice(0, 12);
  }, [surveys]);

  // 📡 サイドバー用の派生データ（DBリクエストを節約するためにステートから計算！）
  const { liveSurveys_derived, popularSurveys_derived, endingSoonSurveys_derived } = useMemo(() => {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const regular = surveys.filter(s => s.visibility === 'public' && !s.tags?.includes('お知らせ'));

    return {
      liveSurveys_derived: [...regular].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10),
      popularSurveys_derived: [...regular].sort((a, b) => {
        const scoreA = (a.total_votes || 0) * SCORE_VOTE_WEIGHT + (a.view_count || 0);
        const scoreB = (b.total_votes || 0) * SCORE_VOTE_WEIGHT + (b.view_count || 0);
        return scoreB - scoreA;
      }).slice(0, 10),
      endingSoonSurveys_derived: [...regular]
        .filter(s => s.deadline && new Date(s.deadline) > now && new Date(s.deadline) <= next24h)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    };
  }, [surveys]);`
);

// 3. JSX内の Sidebar コンポーネントで参照先を _derived に変える
content = content.replace(/liveSurveys\.map/g, "liveSurveys_derived.map");
content = content.replace(/endingSoonSurveys\.length/g, "endingSoonSurveys_derived.length");
content = content.replace(/\(showAllEndingSoon \? endingSoonSurveys : endingSoonSurveys\.slice\(0, 4\)\)/g, "(showAllEndingSoon ? endingSoonSurveys_derived : endingSoonSurveys_derived.slice(0, 4))");
content = content.replace(/popularSurveys\.map/g, "popularSurveys_derived.map");

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx EMERGENCY LOAD REDUCTION APPLIED!');
