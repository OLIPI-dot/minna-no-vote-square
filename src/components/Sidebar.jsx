import React, { useState, useEffect } from 'react';
import AdSenseBox from './AdSenseBox';
import SquareTimeline from './SquareTimeline';
import BattleMiniGame from './BattleMiniGame';
import PatrolMiniGame from './PatrolMiniGame';
import GachaMiniGame from './GachaMiniGame';
import DictionaryModal from './DictionaryModal';
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
  gachaTickets,
  levelInfo,
  user,
  addExp,
  addTickets,
  equipment,
  setEquipment,
  inventory,
  setInventory,
  acquiredItems,
  setAcquiredItems,
  encounteredEnemies,
  setEncounteredEnemies
}) => {
  const [hn, setHn] = useState('');
  const [miniqueTab, setMiniqueTab] = useState('patrol');
  const [isEditingHn, setIsEditingHn] = useState(false);
  const [tempHn, setTempHn] = useState('');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);

  useEffect(() => {
    const savedHn = localStorage.getItem('minake_hn');
    if (savedHn) {
      setHn(savedHn);
      setTempHn(savedHn);
    } else if (user && user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) {
      const authName = user.user_metadata.full_name || user.user_metadata.name;
      setHn(authName);
      setTempHn(authName);
      localStorage.setItem('minake_hn', authName);
    } else {
      setHn('匿名広場民');
      setTempHn('匿名広場民');
    }
  }, [user]);

  const generateTripcode = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash = hash & hash; 
    }
    
    // ガチの管理者用パスワードのハッシュ値（ソースコードを見られてもパスワード本体はバレない）
    if (hash === -1530203312) {
      return '◆OLiPi'; // 👑 開発者特権の特別なトリップ
    }
    
    const baseString = Math.abs(hash).toString(36) + 'AbCdEfGhIj';
    return '◆' + baseString.substring(0, 8);
  };

  const saveHn = () => {
    let rawInput = tempHn.trim() || '匿名広場民';
    let finalHn = rawInput;

    if (rawInput.includes('#')) {
      const parts = rawInput.split('#');
      const namePart = parts[0] || '名無し';
      const passwordPart = parts.slice(1).join('#');
      if (passwordPart) {
        finalHn = `${namePart} ${generateTripcode(passwordPart)}`;
      }
    }

    setHn(finalHn);
    localStorage.setItem('minake_hn', finalHn);
    setIsEditingHn(false);
  };

  return (
    <div className="live-feed-sidebar" style={{ minWidth: '320px', boxSizing: 'border-box' }}>
      
      {/* 1. 📡 広場の状況 */}
      <div className="sidebar-section-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}>
        <h3 className="live-feed-title" style={{ color: '#7c3aed', marginBottom: '8px', fontSize: '1.1rem', borderLeft: '5px solid #7c3aed', paddingLeft: '12px' }}>📡 広場の状況</h3>
        <div style={{ fontSize: '0.9rem', color: '#4c1d95', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ position: 'relative', display: 'inline-block', width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981' }}></span>
          いま {globalOnlineCount} 人が広場にいます 🐰✨
        </div>
      </div>

      {/* 2. 🔥 人気ランキング */}
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

      {/* 3. ⏳ もうすぐ終了！ (条件付きレンダリング) */}
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

      {/* 4. 🏆 ユーザー称号＆レベル (みんクエ) */}
      <div className="sidebar-section-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', border: '2px solid #fbbf24', textAlign: 'center' }}>
        
        {isEditingHn ? (
          <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            <input 
              type="text" 
              value={tempHn} 
              onChange={(e) => setTempHn(e.target.value)} 
              placeholder="ハンドルネーム" 
              maxLength={40} // 長いパスワードも入力できるように上限を増やす
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #fbbf24', textAlign: 'center', width: '80%' }}
            />
            <button onClick={saveHn} style={{ padding: '4px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>決定</button>
          </div>
        ) : (
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: hn.includes('◆OLiPi') ? '#ef4444' : (levelInfo?.color || '#78350f'), textShadow: hn.includes('◆OLiPi') ? '0 0 8px rgba(239, 68, 68, 0.4)' : (levelInfo?.textShadow || 'none'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '8px 0' }}>
            {hn.includes('◆OLiPi') ? `👑 ${hn}` : hn} 
            <button onClick={() => setIsEditingHn(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#d97706', padding: '2px 4px', borderRadius: '4px' }}>✏️</button>
          </div>
        )}

        <h3 className="live-feed-title" style={{ color: '#b45309', border: 'none', padding: 0, justifyContent: 'center', marginTop: '12px' }}>🐰 あなたの称号 🥕</h3>
        
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d97706', margin: '4px 0 12px 0' }}>
          {levelInfo?.title || 'ひよっこ広場民 🥚'}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '8px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <span>Lv.{levelInfo?.level || 1} (EXP: {userExp || 0})</span>
          {/* 一時的に完全に非表示
          {import.meta.env.DEV && (
            <span style={{ fontWeight: 'bold' }}>🎫 {gachaTickets || 0} 枚</span>
          )}
          */}
        </div>
        {levelInfo?.next && (
          <div style={{ width: '100%', background: '#fde68a', borderRadius: '10px', height: '12px', overflow: 'hidden', position: 'relative', marginBottom: '4px' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', width: `${Math.min(100, Math.max(0, ((userExp || 0) / levelInfo.next) * 100))}%` }}></div>
          </div>
        )}
        {levelInfo?.next ? (
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>次の称号まであと {levelInfo.next - (userExp || 0)} EXP！</div>
        ) : (
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>最大レベル到達！あなたは伝説です✨</div>
        )}
        {!user && (
          <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '8px', background: '#fee2e2', padding: '4px', borderRadius: '6px' }}>
            ※ログインすると他の端末にも称号を引き継げます！
          </div>
        )}

        {/* ⚔️ みんクエ タブメニュー (本番環境では非表示) */}
        {import.meta.env.DEV && (
          <>
            <div style={{ display: 'flex', gap: '4px', margin: '16px 0 12px 0', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setMiniqueTab('patrol')}
                style={{ flex: 1, padding: '8px 2px', borderRadius: '6px', border: 'none', background: miniqueTab === 'patrol' ? '#3b82f6' : 'transparent', color: miniqueTab === 'patrol' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🚓 パトロール
              </button>
              <button 
                onClick={() => setMiniqueTab('boss')}
                style={{ flex: 1, padding: '8px 2px', borderRadius: '6px', border: 'none', background: miniqueTab === 'boss' ? '#ef4444' : 'transparent', color: miniqueTab === 'boss' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🐉 ボス戦
              </button>
              <button 
                onClick={() => setMiniqueTab('gacha')}
                style={{ flex: 1, padding: '8px 2px', borderRadius: '6px', border: 'none', background: miniqueTab === 'gacha' ? '#f59e0b' : 'transparent', color: miniqueTab === 'gacha' ? 'white' : '#64748b', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                🎪 ガチャ・鞄
              </button>
              <button 
                onClick={() => setIsDictionaryOpen(true)}
                style={{ flex: 1, padding: '8px 2px', borderRadius: '6px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                📖 図鑑
              </button>
            </div>

            {/* タブのコンテンツ領域 */}
            <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {miniqueTab === 'patrol' && (
                <PatrolMiniGame 
                  userLevel={levelInfo?.level || 1} 
                  userExp={userExp}
                  addExp={addExp} 
                  gachaTickets={gachaTickets}
                  addTickets={addTickets}
                  equipment={equipment}
                  setEquipment={setEquipment}
                  inventory={inventory}
                  setInventory={setInventory}
                  globalOnlineCount={globalOnlineCount}
                  encounteredEnemies={encounteredEnemies}
                  setEncounteredEnemies={setEncounteredEnemies}
                />
              )}

              {miniqueTab === 'boss' && (
                <BattleMiniGame 
                  userLevel={levelInfo?.level || 1} 
                  addExp={addExp} 
                  equipment={equipment} 
                  globalOnlineCount={globalOnlineCount} 
                  user={user}
                />
              )}

              {miniqueTab === 'gacha' && (
                <GachaMiniGame 
                  userLevel={levelInfo?.level || 1}
                  gachaTickets={gachaTickets} 
                  addTickets={addTickets} 
                  equipment={equipment} 
                  setEquipment={setEquipment} 
                  addExp={addExp}
                  inventory={inventory}
                  setInventory={setInventory}
                  acquiredItems={acquiredItems}
                  setAcquiredItems={setAcquiredItems}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* 5. 💬 X風・広場のタイムライン（つぶやき） */}
      <SquareTimeline />

      {/* 6. ✨ 広場の最新ニュース */}
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

      {/* 7. 広告 */}
      <AdSenseBox slot="sidebar_slot_placeholder" affiliateType="amazon" />

      <DictionaryModal 
        isOpen={isDictionaryOpen} 
        onClose={() => setIsDictionaryOpen(false)} 
        acquiredItems={acquiredItems} 
        encounteredEnemies={encounteredEnemies} 
      />
    </div>
  );
};

export default Sidebar;
