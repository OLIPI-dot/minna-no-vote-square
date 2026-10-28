import React from 'react';
import GachaMiniGame from './GachaMiniGame';
import BattleMiniGame from './BattleMiniGame';
import RecommendedSection from './RecommendedSection';
import TrendingHeadline from './TrendingHeadline';
import CategoryEyecatch from './CategoryEyecatch';

const SurveyListView = ({
  searchQuery, setSearchQuery,
  sortMode, setSortMode,
  popularMode, setPopularMode,
  filterCategory, setFilterCategory,
  filterTag, setFilterTag,
  setView,
  activeTab, setActiveTab,
  filteredBaseSurveys,
  surveys,
  currentPage, setCurrentPage,
  navigateTo,
  watchedIds, toggleWatch,
  CATEGORY_ICON_STYLE,
  SCORE_VOTE_WEIGHT,
  formatWithDay,
  Pagination,
  SiteConceptSection,
  AdSenseBox,
  user, isAdmin,
  isLoading,
  totalVotes,
  surveyTitle, setSurveyTitle,
  surveyDescription, setSurveyDescription,
  surveyYoutube, setSurveyYoutube,
  surveyCategory, setSurveyCategory,
  setupOptions, setSetupOptions,
  tempOption, setTempOption,
  surveyVisibility, setSurveyVisibility,
  deadline, setDeadline,
  surveyTags, setSurveyTags,
  tempTag, setTempTag,
  handleStartSurvey,
  totalOfficialCount,
  totalUserCount,
  totalMineCount,
  recommendedSurveys,
  debouncedSearchQuery,
  searchStats = { categories: {}, official: 0, user: 0 },
  popularSurveys = [],
  supabase,
  baseCategories = [],
  filterCategories = [],
  viewMode, setViewMode,
  equipment, setEquipment,
  userExp, addExp, levelInfo,
  globalOnlineCount,
  onRefresh
}) => {
  const [brokenImages, setBrokenImages] = React.useState(new Set());
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const ITEMS_PER_PAGE = viewMode === 'grid' ? 40 : 20;
  const listRef = React.useRef(null);
  const [copyStatus, setCopyStatus] = React.useState('📜 タイトルをコピー');

  // 🕒 投稿日時の相対表示（○分前／○時間前／月日）
  const formatCreatedTime = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'たった今';
    const diffM = Math.floor(diffMs / (60 * 1000));
    const diffH = Math.floor(diffMs / (60 * 60 * 1000));

    if (diffM < 1) return 'たった今';
    if (diffM < 60) return `${diffM}分前`;
    if (diffH < 24) return `${diffH}時間前`;
    return date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });
  };

  // ✨ 最新ホヤホヤ判定（6時間以内）
  const isBrandNew = (dateStr) => {
    if (!dateStr) return false;
    const now = new Date();
    const date = new Date(dateStr);
    const diffHours = (now.getTime() - date.getTime()) / (60 * 60 * 1000);
    return diffHours >= 0 && diffHours < 6;
  };

  // ⚡ アンケート本文・AI要約から「タイトルと被らないチラ見せフック（問いかけ＋踏み込んだ要点）」を抽出するらび！
  const extractSurveyTeaser = (s) => {
    if (!s || !s.description) return null;
    if (s.tags?.includes('お知らせ') && s.title?.includes('||')) {
      const announceBody = s.title.split('||')[1]?.trim();
      return announceBody ? { hook: 'お知らせ：', text: announceBody } : null;
    }
    const desc = String(s.description);
    const summaryMatch = desc.match(/\[\[SUMMARY:([\s\S]*?)\]\]/);
    if (summaryMatch) {
      try {
        const parsed = JSON.parse(summaryMatch[1].trim());
        const stripCount = (v) => typeof v === 'string'
          ? v.replace(/\s*[（(]\s*\d+\s*(?:文字|字)\s*[）)]/g, '').trim()
          : '';
        // 1段落目(point1)はタイトルの繰り返しになりやすいため、問いかけ(survey_question)や2段落目(point2)を優先！
        let hook = stripCount(parsed.survey_question) || stripCount(parsed.point2_title) || stripCount(parsed.point1_title) || '';
        let text = stripCount(parsed.point2_desc) || stripCount(parsed.rabi_comment) || stripCount(parsed.point1_desc) || '';
        if (hook && text.startsWith(hook)) {
          text = text.substring(hook.length).replace(/^[:：\s]+/, '').trim();
        }
        if (hook || text) return { hook, text };
      } catch (e) {
        // fallback below
      }
    }
    // 一般投稿などSUMMARY JSONがない場合のフォールバック
    const cleanText = desc
      .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')
      .replace(/\[\[SECRET_ANSWER:[\s\S]*?\]\]/g, '')
      .replace(/🐰\s*\*\*らびの視点：\*\*[\s\S]*?(?=\n\n|$)/g, '')
      .replace(/\[([^\]]+)\]\(https?:\/\/[^\s)]+\)/g, '')
      .replace(/https?:\/\/[^\s)]+/g, '')
      .replace(/[\(（]\s*出典[\s\S]*?[\)）]/g, '')
      .replace(/###\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanText.length >= 6) {
      return { hook: '', text: cleanText };
    }
    return null;
  };

  const handleCopyPageTitles = () => {
    if (!surveys || surveys.length === 0) return;
    const titles = surveys.map(s => s.title).join('\n');
    navigator.clipboard.writeText(titles).then(() => {
      setCopyStatus('✅ コピーしました！');
      setTimeout(() => setCopyStatus('📜 タイトルをコピー'), 2000);
    });
  };

  // 🏷️ 話題のタグ：直近7日間で2本以上のアンケートについたタグを多い順に集計するらび！
  const [trendingTags, setTrendingTags] = React.useState([]);
  React.useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('surveys')
      .select('tags, total_votes, view_count')
      .eq('visibility', 'public')
      .gte('created_at', since)
      .limit(1000)
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const count = {};
        const score = {};
        data.forEach(s => {
          [...new Set(s.tags || [])].forEach(t => {
            if (!t || t === 'お知らせ') return;
            count[t] = (count[t] || 0) + 1;
            score[t] = (score[t] || 0) + (s.total_votes || 0) * 2 + (s.view_count || 0) * 0.1;
          });
        });
        const tags = Object.keys(count)
          .filter(t => count[t] >= 2)
          .sort((a, b) => (count[b] - count[a]) || (score[b] - score[a]))
          .slice(0, 14);
        setTrendingTags(tags);
      });
    return () => { cancelled = true; };
  }, [supabase]);

  // 選択中のタグが一覧にないときは、解除できるよう先頭に残すらび
  const displayTags = React.useMemo(() => (
    filterTag && !trendingTags.includes(filterTag) ? [filterTag, ...trendingTags] : trendingTags
  ), [trendingTags, filterTag]);

  // ⚡ useMemoによりソート・フィルタの計算結果をキャッシュ化。filter/sortはレンダーのたびに実行されず、必要な時だけ実行される。
  const trendingHeadlineSurveys = React.useMemo(() => {
    const sourceSurveys = (popularSurveys && popularSurveys.length > 0) ? popularSurveys : surveys;
    if (!sourceSurveys || sourceSurveys.length === 0) return [];
    const now = new Date();
    return [...sourceSurveys]
      .filter(s => !s.tags?.includes('お知らせ')) // お知らせは除外
      .filter(s => !s.deadline || new Date(s.deadline) > now) // 終了済み(受付終了)を除外
      .sort((a, b) => {
        const safeViewsA = Math.max(a.view_count || 0, a.total_votes > 0 ? a.total_votes * 3 + 12 : 0);
        const safeViewsB = Math.max(b.view_count || 0, b.total_votes > 0 ? b.total_votes * 3 + 12 : 0);
        const scoreA = (a.total_votes || 0) * 10 + safeViewsA;
        const scoreB = (b.total_votes || 0) * 10 + safeViewsB;
        return scoreB - scoreA;
      })
      .slice(0, 5); // 上位5件をピックアップ
  }, [surveys, popularSurveys]);

  // ⚡ サーバー側でフィルタ済みの surveys を受け取り、クライアント側で確実にソート計算を適用するらび！
  const finalItems = React.useMemo(() => {
    let list = [...surveys];
    if (sortMode === 'popular') {
      const calcTotalScore = (item) => {
        const votes = Number(item.total_votes || 0);
        const views = Number(item.view_count || item.views || 0);
        const likes = Number(item.likes_count || item.likes || 0);
        return (votes * 10) + (likes * 5) + views;
      };
      const calcTrendingScore = (item) => {
        const votes = Number(item.total_votes || 0);
        const views = Number(item.view_count || item.views || 0);
        return (votes * 5) + views;
      };

      if (popularMode === 'score') {
        list.sort((a, b) => calcTotalScore(b) - calcTotalScore(a));
      } else if (popularMode === 'trending') {
        list.sort((a, b) => calcTrendingScore(b) - calcTrendingScore(a));
      } else if (popularMode === 'views') {
        list.sort((a, b) => {
          const viewsA = Number(a.view_count || a.views || 0);
          const viewsB = Number(b.view_count || b.views || 0);
          return viewsB - viewsA;
        });
      } else if (popularMode === 'votes') {
        list.sort((a, b) => Number(b.total_votes || 0) - Number(a.total_votes || 0));
      }
    } else if (sortMode === 'watching') {
      // ⭐ ウォッチ中: 「受付中」を上、「終了（締切後3日以内）」を下に並べるらび！
      const now = new Date();
      list.sort((a, b) => {
        const endedA = a.deadline && new Date(a.deadline) < now ? 1 : 0;
        const endedB = b.deadline && new Date(b.deadline) < now ? 1 : 0;
        if (endedA !== endedB) return endedA - endedB;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    return list;
  }, [surveys, debouncedSearchQuery, filterTag, activeTab, sortMode, popularMode]);

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const redirectUrl = window.location.origin;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });
      if (error) {
        console.error('Google login error:', error);
        alert('ログイン開始エラーが発生しました:\n' + error.message);
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error('Google login exception:', err);
      alert('エラーが発生しました:\n' + (err.message || String(err)));
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      {/* 🔐 認証ヘッダー */}
      <div className="auth-header">
        {user ? (
          <div className="user-info">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                className="user-avatar"
                alt={`${user.user_metadata?.full_name || 'ユーザー'}さんのアバター`}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <button
              className="logout-button"
              onClick={() => {
                if (window.confirm('ログアウトしますか？')) {
                  supabase.auth.signOut();
                }
              }}
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="google-login-btn"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            style={isLoggingIn ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            <div className="google-icon-wrapper">
              <svg viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z" />
                <path fill="#34A853" d="M16.04 18.013c-1.09.693-2.43 1.077-4.04 1.077-3.327 0-6.14-2.223-7.141-5.226L.833 17.03c1.98 3.86 5.989 6.511 10.655 6.511 2.872 0 5.48-.95 7.554-2.54l-3.003-2.988z" />
                <path fill="#4285F4" d="M22.027 12.188c0-.627-.052-1.245-.152-1.841H12v3.481h5.624c-.244 1.314-1 2.428-2.112 3.179l3.003 2.988c1.758-1.623 2.774-4.009 2.774-6.807z" />
                <path fill="#FBBC05" d="M5.266 14.235A7.065 7.065 0 0 1 4.909 12c0-.795.131-1.559.357-2.235L1.24 6.65c-.792 1.636-1.24 3.46-1.24 5.35 0 1.89.448 3.714 1.24 5.35l4.026-3.115z" />
              </svg>
            </div>
            <span>{isLoggingIn ? '🔄 Googleへ接続中...' : 'Googleでログイン'}</span>
          </button>
        )}
      </div>

      <button
        className="create-new-button"
        onClick={() => user ? setView('create') : alert("🌟 広場をもっと楽しもう！\n\nアンケートを作るには、ログインが必要だよ。上の「Googleでログイン」から、らびと一緒に始めよう！🐰🥕")}
      >＋ 新しいアンケートを作る</button>

      {!user && <SiteConceptSection totalVotes={totalVotes} onLogin={handleGoogleLogin} />}

      {/* 🔍 検索 */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 アンケートを検索する..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="search-input"
          aria-label="アンケートを検索"
        />
        {searchQuery && (
          <button
            className="search-clear"
            onClick={() => setSearchQuery('')}
            title="検索をクリア"
            aria-label="検索内容をクリア"
          >
            ✕
          </button>
        )}
      </div>

      {/* 📌 タブ切り替え */}
      <div className="tab-switcher">
        <button className={sortMode === 'today' ? 'active' : ''} onClick={() => { setSortMode('today'); if (typeof setCurrentPage === 'function') setCurrentPage(1); }}>☀️ 今日の話題 {searchQuery && (searchStats?.sortModes?.today || 0) > 0 && <span className="tab-hit-badge">{searchStats.sortModes.today}</span>}</button>
        <button className={sortMode === 'latest' ? 'active' : ''} onClick={() => { setSortMode('latest'); if (typeof setCurrentPage === 'function') setCurrentPage(1); }}>🆕 新着順 {searchQuery && (searchStats?.sortModes?.latest || 0) > 0 && <span className="tab-hit-badge">{searchStats.sortModes.latest}</span>}</button>
        <button className={sortMode === 'popular' ? 'active' : ''} onClick={() => { setSortMode('popular'); if (typeof setCurrentPage === 'function') setCurrentPage(1); }}>🔥 人気 {searchQuery && (searchStats?.sortModes?.popular || 0) > 0 && <span className="tab-hit-badge">{searchStats.sortModes.popular}</span>}</button>
        <button className={sortMode === 'watching' ? 'active' : ''} onClick={() => { setSortMode('watching'); if (typeof setCurrentPage === 'function') setCurrentPage(1); }}>⭐ ウォッチ中 {watchedIds.length > 0 && <span className="tab-hit-badge">{watchedIds.length}</span>}</button>
        <button className={sortMode === 'ended' ? 'active' : ''} onClick={() => { setSortMode('ended'); if (typeof setCurrentPage === 'function') setCurrentPage(1); }}>📁 アーカイブ {searchQuery && (searchStats?.sortModes?.ended || 0) > 0 && <span className="tab-hit-badge">{searchStats.sortModes.ended}</span>}</button>
        <button
          className={sortMode === 'mine' ? 'active' : ''}
          onClick={() => {
            if (!user) return alert("👤 マイページはログインしていないと使えません🙇‍♀️\n上の「Googleでログイン」ボタンからログインしてね！");
            setSortMode('mine');
            if (typeof setCurrentPage === 'function') setCurrentPage(1);
          }}
        >👤 マイページ</button>

      </div>

      {sortMode === 'popular' && (
        <div className="popular-sub-tabs">
          <button className={popularMode === 'trending' ? 'active' : ''} onClick={() => setPopularMode('trending')}>🔥 盛り上がり</button>
          <button className={popularMode === 'score' ? 'active' : ''} onClick={() => setPopularMode('score')}>⚡ 総合</button>
          <button className={popularMode === 'votes' ? 'active' : ''} onClick={() => setPopularMode('votes')}>🗳️ 投票人気</button>
          <button className={popularMode === 'views' ? 'active' : ''} onClick={() => setPopularMode('views')}>👁️ 閲覧人気</button>
        </div>
      )}

      {/* 🚥 カテゴリフィルターバー (横スクロール) */}
      <div className="category-filter-bar" style={{
        display: 'flex', overflowX: 'auto', gap: '15px', padding: '15px 10px',
        marginBottom: '20px', WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x proximity', borderBottom: '1px solid #f1f5f9'
      }}>
        {filterCategories.map(cat => (
          <button
            key={cat}
            style={{
              background: filterCategory === cat ? (CATEGORY_ICON_STYLE[cat]?.color || '#8b5cf6') : 'white',
              border: filterCategory === cat ? 'none' : '1px solid #e2e8f0',
              padding: filterCategory === cat ? '12px 24px' : '10px 20px',
              minWidth: 'max-content', flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '6px', borderRadius: '20px',
              cursor: 'pointer', fontFamily: 'inherit',
              fontSize: filterCategory === cat ? '1rem' : '0.85rem',
              fontWeight: filterCategory === cat ? '900' : '700',
              color: filterCategory === cat ? '#fff' : '#64748b',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: filterCategory === cat ? `0 10px 25px ${(CATEGORY_ICON_STYLE[cat]?.color || '#8b5cf6')}44` : 'none',
              transform: filterCategory === cat ? 'scale(1.05)' : 'scale(1)',
              whiteSpace: 'nowrap', scrollSnapAlign: 'center'
            }}
            onClick={() => {
              setFilterCategory(cat);
              setFilterTag('');
              if (typeof setCurrentPage === 'function') setCurrentPage(1);
              setView('list');
              const url = new URL(window.location.href);
              if (cat && cat !== 'すべて') url.searchParams.set('c', cat);
              else url.searchParams.delete('c');
              url.searchParams.delete('t');
              url.searchParams.delete('s');
              url.searchParams.delete('page');
              window.history.pushState({ view: 'list' }, '', url);
            }}
          >
            <span style={{ fontSize: filterCategory === cat ? '1.8rem' : '1.4rem', transition: 'font-size 0.3s' }}>
              {CATEGORY_ICON_STYLE[cat]?.icon || '📁'}
            </span>
            <span style={{ lineHeight: 1.2, position: 'relative' }}>
              {cat}
              {searchStats?.categories[cat] > 0 && (
                <span className="cat-hit-count" style={{
                  position: 'absolute',
                  top: '-18px',
                  right: '-18px',
                  background: filterCategory === cat ? '#fff' : (CATEGORY_ICON_STYLE[cat]?.color || '#8b5cf6'),
                  color: filterCategory === cat ? (CATEGORY_ICON_STYLE[cat]?.color || '#8b5cf6') : '#fff',
                  fontSize: '0.7rem',
                  padding: '1px 5px',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '10px',
                  fontWeight: '900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  zIndex: 2
                }}>{searchStats.categories[cat]}</span>
              )}
            </span>
          </button>
        ))}
        <style>{`
          .category-filter-bar::-webkit-scrollbar { height: 14px; }
          .category-filter-bar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .category-filter-bar::-webkit-scrollbar-thumb { 
            background: #cbd5e1; 
            border-radius: 10px; 
            border: 2px solid #f1f5f9;
            transition: all 0.3s;
          }
          .category-filter-bar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>

      {/* 🏷️ 話題のタグバー（おりぴさんリクエスト）：0件のときは表示しない */}
      {displayTags.length > 0 && (
      <div className="tag-filter-bar" style={{
        display: 'flex', overflowX: 'auto', gap: '10px', padding: '0 10px 16px',
        marginBottom: '5px', WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'x proximity',
        scrollbarWidth: 'thin'
      }}>
        {displayTags.map(tag => (
          <span
            key={tag}
            className={`tag-bubble ${filterTag === tag ? 'active' : ''}`}
            style={{
              cursor: 'pointer',
              padding: '8px 18px',
              borderRadius: '25px',
              fontSize: '0.82rem',
              fontWeight: '900',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              background: filterTag === tag ? 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)' : '#fff',
              color: filterTag === tag ? '#fff' : '#64748b',
              border: filterTag === tag ? 'none' : '1.5px solid #e2e8f0',
              boxShadow: filterTag === tag ? '0 4px 12px rgba(76, 29, 149, 0.25)' : 'none',
              transform: filterTag === tag ? 'scale(1.05)' : 'scale(1)',
              scrollSnapAlign: 'start',
              flex: '0 0 auto'
            }}
            onClick={() => {
              const nextTag = filterTag === tag ? '' : tag;
              setFilterTag(nextTag);
              if (typeof setCurrentPage === 'function') setCurrentPage(1);
              const url = new URL(window.location.href);
              if (nextTag) url.searchParams.set('t', nextTag);
              else url.searchParams.delete('t');
              url.searchParams.delete('c');
              url.searchParams.delete('s');
              url.searchParams.delete('page');
              window.history.pushState({ view: 'list' }, '', url);
            }}
          >
            #{tag}
          </span>
        ))}
        <style>{`
          .tag-filter-bar::-webkit-scrollbar { height: 14px; }
          .tag-filter-bar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
          .tag-filter-bar::-webkit-scrollbar-thumb { 
            background: #cbd5e1; 
            border-radius: 10px; 
            border: 2px solid #f1f5f9;
            transition: all 0.3s;
          }
          .tag-filter-bar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>
      </div>
      )}

      {/* ✨ あなたへのおすすめセクション (検索が確定するまでは表示を維持してガタつきを防ぐらび！) */}
      {!debouncedSearchQuery && !filterTag && filterCategory === 'すべて' && (
        <>
          <TrendingHeadline
            surveys={trendingHeadlineSurveys}
            navigateTo={navigateTo}
          />
          <RecommendedSection
            surveys={recommendedSurveys}
            navigateTo={navigateTo}
          />
        </>
      )}

      {/* ⚖️ 公式・ユーザー切り替えタブ + レイアウト切替（1行統合・スマホ最適化） */}
      <div className="official-tab-navigation" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '16px', borderBottom: '2px solid #f1f5f9', width: '100%', boxSizing: 'border-box', height: '44px', overflow: 'visible' }}>
        {/* 左側：タブ（スマホでも見切れないよう最適化） */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {!['mine', 'watching'].includes(sortMode) ? (
          <>
            <button
              onClick={() => {
                setActiveTab('official');
                if (typeof setCurrentPage === 'function') setCurrentPage(1);
              }}
              className={`tab-btn ${activeTab === 'official' ? 'active' : ''}`}
              style={{
                padding: '4px 6px', fontWeight: 'bold',
                color: activeTab === 'official' ? '#8b5cf6' : '#94a3b8',
                background: 'none', border: 'none',
                borderBottom: activeTab === 'official' ? '3px solid #8b5cf6' : '3px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.75rem',
                display: 'inline-flex', alignItems: 'center', gap: '2px'
              }}
            >
              <span>📢</span>
              <span className="tab-label-full">公式・ニュース</span>
              <span className="tab-label-short">公式</span>
              <span className="tab-count" style={{ fontSize: '0.65rem', opacity: 0.85 }}>({totalOfficialCount})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('user');
                if (typeof setCurrentPage === 'function') setCurrentPage(1);
              }}
              className={`tab-btn ${activeTab === 'user' ? 'active' : ''}`}
              style={{
                padding: '4px 6px', fontWeight: 'bold',
                color: activeTab === 'user' ? '#8b5cf6' : '#94a3b8',
                background: 'none', border: 'none',
                borderBottom: activeTab === 'user' ? '3px solid #8b5cf6' : '3px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.75rem',
                display: 'inline-flex', alignItems: 'center', gap: '2px'
              }}
            >
              <span>👥</span>
              <span className="tab-label-full">みんなの投稿</span>
              <span className="tab-label-short">投稿</span>
              <span className="tab-count" style={{ fontSize: '0.65rem', opacity: 0.85 }}>({totalUserCount})</span>
            </button>
          </>
        ) : (
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', whiteSpace: 'nowrap' }}>
            {sortMode === 'mine' ? '👤 あなたのアンケート' : '⭐ ウォッチ中のアンケート（終了後3日で自動整理）'}
          </div>
        )}
        </div>

        {/* 右側：更新ボタン ＆ レイアウト切替ボタン */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={async () => {
              if (isRefreshing) return;
              setIsRefreshing(true);
              if (onRefresh) {
                await onRefresh();
              }
              setTimeout(() => setIsRefreshing(false), 600);
            }}
            title="最新に更新するらび！"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '4px 6px',
              fontSize: '0.72rem',
              fontWeight: '700',
              color: '#475569',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              transition: 'all 0.2s ease',
              height: '30px',
              boxSizing: 'border-box'
            }}
          >
            <span style={{
              display: 'inline-block',
              transition: 'transform 0.6s ease',
              transform: isRefreshing ? 'rotate(360deg)' : 'none',
              fontSize: '0.85rem'
            }}>🔄</span>
            <span className="refresh-btn-text" style={{ fontSize: '0.68rem' }}>更新</span>
          </button>

          <div className="layout-switcher" style={{ flexShrink: 0 }}>
            <button
              className={`layout-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="リスト表示"
            >
              <svg viewBox="0 0 24 24" width="15" height="15">
                <rect x="3" y="4" width="18" height="2" fill="currentColor" />
                <rect x="3" y="11" width="18" height="2" fill="currentColor" />
                <rect x="3" y="18" width="18" height="2" fill="currentColor" />
              </svg>
            </button>
            <button
              className={`layout-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="グリッド表示"
            >
              <svg viewBox="0 0 24 24" width="15" height="15">
                <rect x="3" y="3" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="13" y="3" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="3" y="13" width="8" height="8" rx="1" fill="currentColor" />
                <rect x="13" y="13" width="8" height="8" rx="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* みんクエ UI（マイページタブ時のみ表示） */}
      {sortMode === 'mine' && (
        <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/*
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px' }}>
              <GachaMiniGame userExp={userExp} addExp={addExp} equipment={equipment} setEquipment={setEquipment} />
            </div>
            <div style={{ flex: '1 1 300px' }}>
              <BattleMiniGame userLevel={levelInfo?.level || 1} equipment={equipment} globalOnlineCount={globalOnlineCount} />
            </div>
          </div>
          */}
          <h2 style={{ fontSize: '1.2rem', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginTop: '20px' }}>📋 過去に作成したアンケート</h2>
        </div>
      )}

      {/* 📋 アンケートリスト */}
      <div className={`survey-list view-${viewMode}`} ref={listRef}>
        {isLoading ? (
          <div className="skeleton-container" style={{ width: '100%', minHeight: '500px' }}>
            {[...Array(15)].map((_, n) => (
              <div key={`skel-${n}`} className="skeleton-card">
                <div className="skeleton skeleton-thumb"></div>
                <div className="skeleton-content">
                  <div className="skeleton skeleton-title"></div>
                  <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
                  <div className="skeleton-meta">
                    <div className="skeleton skeleton-meta-item"></div>
                    <div className="skeleton skeleton-meta-item"></div>
                    <div className="skeleton skeleton-meta-item"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (() => {
          const isMineOrWatching = ['mine', 'watching'].includes(sortMode);
          const countToUse = isMineOrWatching || sortMode === 'popular'
            ? finalItems.length
            : (activeTab === 'official' ? totalOfficialCount : totalUserCount);
          const totalPages = isMineOrWatching || sortMode === 'popular' ? Math.ceil(finalItems.length / ITEMS_PER_PAGE) : Math.ceil(countToUse / ITEMS_PER_PAGE);
          
          let currentItems = sortMode === 'popular' 
            ? finalItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
            : finalItems;

          // 🛡️ ページ番号が大きすぎて空になった場合、自動で1ページ目を再要求・安全ガード
          if (currentItems.length === 0 && currentPage > 1 && (finalItems.length > 0 || countToUse > 0)) {
            if (typeof setCurrentPage === 'function') setCurrentPage(1);
            if (finalItems.length > 0) {
              currentItems = finalItems.slice(0, ITEMS_PER_PAGE);
            }
          }

          if (currentItems.length === 0) {
            if (activeTab === 'user' && !debouncedSearchQuery && !filterCategory) {
              return (
                <div className="empty-state-container" style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', borderRadius: '16px', border: '2px dashed #cbd5e1', margin: '40px 0' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>📝</div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>みんなの投稿はまだありません</h3>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', marginBottom: '32px', lineHeight: '1.7', maxWidth: '400px', margin: '0 auto' }}>
                    あなたの気になる疑問や、みんなに聞いてみたいことを最初のアンケートにして投稿してみませんか？
                  </p>
                  <button 
                    onClick={() => {
                      if (!user) {
                        alert("アンケートを作るにはログインが必要です🐰\n右下のメニューからログインしてね！");
                      } else {
                        if (navigateTo) navigateTo('create');
                      }
                    }}
                    style={{ background: '#8b5cf6', color: 'white', padding: '14px 32px', borderRadius: '50px', fontSize: '1rem', fontWeight: 'bold', border: 'none', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'; }}
                  >
                    ✨ 最初のアンケートを作る
                  </button>
                </div>
              );
            }

            return <div className="empty-msg" style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
              {sortMode === 'mine'
                ? '🐰 まだアンケートを作っていないよ！\n「新しいアンケートを作る」から挑戦してみてね🥕'
                : sortMode === 'watching'
                  ? '🐰 まだウォッチ中のアンケートがないよ！\nアンケートに1票投票するか、カードの「☆」を押すとここに自動保存されて、いつでもその後の結果を見返せるよ🥕'
                  : '該当するアンケートがないよ〜🐰🥕'}
            </div>;
          }

          return (
            <>
              {currentItems.map((s, idx) => {
                const realIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx;
                const isEnded = s.deadline && new Date(s.deadline) < new Date();
                const isPopularRanking = sortMode === 'popular';
                const showScoreBadge = isPopularRanking; // 全てのアンケートにスコアバッジを表示するらび！✨
                let badgeLabel = '';
                if (showScoreBadge) {
                  const votes = Number(s.total_votes || 0);
                  const views = Number(s.view_count || s.views || 0);
                  const likes = Number(s.likes_count || s.likes || 0);

                  const safeViews = Math.max(views, votes > 0 ? votes * 3 + 12 : 0);

                  if (popularMode === 'trending') {
                    badgeLabel = `🔥 ${(votes * 5) + safeViews}`;
                  } else if (popularMode === 'views') {
                    badgeLabel = `👁️ ${safeViews} View`;
                  } else if (popularMode === 'score') {
                    badgeLabel = `⚡ ${(votes * 10) + (likes * 5) + safeViews} pt`;
                  } else {
                    badgeLabel = `🗳️ ${votes} 票`;
                  }
                }

                const catStyle = CATEGORY_ICON_STYLE[s.category] || CATEGORY_ICON_STYLE[s.category?.trim()] || CATEGORY_ICON_STYLE['その他'];

                let thumbSrc = null;
                if (s.image_url && s.image_url !== 'null' && s.image_url !== 'undefined') {
                  const entries = s.image_url.split(',').map(v => v.trim()).filter(Boolean);
                  const yt = entries.find(v => v.startsWith('yt:'));
                  const nico = entries.find(v => v.startsWith('nico:'));
                  if (yt) thumbSrc = `https://img.youtube.com/vi/${yt.substring(3)}/mqdefault.jpg`;
                  else if (nico) {
                    const fullId = nico.substring(5);
                    const numericId = fullId.replace(/^[a-z]+/, '');
                    thumbSrc = `https://nicovideo.cdn.nimg.jp/thumbnails/${numericId}/${numericId}`;
                  }
                  else if (entries[0] && entries[0] !== 'null' && entries[0] !== 'undefined') {
                    thumbSrc = entries[0].replace(/&amp;/g, '&');
                  }
                }

                const isBroken = brokenImages.has(s.id);
                const showFallback = !thumbSrc || isBroken;

                // 💬 ガヤ（コメント）タグを探す
                const commentTag = s.tags?.find(t => String(t).startsWith('comment:'));
                const pickupComment = commentTag ? commentTag.replace('comment:', '') : null;
                const teaser = extractSurveyTeaser(s);

                return (
                  <React.Fragment key={s.id}>
                    <div
                      className={`survey-item-card ${s.tags?.includes('お知らせ') ? 'announcement-card' : ''}`}
                      onClick={() => navigateTo('details', s)}
                      style={s.tags?.includes('お知らせ') ? {
                        background: 'linear-gradient(135deg, #fffbeb, #fff7ed)',
                        border: '2px solid #fbbf24',
                        boxShadow: '0 8px 15px -3px rgba(251, 191, 36, 0.15)',
                        position: 'relative', '--cat-color': '#fbbf24',
                        ...(viewMode === 'list' ? { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '10px', minHeight: '96px' } : {})
                      } : {
                        background: 'white',
                        border: `2px solid ${catStyle.color}44`,
                        '--cat-color': catStyle.color,
                        position: 'relative',
                        ...(viewMode === 'list' ? { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', padding: '10px', minHeight: '96px' } : {})
                      }}
                    >
                      {/* 🛡️ ここがリスト表示のすべてのサムネイル（ニュース画像・YouTube・公式などすべて）を描画する場所です！ */}
                      <div className={`video-thumb-wrapper ${viewMode === 'list' || showFallback ? '' : 'skeleton'}`} style={viewMode === 'list' ? {
                        width: '160px',
                        minWidth: '160px',
                        maxWidth: '160px',
                        height: '90px',
                        minHeight: '90px',
                        maxHeight: '90px',
                        overflow: 'hidden',
                        background: '#f1f5f9',
                        flexShrink: 0,
                        borderRadius: '8px',
                        position: 'relative',
                        display: 'block'
                      } : { position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                        
                        {viewMode !== 'list' && (
                          <div className="category-icon-thumb placeholder-base" style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            background: catStyle.color, opacity: 0.1, zIndex: 0,
                            borderRadius: 'inherit'
                          }} />
                        )}

                        {/* 画像がない場合は、おすすめセクションと同じく Eyecatch を表示 */}
                        {showFallback ? (
                          <CategoryEyecatch category={s.category} />
                        ) : (
                          /* 画像がある場合はおすすめセクションと完全に同一のスタイルを適用 */
                          <img
                            data-debug="pc-news-thumb"
                            src={thumbSrc}
                            alt={`${s.title} のサムネイル`}
                            className="survey-item-thumb"
                            loading={idx < 4 ? "eager" : "lazy"}
                            {...(idx < 4 ? { fetchpriority: "high" } : {})}
                            referrerPolicy="no-referrer"
                            onLoad={e => {
                              e.target.classList.add('ready');
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              setBrokenImages(prev => new Set([...prev, s.id]));
                            }}
                            style={viewMode === 'list' ? {
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block',
                              zIndex: 1
                            } : { position: 'relative', zIndex: 2, display: 'block', width: '100%', height: '100%', objectFit: 'cover', backgroundColor: 'transparent', borderRadius: '8px' }}
                          />
                        )}

                        {/* 💬 ガヤ吹き出しオーバーレイ (リスト表示用) */}
                        {pickupComment && (
                          <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            right: '6px',
                            background: 'rgba(0, 0, 0, 0.75)',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            zIndex: 10,
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            maxWidth: '90%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            💬 {pickupComment}
                          </div>
                        )}

                        {/* カテゴリバッジ */}
                        {true && (
                          <div className="thumb-category-badge" style={{
                            color: catStyle.color,
                            border: `1.5px solid ${catStyle.color}44`,
                            background: 'rgba(255, 255, 255, 0.95)',
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            zIndex: 10,
                            margin: 0
                          }}>
                            <span style={{ fontSize: '1em' }}>{catStyle.icon}</span>
                            <span>{s.category || 'その他'}</span>
                          </div>
                        )}
                      </div>

                      <div className="survey-item-content">
                        {viewMode === 'list' ? (
                          /* ===== リスト表示レイアウト ===== */
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px' }}>
                            {/* 上段：タイトル（flex-1）と☆のみ右側 */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                              <span className="list-item-title" style={{ flex: 1, minWidth: 0, fontWeight: 900, fontSize: '13px', color: '#111827', lineHeight: 1.375, wordBreak: 'break-word' }}>
                                {isPopularRanking && (realIdx === 0 ? '👑 ' : realIdx === 1 ? '🥈 ' : realIdx === 2 ? '🥉 ' : `${realIdx + 1}位 `)}
                                {s.tags?.includes('お知らせ') && s.title.includes('||')
                                  ? s.title.split('||')[0].trim()
                                  : s.title}
                              </span>
                              {/* 右側：☆のみ */}
                              <button
                                className={`watch-star-btn ${watchedIds.some(wId => String(wId) === String(s.id)) ? 'active' : ''}`}
                                onClick={e => toggleWatch(e, s.id)}
                                aria-label={watchedIds.some(wId => String(wId) === String(s.id)) ? "ウォッチリストから削除" : "ウォッチリストに追加"}
                                style={{ flexShrink: 0, background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '2px', lineHeight: 1, color: watchedIds.some(wId => String(wId) === String(s.id)) ? '#f59e0b' : '#94a3b8' }}
                              >{watchedIds.some(wId => String(wId) === String(s.id)) ? '★' : '☆'}</button>
                            </div>
                            {/* ⚡ チラ見せ見出し（PC用：右カラム内に表示） */}
                            {teaser && (
                              <div className="survey-item-teaser-row survey-item-teaser-pc" style={{
                                background: 'linear-gradient(90deg, #faf5ff 0%, #fdf2f8 60%, #fffbeb 100%)',
                                border: '1px solid #e9d5ff',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                minWidth: 0,
                                maxWidth: '100%'
                              }}>
                                <div className="survey-item-teaser-clamp" style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                  color: '#334155',
                                  lineHeight: 1.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word'
                                }}>
                                  <span style={{ marginRight: '3px' }}>💡</span>
                                  {teaser.hook && (
                                    <span style={{
                                      color: '#5b21b6',
                                      fontWeight: 800,
                                      marginRight: '6px'
                                    }}>
                                      {teaser.hook}
                                    </span>
                                  )}
                                  <span>{teaser.text}</span>
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#7c3aed',
                                    marginLeft: '3px'
                                  }}>▸</span>
                                </div>
                              </div>
                            )}
                            {/* 下段：メタ情報（2段レイアウト） */}
                            <div className="list-item-meta-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', minWidth: 0, marginTop: '4px' }}>
                                {/* 1段目（上段）：バッジ類 */}
                                <div className="list-item-meta-upper survey-item-meta-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '5px' }}>
                                  {showScoreBadge && <span className="popular-score-badge">{badgeLabel}</span>}
                                  {isBrandNew(s.created_at) && !isEnded && (
                                    <span style={{
                                      background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                                      color: '#ffffff',
                                      fontSize: '0.62rem',
                                      fontWeight: '900',
                                      padding: '1px 5px',
                                      borderRadius: '6px',
                                      boxShadow: '0 1px 4px rgba(244, 63, 94, 0.35)',
                                      letterSpacing: '0.02em',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      lineHeight: '1.2'
                                    }}>
                                      NEW
                                    </span>
                                  )}
                                  <span className={`status-badge ${isEnded ? 'ended' : 'active'}`}>
                                    {isEnded ? '終了' : '受付中'}
                                  </span>
                                  {typeof window !== 'undefined' && localStorage.getItem(`voted_survey_${s.id}`) && (
                                    <span style={{
                                      background: '#ede9fe',
                                      color: '#6d28d9',
                                      fontSize: '0.62rem',
                                      fontWeight: '800',
                                      padding: '1px 5px',
                                      borderRadius: '6px',
                                      border: '1px solid #ddd6fe',
                                      lineHeight: '1.2'
                                    }}>
                                      ✅投票済
                                    </span>
                                  )}
                                  <span className="survey-item-created-at" title={`作成日時: ${new Date(s.created_at).toLocaleString('ja-JP')}`} style={{
                                    fontWeight: isBrandNew(s.created_at) ? '700' : 'normal',
                                    color: isBrandNew(s.created_at) ? '#0284c7' : undefined
                                  }}>
                                    🐣{formatCreatedTime(s.created_at)}
                                  </span>
                                  {s.deadline && <span className="survey-item-deadline">〆{new Date(s.deadline).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}</span>}
                                </div>
                              {/* 2段目（下段）：リアクション数字類 */}
                              <div className="list-item-meta-lower survey-item-meta-row" style={{ display: 'flex', flexWrap: 'nowrap', whiteSpace: 'nowrap', gap: '8px', minWidth: 0 }}>
                                <span className="survey-item-votes">🗳️{s.total_votes || 0}</span>
                                <span className="survey-item-views">👁️{s.view_count || 0}</span>
                                <span className="survey-item-likes">👍{s.likes_count || 0}</span>
                                <span className="survey-item-comments">💬{s.comment_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* ===== グリッド表示レイアウト（従来通り） ===== */
                          <>
                            <div className="survey-item-info" style={{ width: '100%', minWidth: 0 }}>
                              <span className="survey-item-title" style={{ backgroundColor: 'transparent', padding: '0', borderRadius: '0', display: 'block', marginBottom: '4px', boxShadow: 'none', border: 'none', color: '#333' }}>
                                {isPopularRanking && (realIdx === 0 ? '👑 ' : realIdx === 1 ? '🥈 ' : realIdx === 2 ? '🥉 ' : `${realIdx + 1}位 `)}
                                {s.tags?.includes('お知らせ') && s.title.includes('||')
                                  ? s.title.split('||')[0].trim()
                                  : s.title}
                                {s.tags?.includes('お知らせ') && (
                                  <span style={{ marginLeft: '8px', fontSize: '1.2rem', display: 'inline-block', verticalAlign: 'middle' }}>✨</span>
                                )}
                              </span>
                              {/* ⚡ グリッド用 2行チラ見せ見出し */}
                              {teaser && (
                                <div className="survey-item-teaser-row-grid" style={{
                                  background: 'linear-gradient(90deg, #faf5ff 0%, #fdf2f8 100%)',
                                  border: '1px solid #e9d5ff',
                                  borderRadius: '7px',
                                  padding: '4px 7px',
                                  marginTop: '4px',
                                  minWidth: 0,
                                  maxWidth: '100%'
                                }}>
                                  <div style={{
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    color: '#334155',
                                    lineHeight: 1.45,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word'
                                  }}>
                                    <span style={{ marginRight: '3px' }}>💡</span>
                                    {teaser.hook && (
                                      <span style={{
                                        color: '#5b21b6',
                                        fontWeight: 800,
                                        marginRight: '5px'
                                      }}>
                                        {teaser.hook}
                                      </span>
                                    )}
                                    <span>{teaser.text}</span>
                                  </div>
                                </div>
                              )}
                              {/* グリッド：☆ボタンのみ右上絶対配置（24px, 画像に被らないよう縮小） */}
                              <div style={{ position: 'absolute', top: '6px', right: '6px', zIndex: 10 }}>
                                <button
                                  className={`watch-star-btn ${watchedIds.some(wId => String(wId) === String(s.id)) ? 'active' : ''}`}
                                  onClick={e => toggleWatch(e, s.id)}
                                  aria-label={watchedIds.some(wId => String(wId) === String(s.id)) ? "ウォッチリストから削除" : "ウォッチリストに追加"}
                                  style={{ background: 'rgba(255,255,255,0.88)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', padding: 0 }}
                                >{watchedIds.some(wId => String(wId) === String(s.id)) ? '★' : '☆'}</button>
                              </div>
                            </div>
                            <div className="survey-item-meta-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden', minWidth: 0, marginTop: '8px' }}>
                              {/* 1段目（上段）：バッジ類 */}
                              <div className="survey-item-meta-upper" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px' }}>
                                {showScoreBadge && <span className="popular-score-badge">{badgeLabel}</span>}
                                {isBrandNew(s.created_at) && !isEnded && (
                                  <span style={{
                                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                                    color: '#ffffff',
                                    fontSize: '0.62rem',
                                    fontWeight: '900',
                                    padding: '1px 5px',
                                    borderRadius: '6px',
                                    boxShadow: '0 1px 4px rgba(244, 63, 94, 0.35)',
                                    letterSpacing: '0.02em',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    lineHeight: '1.2'
                                  }}>
                                    NEW
                                  </span>
                                )}
                                <span className={`status-badge ${isEnded ? 'ended' : 'active'}`}>{isEnded ? '終了' : '受付中'}</span>
                                <span className="survey-item-created-at" title={`作成日時: ${new Date(s.created_at).toLocaleString('ja-JP')}`} style={{
                                  fontWeight: isBrandNew(s.created_at) ? '700' : 'normal',
                                  color: isBrandNew(s.created_at) ? '#0284c7' : undefined
                                }}>
                                  🐣{formatCreatedTime(s.created_at)}
                                </span>
                                {s.deadline && <span className="survey-item-deadline">〆{new Date(s.deadline).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}</span>}
                              </div>
                              {/* 2段目（下段）：リアクション数字類 */}
                              <div className="survey-item-meta-lower" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: 'center', width: '100%', padding: '0 2px', boxSizing: 'border-box' }}>
                                <span className="survey-item-votes" title="投票数" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', fontSize: '10px', whiteSpace: 'nowrap' }}>🗳️ {s.total_votes || 0}</span>
                                <span className="survey-item-views" title="閲覧数" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', fontSize: '10px', whiteSpace: 'nowrap' }}>👁️ {s.view_count || 0}</span>
                                <span className="survey-item-likes" title="いいね数" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', fontSize: '10px', whiteSpace: 'nowrap' }}>👍 {s.likes_count || 0}</span>
                                <span className="survey-item-comments" title="コメント数" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', fontSize: '10px', whiteSpace: 'nowrap' }}>💬 {s.comment_count || 0}</span>
                              </div>
                            </div>
                            {s.tags && s.tags.length > 0 && (
                              <div className="tag-bubble-row">
                                {s.tags
                                  .filter(tag => !tag.startsWith('_STAMP:') && tag.length <= 20 && tag !== s.title)
                                  .map(tag => (
                                    <span
                                      key={tag}
                                      className={`tag-bubble ${filterTag === tag ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setFilterTag(filterTag === tag ? '' : tag);
                                      }}
                                    >#{tag}</span>
                                  ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      {/* 📱 スマホ用：カード下段（横幅いっぱい）に広がるチラ見せ枠 */}
                      {viewMode === 'list' && teaser && (
                        <div className="survey-item-teaser-row survey-item-teaser-mobile" style={{
                          background: 'linear-gradient(90deg, #faf5ff 0%, #fdf2f8 60%, #fffbeb 100%)',
                          border: '1px solid #e9d5ff',
                          borderRadius: '8px',
                          padding: '5px 9px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          <div className="survey-item-teaser-clamp" style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#334155',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          }}>
                            <span style={{ marginRight: '3px' }}>💡</span>
                            {teaser.hook && (
                              <span style={{
                                color: '#5b21b6',
                                fontWeight: 800,
                                marginRight: '5px'
                              }}>
                                {teaser.hook}
                              </span>
                            )}
                            <span>{teaser.text}</span>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: '#7c3aed',
                              marginLeft: '3px'
                            }}>▸</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {(idx + 1) % 9 === 0 && (
                      <AdSenseBox slot={`list_feed_slot_${Math.floor(idx / 9)}`} affiliateType="amazon" />
                    )}
                  </React.Fragment>
                );
              })}
            </>
          );
        })()}
      </div>

      {/* 📁 アーカイブ・ダイジェスト */}
      {sortMode === 'latest' && searchQuery === '' && filterCategory === 'すべて' && !filterTag && currentPage === 1 && (
        <div className="archive-digest-section" style={{ marginTop: '40px', padding: '24px', background: '#f8fafc', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#64748b' }}>📁 アーカイブ・ダイジェスト</h3>
            <button onClick={() => setSortMode('ended')} style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 'bold', cursor: 'pointer' }}>もっと見る ⇠</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {(surveys || [])
              .filter(s => s.deadline && new Date(s.deadline) < new Date())
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 3)
              .map(s => (
                <div
                  key={s.id}
                  className="archive-mini-card"
                  onClick={() => navigateTo('details', s)}
                  style={{ background: 'white', padding: '12px', borderRadius: '16px', cursor: 'pointer', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>🗳️ {s.total_votes || 0} 票 / 💬 {s.comment_count || 0}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 📄 ページネーション */}
      <div className="pagination-container-outer">
        <Pagination
          current={currentPage}
          total={Math.ceil((
            sortMode === 'mine'
              ? (totalMineCount || 0)
              : sortMode === 'watching'
                ? (currentPage === 1 && filteredAndSortedSurveys.length < ITEMS_PER_PAGE ? filteredAndSortedSurveys.length : (watchedIds?.length || 0))
                : (activeTab === 'official' ? totalOfficialCount : totalUserCount)
          ) / ITEMS_PER_PAGE)}
          onPageChange={p => {
            setCurrentPage(p);

            // URLクエリパラメータを更新 (ページネーション連動)
            const url = new URL(window.location.href);
            if (p > 1) {
              url.searchParams.set('p', p);
            } else {
              url.searchParams.delete('p');
            }
            window.history.pushState({ view: 'list' }, '', url);

            if (listRef.current) {
              const yOffset = -120; // ヘッダーやフィルターバーの分を考慮して調整
              const y = listRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }}
        />
      </div>
    </>
  );
};

export default SurveyListView;
