import React, { useState, useEffect } from 'react';
import AdSenseBox from './AdSenseBox';
import SquareTimeline from './SquareTimeline';
import BattleMiniGame from './BattleMiniGame';
import GachaMiniGame from './GachaMiniGame';
import { CATEGORY_ICON_STYLE } from '../constants';

const getCatColor = (cat) => {
  if (!cat) return '#cbd5e1';
  const style = CATEGORY_ICON_STYLE[cat] || CATEGORY_ICON_STYLE[cat.trim()] || CATEGORY_ICON_STYLE['その他'];
  return style?.color || '#cbd5e1';
};

const Sidebar = ({ 
  liveSurveys, 
  popularSurveys, 
  endingSoonSurveys, 
  showAllEndingSoon, 
  setShowAllEndingSoon, 
  navigateTo, 
  globalOnlineCount, 
  formatWithDay, 
  AnimatedCounter,
  userExp,
  levelInfo,
  user,
  addExp
}) => {
  const [equipment, setEquipment] = useState(() => {
    try {
      const saved = localStorage.getItem('min_ake_equipment');
      return saved ? JSON.parse(saved) : { weapon: null, armor: null, accessory: null };
    } catch {
      return { weapon: null, armor: null, accessory: null };
    }
  });

  useEffect(() => {
    localStorage.setItem('min_ake_equipment', JSON.stringify(equipment));
  }, [equipment]);

  return (
    <div className="live-feed-sidebar" style={{ minWidth: '320px', boxSizing: 'border-box' }}>
      {/* 🏆 ユーザー称号＆レベル */}
      <div className="sidebar-section-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '2px solid #fbbf24', textAlign: 'center' }}>
        <h3 className="live-feed-title" style={{ color: '#b45309', border: 'none', padding: 0, justifyContent: 'center' }}>🐰 あなたの称号 🥕</h3>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d97706', margin: '8px 0' }}>
          {levelInfo?.title || 'ひよっこ広場民 🥚'}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '8px' }}>
          Lv.{levelInfo?.level || 1} (EXP: {userExp || 0})
        </div>
        {levelInfo?.next && (
          <div style={{ width: '100%', background: '#fde68a', borderRadius: '10px', height: '12px', overflow: 'hidden', position: 'relative', marginBottom: '4px' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', width: `${Math.min(100, Math.max(0, ((userExp || 0) / levelInfo.next) * 100))}%` }}></div>
          </div>
        )}
        {levelInfo?.next ? (
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>次の称号まであと {levelInfo.next - (userExp || 0)} EXP！(投票で+10)</div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>最大レベル到達！あなたは伝説です✨</div>
        )}
        {!user && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '8px', background: '#fee2e2', padding: '4px', borderRadius: '6px' }}>
            ※ログインすると他の端末にも称号を引き継げます！
          </div>
        )}

        <GachaMiniGame userExp={userExp} addExp={addExp} equipment={equipment} setEquipment={setEquipment} />
        <BattleMiniGame userLevel={levelInfo?.level || 1} addExp={addExp} equipment={equipment} />
      </div>

      <div className="sidebar-section-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}>
        <h3 className="live-feed-title" style={{ color: '#7c3aed', marginBottom: '8px', fontSize: '1.1rem', borderLeft: '5px solid #7c3aed', paddingLeft: '12px' }}>📡 広場の状況</h3>
        <div style={{ fontSize: '0.9rem', color: '#4c1d95', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ position: 'relative', display: 'inline-block', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
          いま {globalOnlineCount} 人が広場にいます 🐰✨
        </div>
      </div>

      {/* 💬 X風・広場のタイムライン（つぶやき） */}
      <SquareTimeline />

      {/* 🔥 人気ランキング (引き上げ) */}
      <div className="sidebar-section-card" style={{ marginBottom: '24px' }}>
        <h3 className="live-feed-title">🔥 人気ランキング</h3>
        <div className="live-feed-content">
          {popularSurveys.slice(0, 5).map((s, idx) => (
            <div 
              key={s.id} 
              className="live-item popular clickable" 
              onClick={() => navigateTo('details', s)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && navigateTo('details', s)}
              aria-label={`${idx + 1}位: ${s.title} の詳細を見る`}
              style={{ borderLeft: `5px solid ${getCatColor(s.category)}` }}
            >
              <span className="rank-label" style={idx > 2 ? { fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', minWidth: '24px', textAlign: 'center' } : {}}>
                {idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}位`}
              </span>
              <div className="popular-item-info">
                <strong style={{ display: 'block', marginBottom: '4px' }}>{s.title}</strong>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
                  <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                    ⚡ {(Number(s.total_votes || 0) * 10) + (Number(s.likes_count || 0) * 5) + Number(s.view_count || 0)} pt
                  </span>
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

      {/* ⏳ もうすぐ終了！ (条件付きレンダリング) */}
      {endingSoonSurveys.length > 0 && (
        <div className="sidebar-section-card" style={{ marginBottom: '24px', border: '2px solid #fee2e2' }}>
          <h3 className="live-feed-title" style={{ color: '#e11d48' }}>⏰ もうすぐ終了！</h3>
          <div className="live-feed-content">
            {(showAllEndingSoon ? endingSoonSurveys : endingSoonSurveys.slice(0, 4)).map(s => (
              <div 
                key={s.id} 
                className="live-item clickable" 
                onClick={() => navigateTo('details', s)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && navigateTo('details', s)}
                aria-label={`${s.title} の詳細を見る`}
              >
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
          </div>
        </div>
      )}

      {/* ✨ 広場の最新ニュース (最下部へ移動) */}
      <div className="sidebar-section-card" style={{ marginBottom: '24px' }}>
        <h3 className="live-feed-title">✨ 広場の最新ニュース</h3>
        <div className="live-feed-content">
          {liveSurveys.slice(0, 5).map(s => (
            <div 
              key={s.id} 
              className="live-item clickable" 
              onClick={() => navigateTo('details', s)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && navigateTo('details', s)}
              aria-label={`${s.title} の詳細を見る`}
            >
              <strong>{s.title}</strong> が公開されました！
            </div>
          ))}
        </div>
      </div>
      <AdSenseBox slot="sidebar_slot_placeholder" affiliateType="amazon" />
    </div>
  );
};

export default Sidebar;
