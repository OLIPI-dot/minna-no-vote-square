import React from 'react';
import AdSenseBox from './AdSenseBox';

const Sidebar = ({ 
  liveSurveys, 
  popularSurveys, 
  endingSoonSurveys, 
  showAllEndingSoon, 
  setShowAllEndingSoon, 
  navigateTo, 
  globalOnlineCount, 
  formatWithDay, 
  AnimatedCounter 
}) => {
  return (
    <div className="live-feed-sidebar">
      <div className="sidebar-section-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}>
        <div className="live-feed-title" style={{ color: '#7c3aed', marginBottom: '8px' }}>📡 広場の状況</div>
        <div style={{ fontSize: '0.9rem', color: '#4c1d95', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ position: 'relative', display: 'inline-block', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
          いま {globalOnlineCount} 人が広場にいます 🐰✨
        </div>
      </div>

      <div className="sidebar-section-card" style={{ marginBottom: '24px', border: '2px solid #fee2e2' }}>
        <div className="live-feed-title" style={{ color: '#e11d48' }}>⏰ もうすぐ終了！</div>
        <div className="live-feed-content">
          {endingSoonSurveys.length > 0 ? (
            <>
              {(showAllEndingSoon ? endingSoonSurveys : endingSoonSurveys.slice(0, 4)).map(s => (
                <div key={s.id} className="live-item clickable" onClick={() => navigateTo('details', s)}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#e11d48', background: '#fff1f2', display: 'inline-block', padding: '2px 8px', borderRadius: '12px' }}>
                    〆: {formatWithDay(s.deadline)}
                  </div>
                </div>
              ))}
              {endingSoonSurveys.length > 4 && (
                <button onClick={() => setShowAllEndingSoon(v => !v)} style={{
                  marginTop: '8px', width: '100%', background: 'none', border: '1.5px solid #fca5a5',
                  borderRadius: '12px', color: '#e11d48', fontSize: '0.8rem', padding: '4px 0', cursor: 'pointer', fontWeight: 'bold'
                }}>
                  {showAllEndingSoon ? '▲ 閉じる' : `▼ あと${endingSoonSurveys.length - 4}件 もっと見る`}
                </button>
              )}
            </>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
              現在、24時間以内に終了する<br />アンケートはありません🍵
            </div>
          )}
        </div>
      </div>
      <div className="sidebar-section-card">
        <div className="live-feed-title">✨ 広場の最新ニュース</div>
        <div className="live-feed-content">
          {liveSurveys.map(s => (
            <div key={s.id} className="live-item clickable" onClick={() => navigateTo('details', s)}>
              <strong>{s.title}</strong> が公開されました！
            </div>
          ))}
        </div>
      </div>
      <div className="sidebar-section-card" style={{ marginTop: '24px' }}>
        <div className="live-feed-title">🔥 人気ランキング</div>
        <div className="live-feed-content">
          {popularSurveys.map((s, idx) => (
            <div key={s.id} className="live-item popular clickable" onClick={() => navigateTo('details', s)}>
              <span className="rank-label" style={idx > 2 ? { fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', minWidth: '24px', textAlign: 'center' } : {}}>
                {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}位`}
              </span>
              <div className="popular-item-info">
                <strong style={{ display: 'block', marginBottom: '4px' }}>{s.title}</strong>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                  <span>🗳️ <AnimatedCounter value={s.total_votes || 0} /> 票</span>
                  <span>👁️ {s.view_count || 0}</span>
                  <span>👍 {s.likes_count || 0}</span>
                  <span>💬 {s.comment_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <AdSenseBox slot="sidebar_slot_placeholder" affiliateType="amazon" />
    </div>
  );
};

export default Sidebar;
