import React from 'react';
import AnimatedCounter from './AnimatedCounter';
import SurveyDescription from './SurveyDescription';

const VideoPlayer = ({ entry, idx }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const isNico = entry.startsWith('nico:');
  const videoId = isNico ? entry.substring(5) : entry.substring(3);

  if (isPlaying) {
    return (
      <div key={`vid-${idx}`} style={{ width: '100%', aspectRatio: '16/9', borderRadius: '24px', overflow: 'hidden', background: '#000', boxShadow: '0 15px 45px rgba(0,0,0,0.15)' }}>
        <iframe 
          src={isNico ? `https://embed.nicovideo.jp/watch/${videoId}?jsapi=1` : `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`} 
          style={{ width: '100%', height: '100%', border: 'none' }} 
          allowFullScreen 
          allow="autoplay; encrypted-media"
          title={`video-${idx}`}
        ></iframe>
      </div>
    );
  }

  const thumbUrl = isNico 
    ? `https://snapshot.cdn.nicovideo.jp/snapshots/i/${videoId}` 
    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div 
      key={`vid-${idx}`} 
      onClick={() => setIsPlaying(true)}
      className="video-facade-container"
      style={{ 
        width: '100%', 
        aspectRatio: '16/9', 
        borderRadius: '24px', 
        overflow: 'hidden', 
        background: '#000', 
        boxShadow: '0 15px 45px rgba(0,0,0,0.15)',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      <img src={thumbUrl} alt="video thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
      <div className="play-button-overlay" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80px',
        height: '80px',
        background: 'rgba(239, 68, 68, 0.9)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)',
        transition: 'all 0.2s'
      }}>
        <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: 'white', marginLeft: '4px' }}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.8rem',
        backdropFilter: 'blur(4px)',
        fontWeight: 'bold'
      }}>
        {isNico ? '📺 ニコニコ動画を再生' : '📺 YouTubeを再生'}
      </div>
    </div>
  );
};

const SurveyDetailView = ({ 
  currentSurvey, 
  surveyOnlineCount, 
  isTimeUp, 
  votedOption, 
  isTotalVotes, 
  options, 
  handleVote, 
  handleLikeSurvey, 
  handleShareResult, 
  likedSurveys, 
  user, 
  isAdmin, 
  setIsEditingCategory, 
  setIsEditingTags, 
  handleDeleteSurvey,
  isEditingCategory,
  handleUpdateCategory,
  isEditingTags,
  tagEditValue,
  setTagEditValue,
  handleUpdateTags,
  navigateTo,
  comments,
  commentName,
  setCommentName,
  commentContent,
  setCommentContent,
  handlePostComment,
  isPostingComment,
  currentCommentPage,
  setCurrentCommentPage,
  renderCommentContent,
  formatWithDay,
  CountdownTimer,
  Pagination,
  editingCommentId,
  setEditingCommentId,
  editContent,
  setEditContent,
  handleUpdateComment,
  handleDeleteComment,
  isActionLoading,
  startEditComment,
  myCommentKeys,
  myReactions,
  handleReaction,
  handleReportContent,
  relatedSurveys,
  AdSenseBox,
  CATEGORY_ICON_STYLE,
  supabase,
  setFilterTag,
  setActiveTab,
  handleSurveyReaction,
  STAMPS,
  setSurveys,
  lastReactionEvent,
  adjacentSurveys = { prev: null, next: null },
  baseCategories = []
}) => {
  if (!currentSurvey) return <div className="empty-msg">読み込み中...</div>;

  // 🎨 スタンプリアクションの集計ロジックらび！
  const stampReactions = React.useMemo(() => {
    const counts = {};
    (STAMPS || []).forEach(s => counts[s.id] = 0);
    
    (currentSurvey.tags || []).forEach(t => {
      if (t.startsWith('_STAMP:')) {
        const parts = t.split(':');
        if (parts.length >= 3) {
          const sId = parts[1];
          const count = parseInt(parts[2]) || 0;
          if (counts.hasOwnProperty(sId)) {
            counts[sId] = count;
          }
        }
      }
    });
    return counts;
  }, [currentSurvey.tags, STAMPS]);

  // 🪄 「ボワッ」とエフェクト用の状態管理らび！
  const [effects, setEffects] = React.useState([]);
  const lastEventRef = React.useRef(null);

  React.useEffect(() => {
    if (lastReactionEvent && lastReactionEvent !== lastEventRef.current) {
      lastEventRef.current = lastReactionEvent;
      const stamp = (STAMPS || []).find(s => s.id === lastReactionEvent.stampId);
      if (stamp) {
        const id = Math.random().toString(36).substring(2, 9);
        const newEffect = {
          id,
          src: stamp.src,
          label: stamp.label,
          left: 30 + Math.random() * 40, // 中央付近からランダムに
          bottom: 20 + Math.random() * 20
        };
        setEffects(prev => [...prev, newEffect]);
        setTimeout(() => {
          setEffects(prev => prev.filter(e => e.id !== id));
        }, 2000); // 2秒で消える魔法らび！
      }
    }
  }, [lastReactionEvent, STAMPS]);

  const titlePart = (currentSurvey.tags?.includes('お知らせ') && currentSurvey.title?.includes('||')) 
    ? currentSurvey.title.split('||')[0].trim() 
    : currentSurvey.title;

  const descPart = (currentSurvey.tags?.includes('お知らせ') && currentSurvey.title?.includes('||')) 
    ? currentSurvey.title.split('||')[1].trim() 
    : (currentSurvey.description || '');

  return (
    <div className="score-card">
      <div className="detail-header">
        <h1 className="survey-title">{titlePart}</h1>

        {/* 📺 メディア表示（動画・画像） */}
        {(() => {
          if (!currentSurvey.image_url) return null;
          const entries = currentSurvey.image_url.split(',').map(s => s.trim()).filter(Boolean);
          const videoEntries = entries.filter(e => e.startsWith('yt:') || e.startsWith('nico:'));
          const imageEntries = entries.filter(e => !e.startsWith('yt:') && !e.startsWith('nico:'));
          
          // YouTubeの直接リンク用IDを抽出（最初のYouTube動画があれば）
          const firstYT = videoEntries.find(e => e.startsWith('yt:'));
          const youtubeId = firstYT ? firstYT.substring(3) : null;

          return (
            <div className="media-container" style={{ margin: '30px auto', width: '100%', maxWidth: '900px' }}>
              {/* 動画がある場合は動画を表示 */}
              {videoEntries.length > 0 && (
                <div className="video-multi-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: imageEntries.length > 0 ? '20px' : '0' }}>
                  {videoEntries.map((entry, idx) => (
                    <VideoPlayer key={`vid-${idx}`} entry={entry} idx={idx} />
                  ))}
                </div>
              )}
              {/* 動画がない、あるいは画像も表示したい場合（現在は動画優先で、動画がない時のみ画像を表示する構成が一般的ですが、複数対応） */}
              {videoEntries.length === 0 && imageEntries.length > 0 && (
                <div className="image-display-container" style={{ textAlign: 'center' }}>
                  <img 
                    src={imageEntries[0]} 
                    alt="survey-visual" 
                    fetchpriority="high"
                    loading="eager"
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      minHeight: '200px', // 枠を確保してCLS（ガクつき）を防止
                      aspectRatio: '16/9', // アスペクト比を固定してガクつきを防止
                      objectFit: 'cover',
                      borderRadius: '24px', 
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      backgroundColor: '#f1f5f9'
                    }} 
                  />
                </div>
              )}

              {youtubeId && (
                <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '24px' }}>
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '30px',
                      textDecoration: 'none',
                      fontWeight: '900',
                      fontSize: '1rem',
                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    📺 YouTubeで直接見る (再生できない場合)
                  </a>
                </div>
              )}
            </div>
          );
        })()}

        <div className="detail-meta-bar" style={{ marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
          <span style={{ color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.05)', padding: '4px 12px', borderRadius: '20px' }}>👀 いま {surveyOnlineCount} 人がチェック中！</span>
          <span style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', color: '#64748b' }}>👁️ {currentSurvey.view_count || 0} 閲覧</span>
          <span style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', color: '#64748b' }}>👍 {currentSurvey.likes_count || 0} いいね</span>
          <span style={{ background: '#f8fafc', padding: '4px 12px', borderRadius: '20px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            🗳️ <AnimatedCounter value={isTotalVotes || 0} /> 票
          </span>
          {currentSurvey.category && (
            <span style={{ 
              background: (CATEGORY_ICON_STYLE[currentSurvey.category]?.color || '#3b82f6') + '15', 
              padding: '6px 16px', 
              borderRadius: '20px', 
              color: CATEGORY_ICON_STYLE[currentSurvey.category]?.color || '#3b82f6', 
              fontWeight: '900',
              fontSize: '0.9rem',
              border: `2px solid ${CATEGORY_ICON_STYLE[currentSurvey.category]?.color || '#3b82f6'}33`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
            }}>
              {CATEGORY_ICON_STYLE[currentSurvey.category]?.icon || '🏷️'} {currentSurvey.category}
            </span>
          )}
        </div>
        {currentSurvey.tags && currentSurvey.tags.length > 0 && (
          <div className="detail-tags-row" style={{ marginTop: '25px', marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            {currentSurvey.tags.filter(t => !t.startsWith('_STAMP:')).map((t, i) => {
              const isLocked = t.startsWith('[L]');
              const tagName = isLocked ? t.substring(3) : t;
              return (
                <span key={i} className="tag-bubble clickable" onClick={() => { setFilterTag(tagName); setActiveTab('all'); navigateTo('list'); }} 
                  style={{ 
                    cursor: 'pointer', 
                    background: isLocked ? '#fef2f2' : '#f1f5f9', 
                    color: isLocked ? '#b91c1c' : '#475569', 
                    padding: '5px 15px', 
                    borderRadius: '20px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold', 
                    border: isLocked ? '1px solid #fecaca' : '1px solid #e2e8f0', 
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                  #{tagName}{isLocked && <span title="ロックされています (編集不可)" style={{ fontSize: '0.75rem' }}>🔒</span>}
                </span>
              );
            })}
          </div>
        )}
        {currentSurvey.deadline && (
          <div className="deadline-info-block" style={{ marginTop: '30px' }}>
            <div className="absolute-deadline" style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#64748b' }}>締切：{new Date(currentSurvey.deadline).getFullYear()}年{formatWithDay(currentSurvey.deadline)}</div>
            {!isTimeUp ? <CountdownTimer deadline={currentSurvey.deadline} onTimeUp={() => {}} /> : <div className="countdown-display ended">投票受付終了</div>}
          </div>
        )}
      </div>

      <SurveyDescription 
        description={descPart} 
        renderCommentContent={renderCommentContent} 
        isTimeUp={isTimeUp}
      />

      <div className="options-container">
        {options.length > 0 ? options.map((opt, index) => {
          const perc = isTotalVotes > 0 ? Math.round((opt.votes / isTotalVotes) * 100) : 0;
          const isWinner = options.length > 1 && opt.votes === Math.max(...options.map(o => o.votes)) && opt.votes > 0;

          return (
            <div key={opt.id} className="result-bar-container" style={{ marginBottom: '16px' }}>
              {votedOption || isTimeUp ? (
                <>
                  <div className="result-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <span className="choice-name" style={{ fontWeight: isWinner ? '900' : 'bold', color: isWinner ? '#7c3aed' : '#334155', fontSize: '1.05rem' }}>
                      {isWinner && <span style={{ marginRight: '6px' }}>🏆</span>}
                      {(opt.name.startsWith(`${index + 1}.`) ? opt.name : `${index + 1}. ${opt.name}`) + (String(votedOption) === String(opt.id) ? ' ✅' : '')}
                    </span>
                    <span className="vote-count-meta" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      <span className="vote-count-num" style={{ fontWeight: 'bold', color: isWinner ? '#7c3aed' : '#64748b' }}>
                        <AnimatedCounter value={opt.votes || 0} />票
                      </span>
                      <span className="vote-count-perc" style={{ marginLeft: '8px', opacity: 0.8 }}>({perc}%)</span>
                    </span>
                  </div>
                  <div className="result-bar-bg" style={{ height: '14px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div className="result-bar-fill" style={{ 
                      width: `${perc}%`, 
                      height: '100%', 
                      background: isWinner ? 'linear-gradient(90deg, #7c3aed, #ec4899)' : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                      borderRadius: '10px',
                      transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: isWinner ? '0 0 10px rgba(124, 58, 237, 0.3)' : 'none'
                    }}></div>
                  </div>
                </>
              ) : (
                <button className="option-button" onClick={() => handleVote(opt)} style={{
                  width: '100%',
                  padding: '18px 25px',
                  borderRadius: '18px',
                  border: '2px solid #e2e8f0',
                  background: 'white',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }} onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateX(8px)';
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.color = '#7c3aed';
                  e.currentTarget.style.background = '#f5f3ff';
                }} onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#334155';
                  e.currentTarget.style.background = 'white';
                }}>
                  {opt.name.startsWith(`${index + 1}.`) ? opt.name : `${index + 1}. ${opt.name}`}
                </button>
              )}
            </div>
          );
        }) : (
          <div className="options-loading" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontStyle: 'italic' }}>
             🗳️ 投票項目を読み込み中らび...✨
          </div>
        )}
      </div>

      {/* 🚀 動画連携応援メッセージ（おりぴさんの戦略サポート！） */}
      {votedOption && (
        <div style={{
          marginTop: '30px',
          padding: '25px',
          background: 'linear-gradient(135deg, #fdf2f8, #f5f3ff)',
          borderRadius: '24px',
          border: '2px dashed #7c3aed33',
          textAlign: 'center',
          animation: 'fadeInUp 0.6s ease-out'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🎬 ✨</div>
          <h4 style={{ margin: '0 0 10px 0', color: '#7c3aed', fontWeight: '900' }}>あなたの1票が動画になるかも！？</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6' }}>
            このアンケートの結果やみんなのコメントは、<br/>
            YouTubeやTikTokの動画で紹介される可能性があるらび！<br/>
            <strong>「面白い！」と思った意見はピックアップされるかも！？</strong>✨
          </p>
        </div>
      )}

      {/* 🚀 前後のアンケートへのナビゲーション（カード形式にアップグレードらび！） */}
      {(adjacentSurveys.prev || adjacentSurveys.next) && (
        <div className="adjacent-nav-section" style={{ marginTop: '50px', paddingTop: '30px', borderTop: '2px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>📖</span> 前後のアンケートもチェックらび！
          </h3>
          <div className="adjacent-cards-container" style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { type: 'next', label: '← 次のアンケート ✨', data: adjacentSurveys.next },
              { type: 'prev', label: '前のアンケート 📜 →', data: adjacentSurveys.prev }
            ].filter(nav => nav.data).map(nav => {
               const s = nav.data;
               let thumb = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400';
               if (s.image_url) {
                 const parts = s.image_url.split(',')[0].trim();
                 if (parts.startsWith('yt:')) thumb = `https://img.youtube.com/vi/${parts.substring(3)}/mqdefault.jpg`;
                 else if (parts.startsWith('nico:')) thumb = '/nico_fallback.jpg'; // 以前決めたフォールバックらび！
                 else thumb = parts;
               } else if (s.youtube_id) {
                 thumb = `https://img.youtube.com/vi/${s.youtube_id}/mqdefault.jpg`;
               }

               return (
                 <div key={s.id} className="related-card" onClick={() => navigateTo('details', s)} style={{
                   background: '#fff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
                   boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'all 0.3s ease',
                   border: '2px solid #f1f5f9',
                   width: '100%',
                   maxWidth: '280px',
                   flex: '1 1 280px',
                   userSelect: 'none',
                   WebkitTapHighlightColor: 'transparent',
                   position: 'relative'
                 }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; }}>
                   <div style={{ 
                     position: 'absolute', top: '10px', left: '10px', zIndex: 2, 
                     background: nav.type === 'next' ? 'rgba(124, 58, 237, 0.9)' : 'rgba(71, 85, 105, 0.9)', 
                     color: 'white', padding: '4px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: '900', backdropFilter: 'blur(4px)',
                     boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                   }}>
                     {nav.label}
                   </div>
                   <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative' }}>
                     <img src={thumb} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                       {s.category}
                     </div>
                   </div>
                   <div style={{ padding: '15px' }}>
                     <div style={{ fontWeight: 'bold', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '10px', height: '2.8em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                       {s.title}
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                       <span>🗳️ {s.total_votes || 0} 票</span>
                       <div style={{ display: 'flex', gap: '4px' }}>
                         {s.tags?.filter(t => !t.startsWith('_STAMP:')).slice(0, 2).map((t, i) => (
                           <span key={i} style={{ background: '#f8fafc', padding: '1px 6px', borderRadius: '6px', fontSize: '0.7rem' }}>#{t}</span>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      )}

      {/* 🛡️ 管理パネル (チャッピー・アルゴリズム) */}
      {user && (
         <div className="admin-actions">
            <span style={{ fontWeight: 'bold', color: '#64748b' }}>🏷️ タグ機能</span>
            <div className="admin-btn-group">
              <button 
                onClick={() => {
                  setIsEditingTags(true);
                  if (setTagEditValue) {
                    setTagEditValue((currentSurvey?.tags || []).filter(t => !t.startsWith('_STAMP:')).join(', '));
                  }
                }} 
                className="admin-btn"
              >
                # タグ編集
              </button>
              {(isAdmin || currentSurvey.user_id === user.id) && (
                <>
                  <button onClick={() => setIsEditingCategory(true)} className="admin-btn">🏷️ カテゴリ変更</button>
                  <button onClick={() => handleDeleteSurvey(currentSurvey.id)} className="admin-btn delete">🗑️ 削除</button>
                </>
              )}
            </div>
            
            {isEditingCategory && (
              <div className="edit-panel" style={{ width: '100%', marginTop: '15px', padding: '15px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {baseCategories.filter(cat => isAdmin || cat !== 'らび').map(cat => (
                    <button key={cat} onClick={() => handleUpdateCategory(cat)} className={`cat-btn ${currentSurvey.category === cat ? 'active' : ''}`}>{cat}</button>
                  ))}
                </div>
                <button onClick={() => setIsEditingCategory(false)} style={{ marginTop: '10px', width: '100%', padding: '8px', background: 'none', border: 'none', color: '#94a3b8' }}>キャンセル</button>
              </div>
            )}

            {isEditingTags && (
              <div className="edit-panel" style={{ width: '100%', marginTop: '15px', padding: '15px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#64748b', lineHeight: '1.4' }}>
                  タグを入力してね（カンマ、スペース、改行区切り）<br/>
                  {(isAdmin || currentSurvey.user_id === user.id) ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>※ロックしたいタグには [L] を先頭につけてね（例: [L]ニュース）</span>
                  ) : (
                    <span>※🔒マークのタグは削除・変更できないよ</span>
                  )}
                </div>
                <textarea 
                  className="admin-textarea"
                  value={tagEditValue} 
                  onChange={e => setTagEditValue(e.target.value)} 
                  placeholder="例: アニメ, ニュース, [L]公式" 
                  style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', marginBottom: '10px', fontSize: '1rem', outline: 'none' }} 
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setIsEditingTags(false)} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', borderRadius: '10px', border: 'none' }}>中止</button>
                  <button onClick={handleUpdateTags} style={{ flex: 2, padding: '10px', background: '#7c3aed', color: '#fff', borderRadius: '10px', border: 'none', fontWeight: 'bold' }}>タグを保存する</button>
                </div>
              </div>
            )}

         </div>
      )}

      {/* 🎨 スタンプペタペタエリアらび！ (機能保留のため非表示) */}
      {false && (
        <div className="stamp-peta-peta-area" style={{ 
          marginTop: '30px', 
          textAlign: 'center', 
          background: 'rgba(248, 250, 252, 0.5)', 
          padding: '20px', 
          borderRadius: '24px', 
          border: '1px solid #f1f5f9',
          position: 'relative', // 🚩 エフェクトの基準にするらび！
          overflow: 'visible'
        }}>
        {/* 🪄 浮き出るエフェクトたち */}
        {effects.map(eff => (
          <div key={eff.id} className="floating-stamp-effect" style={{
            position: 'absolute',
            left: `${eff.left}%`,
            bottom: `${eff.bottom}%`,
            pointerEvents: 'none',
            zIndex: 100,
            transform: 'translate(-50%, 0)'
          }}>
            {eff.src ? (
              <img src={eff.src} alt="effect" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '3rem' }}>{eff.label}</span>
            )}
          </div>
        ))}

        <p style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '900', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>✨</span> みんなでスタンプをペタペタするらび！
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {(STAMPS || []).map(stamp => (
            <button 
              key={stamp.id} 
              onClick={() => handleSurveyReaction(stamp.id)}
              className="stamp-btn"
              title={stamp.label}
              aria-label={stamp.label}
              style={{
                background: '#fff',
                border: '2px solid #f1f5f9',
                borderRadius: '50px',
                padding: stamp.src ? '6px 14px' : '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                position: 'relative',
                zIndex: 1
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)'; e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124, 58, 237, 0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
            >
              {stamp.src ? (
                <img src={stamp.src} alt={stamp.label} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '1.4rem' }}>{stamp.label}</span>
              )}
              <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#475569' }}>
                <AnimatedCounter value={stampReactions[stamp.id] || 0} />
              </span>
            </button>
          ))}
        </div>
        </div>
      )}

      <div className="share-result-area" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button className={`like-survey-btn ${likedSurveys.some(id => String(id) === String(currentSurvey.id)) ? 'liked' : ''}`} onClick={handleLikeSurvey} style={{ background: likedSurveys.some(id => String(id) === String(currentSurvey.id)) ? '#ec4899' : '#fbcfe8', color: likedSurveys.some(id => String(id) === String(currentSurvey.id)) ? 'white' : '#be185d', padding: '12px 28px', borderRadius: '30px', fontWeight: 'bold', border: 'none' }}>
          {likedSurveys.some(id => String(id) === String(currentSurvey.id)) ? '💖 いいね済' : '🤍 いいね！'} <AnimatedCounter value={currentSurvey.likes_count || 0} />
        </button>
        <button className="share-x-btn" onClick={() => handleShareResult('x')}>𝕏 シェア</button>
        <button className="share-copy-btn" onClick={() => handleShareResult('copy')}>📋 コピー</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <button className="back-to-list-link" onClick={() => navigateTo('list')} style={{ background: 'none', border: 'none', color: '#94a3b8', textDecoration: 'underline' }}>← 広場に戻る</button>
      </div>

      {/* 🥕 広告/レコメンドエリア (らび＆おりぴ応援コーナー) */}
      <div style={{ marginTop: '40px', marginBottom: '20px' }}>
        <AdSenseBox slot="survey_detail_middle" affiliateType="amazon" />
      </div>

      {/* 🔥 関連アンケートセクション (回遊性アップ！) */}
      {relatedSurveys && relatedSurveys.length > 0 && (
        <div className="related-surveys-section" style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e293b', marginBottom: '24px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🔥</span> この話題、みんなはどう思ってる？
          </h3>
          <div className="related-scroll-container" style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '20px',
            paddingBottom: '20px',
            paddingLeft: '4px',
            paddingRight: '4px',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity'
          }}>
            {relatedSurveys.map(s => {
              // サムネイル抽出
              let thumb = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400';
              if (s.image_url) {
                const parts = s.image_url.split(',')[0].trim();
                if (parts.startsWith('yt:')) thumb = `https://img.youtube.com/vi/${parts.substring(3)}/mqdefault.jpg`;
                else if (!parts.startsWith('nico:')) thumb = parts;
              }

              return (
                <div key={s.id} className="related-card" onClick={() => navigateTo('details', s)} style={{
                  background: '#fff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)', transition: 'all 0.3s ease',
                  border: '1px solid #f1f5f9',
                  minWidth: '280px',
                  flex: '0 0 280px',
                  scrollSnapAlign: 'start',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.1)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)'; }}>
                  <div style={{ width: '100%', height: '140px', overflow: 'hidden', position: 'relative' }}>
                    <img src={thumb} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>
                      {s.category}
                    </div>
                  </div>
                  <div style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '10px', height: '2.8em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <span>🗳️ {s.total_votes || 0} 票</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {s.tags?.filter(t => !t.startsWith('_STAMP:')).slice(0, 2).map((t, i) => (
                          <span key={i} onClick={(e) => { e.stopPropagation(); setFilterTag(t); setActiveTab('all'); navigateTo('list'); }}
                            style={{ background: '#f8fafc', padding: '1px 6px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <style>{`
            .related-scroll-container::-webkit-scrollbar { height: 14px; }
            .related-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
            .related-scroll-container::-webkit-scrollbar-thumb { 
              background: #cbd5e1; 
              border-radius: 10px; 
              border: 2px solid #f1f5f9;
              transition: all 0.3s;
            }
            .related-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>
        </div>
      )}

      {/* 💬 コメント（掲示板）セクション */}
      <div className="comment-section-area" style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #f1f5f9' }}>
        <h3 className="comments-title">💬 みんなのコメント <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#94a3b8' }}>({comments.length}件)</span></h3>
        <div className="comment-form-card">
          <input type="text" placeholder="名無しさん" value={commentName} onChange={e => setCommentName(e.target.value)} className="comment-name-input" />
          <textarea placeholder="コメントを書いてね！🐰✨" value={commentContent} onChange={e => setCommentContent(e.target.value)} className="comment-textarea" />
          <button className="comment-submit-btn" onClick={handlePostComment} disabled={isPostingComment}>{isPostingComment ? '送信中...' : 'コメントを投稿する'}</button>
        </div>
        <div className="comments-list">
          {comments.length > 0 ? comments.slice((currentCommentPage - 1) * 5, currentCommentPage * 5).map((c, idx) => {
            const absoluteIndex = (currentCommentPage - 1) * 5 + idx;
            // 🔢 レス番号の計算（全体の投稿順。最新投稿が一番大きな番号になるように）
            const stableResNum = comments.length - absoluteIndex;
            const isMyComment = myCommentKeys[c.id] || (user && c.user_id === user.id);
            const isLabi = c.user_name?.includes('らび');

            return (
              <div key={c.id} className={`comment-item-card ${isLabi ? 'comment-labi' : ''}`}>
                <div className="comment-item-header">
                  <div className="comment-author-wrap">
                    <span className="comment-res-num" onClick={() => setCommentContent(prev => prev + `>>${stableResNum} `)}>{stableResNum}</span>
                    <span className="comment-author" style={isLabi ? { color: '#d97706', fontWeight: '900' } : {}}>
                      {isLabi ? '🐰 らび 🐰 (AI)' : `👤 ${c.user_name}`}
                    </span>
                    {isMyComment && <span className="my-comment-badge" style={{ marginLeft: '10px' }}>★ あなたの投稿</span>}
                  </div>
                  <span className="comment-date">{new Date(c.created_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="comment-item-body">
                  {editingCommentId === c.id ? (
                    <div className="comment-edit-form">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="comment-edit-textarea"
                      />
                      <div className="comment-edit-actions">
                        <button className="comment-edit-save" onClick={handleUpdateComment} disabled={isActionLoading}>保存</button>
                        <button className="comment-edit-cancel" onClick={(e) => { e.preventDefault(); setEditingCommentId(null); setEditContent(''); }}>中止</button>
                      </div>
                    </div>
                  ) : (
                    renderCommentContent(c.content)
                  )}
                </div>

                <div className="comment-footer-row">
                  <div className="comment-reactions">
                    <button 
                      className={`reaction-btn ${myReactions[`${c.id}_good`] ? 'active' : ''}`}
                      onClick={() => handleReaction(c.id, 'good')}
                    >
                      👍 {c.reactions?.good || 0}
                    </button>
                    <button 
                      className={`reaction-btn ${myReactions[`${c.id}_bad`] ? 'active' : ''}`}
                      onClick={() => handleReaction(c.id, 'bad')}
                    >
                      👎 {c.reactions?.bad || 0}
                    </button>
                    <button 
                      className="report-btn"
                      onClick={() => handleReportContent(c.id, 'comment')}
                      title="通報"
                      aria-label="不適切なコメントを通報"
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', opacity: 0.7 }}
                    >
                      🚩
                    </button>
                  </div>

                  <div className="comment-owner-actions">
                    {isMyComment && !editingCommentId && c.content !== '[[DELETED]]' && (
                      <>
                        <button className="comment-owner-edit" onClick={() => startEditComment(c)}>修正</button>
                        <button className="comment-owner-delete" onClick={() => handleDeleteComment(c.id)}>削除</button>
                      </>
                    )}
                    {isAdmin && !isMyComment && c.content !== '[[DELETED]]' && (
                      <button className="comment-owner-delete" onClick={() => handleDeleteComment(c.id)}>削除(管)</button>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>まだコメントはありません。🐰🥕</div>}
          <Pagination current={currentCommentPage} total={Math.ceil(comments.length / 5)} onPageChange={setCurrentCommentPage} />
        </div>
      </div>
    </div>
  );
};

export default SurveyDetailView;
