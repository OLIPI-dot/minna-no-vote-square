import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AdSenseBox from './AdSenseBox';
import SquareTimeline from './SquareTimeline';
import RaidBossMiniGame from './RaidBossMiniGame';
import PatrolMiniGame from './PatrolMiniGame';
import DungeonMiniGame from './DungeonMiniGame';
import GachaMiniGame from './GachaMiniGame';
import DictionaryModal from './DictionaryModal';
import StatusModal from './StatusModal';
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
  const [isSidebarLoggingIn, setIsSidebarLoggingIn] = useState(false);
  const [miniqueTab, setMiniqueTab] = useState('patrol');
  const [isEditingHn, setIsEditingHn] = useState(false);
  const [tempHn, setTempHn] = useState('');
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  useEffect(() => {
    // ☁️ 1. まずSupabaseに保存されたカスタムネームがあるか確認
    const dbCustomHn = user?.user_metadata?.custom_hn;
    const savedHn = localStorage.getItem('minake_hn');

    if (dbCustomHn) {
      // クラウドに名前があれば最優先で採用！
      setHn(dbCustomHn);
      setTempHn(dbCustomHn);
      localStorage.setItem('minake_hn', dbCustomHn);
    } else if (savedHn && savedHn !== '匿名広場民') {
      // ローカルに設定済みの名前がある場合（PCなど）
      setHn(savedHn);
      setTempHn(savedHn);
      // ログイン中ならクラウド（Supabase）に初回自動バックアップ！
      if (user) {
        supabase.auth.updateUser({ data: { custom_hn: savedHn } });
      }
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

    // ☁️ ログイン中ならクラウド（Supabase）にも即座に保存！
    if (user) {
      supabase.auth.updateUser({ data: { custom_hn: finalHn } });
    }
  };

  return (
    <div className="live-feed-sidebar" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
      
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
          
          <h3 className="live-feed-title" style={{ color: '#b45309', border: 'none', padding: 0, justifyContent: 'center', marginTop: '12px' }}>🐰 みんクエ 🥕</h3>

          {/* ☁️ ログイン・同期状態の明示バッジ */}
          {user ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: '0.72rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px', margin: '4px 0 8px 0' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              ☁️ クラウド同期中（全端末で共有）
            </div>
          ) : (
            <div style={{ margin: '4px 0 10px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.72rem', fontWeight: 'bold', padding: '3px 10px', borderRadius: '12px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
                📱 ゲスト保存中（この端末のみ）
              </div>
              <div style={{ marginTop: '6px' }}>
                <button 
                  disabled={isSidebarLoggingIn}
                  onClick={async () => {
                    if (isSidebarLoggingIn) return;
                    setIsSidebarLoggingIn(true);
                    try {
                      const redirectUrl = window.location.origin;
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: redirectUrl }
                      });
                      if (error) {
                        console.error('Sidebar login error:', error);
                        setIsSidebarLoggingIn(false);
                      }
                    } catch (e) {
                      console.error('Sidebar login exception:', e);
                      setIsSidebarLoggingIn(false);
                    }
                  }}
                  style={{ 
                    background: isSidebarLoggingIn ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                    color: 'white', border: 'none', borderRadius: '6px', 
                    padding: '6px 14px', fontSize: '0.75rem', fontWeight: 'bold', 
                    cursor: isSidebarLoggingIn ? 'not-allowed' : 'pointer', 
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    opacity: isSidebarLoggingIn ? 0.7 : 1
                  }}
                >
                  <span>{isSidebarLoggingIn ? '🔄' : '☁️'}</span> {isSidebarLoggingIn ? 'Googleへ接続中...' : 'Googleログインして同期する'}
                </button>
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#d97706', margin: '4px 0 12px 0' }}>
            {levelInfo?.title || 'ひよっこ広場民 🥚'}
          </div>

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

          <div style={{ fontSize: '0.85rem', color: '#92400e', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Lv.{levelInfo?.level || 1} (EXP: {userExp || 0})</span>
            <span style={{ fontWeight: 'bold' }}>🎫 {gachaTickets || 0} 枚</span>
            <button 
              onClick={() => setIsStatusOpen(true)}
              className="minique-status-btn"
              title="ステータス・装備詳細を見る"
            >
              <span>📊</span>
              <span>ステータス</span>
            </button>
          </div>
          {levelInfo?.next && (
            <div style={{ width: '100%', background: '#fde68a', borderRadius: '10px', height: '12px', overflow: 'hidden', position: 'relative', marginBottom: '4px' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', width: `${Math.min(100, Math.max(0, ((userExp || 0) / levelInfo.next) * 100))}%` }}></div>
            </div>
          )}
          {levelInfo?.next ? (
            <div style={{ fontSize: '0.75rem', color: '#b45309' }}>次のレベルまであと {levelInfo.next - (userExp || 0)} EXP！</div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#b45309' }}>最大レベル到達！あなたは伝説です✨</div>
          )}

          {/* ⚔️ みんクエ 操作パネル (立体ボタン & 擬似要素装飾付き) */}
          <div className="minique-panel-container">
            <button 
              onClick={() => setMiniqueTab('patrol')}
              className="minique-tab-btn"
              style={{ 
                background: miniqueTab === 'patrol' 
                  ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)' 
                  : '#ffffff', 
                color: miniqueTab === 'patrol' ? '#ffffff' : '#334155', 
                border: miniqueTab === 'patrol' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                borderBottom: miniqueTab === 'patrol' ? '3px solid #1d4ed8' : '3px solid #cbd5e1',
                boxShadow: miniqueTab === 'patrol' ? '0 3px 8px rgba(37, 99, 235, 0.4)' : '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <span>🚓</span>
              <span>パトロール</span>
            </button>

            <button 
              onClick={() => setMiniqueTab('dungeon')}
              className="minique-tab-btn"
              style={{ 
                background: miniqueTab === 'dungeon' 
                  ? 'linear-gradient(180deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)' 
                  : '#ffffff', 
                color: miniqueTab === 'dungeon' ? '#ffffff' : '#334155', 
                border: miniqueTab === 'dungeon' ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                borderBottom: miniqueTab === 'dungeon' ? '3px solid #3730a3' : '3px solid #cbd5e1',
                boxShadow: miniqueTab === 'dungeon' ? '0 3px 8px rgba(79, 70, 229, 0.4)' : '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <span>🔦</span>
              <span>地下パトロール</span>
            </button>

            {/* 🐉 レイドボス (全幅ワイド配置 ＆ 炎の立体ボタン) */}
            <button 
              onClick={() => setMiniqueTab('raid')}
              className="minique-tab-btn"
              style={{ 
                gridColumn: '1 / span 2',
                padding: '10px 8px',
                background: miniqueTab === 'raid' 
                  ? 'linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%)' 
                  : 'linear-gradient(180deg, #ffffff 0%, #fff5f5 100%)', 
                color: miniqueTab === 'raid' ? '#ffffff' : '#b91c1c', 
                border: miniqueTab === 'raid' ? '1px solid #dc2626' : '1px solid #fca5a5',
                borderBottom: miniqueTab === 'raid' ? '3px solid #991b1b' : '3px solid #f87171',
                boxShadow: miniqueTab === 'raid' ? '0 4px 12px rgba(239, 68, 68, 0.45)' : '0 2px 6px rgba(239, 68, 68, 0.15)',
                fontSize: '0.84rem'
              }}
            >
              <span>🐉</span>
              <span>レイドボス討伐戦</span>
              <span style={{ 
                fontSize: '0.62rem', 
                background: miniqueTab === 'raid' ? 'rgba(0,0,0,0.3)' : '#ef4444', 
                color: '#ffffff', 
                padding: '2px 6px', 
                borderRadius: '6px',
                fontWeight: '900',
                letterSpacing: '0.5px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}>
                LIVE 🔥
              </span>
            </button>

            <button 
              onClick={() => setMiniqueTab('gacha')}
              className="minique-tab-btn"
              style={{ 
                background: miniqueTab === 'gacha' 
                  ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' 
                  : '#ffffff', 
                color: miniqueTab === 'gacha' ? '#ffffff' : '#334155', 
                border: miniqueTab === 'gacha' ? '1px solid #d97706' : '1px solid #e2e8f0',
                borderBottom: miniqueTab === 'gacha' ? '3px solid #b45309' : '3px solid #cbd5e1',
                boxShadow: miniqueTab === 'gacha' ? '0 3px 8px rgba(217, 119, 6, 0.4)' : '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <span>🛡️</span>
              <span>装備・ガチャ</span>
            </button>

            <button 
              onClick={() => setIsDictionaryOpen(true)}
              className="minique-tab-btn"
              style={{ 
                background: 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)', 
                color: '#ffffff', 
                border: '1px solid #7c3aed',
                borderBottom: '3px solid #5b21b6',
                boxShadow: '0 3px 8px rgba(124, 58, 237, 0.4)'
              }}
            >
              <span>📖</span>
              <span>図鑑</span>
            </button>
          </div>

          <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: miniqueTab === 'patrol' ? 'block' : 'none' }}>
              <PatrolMiniGame 
                userLevel={levelInfo?.level || 1} 
                userExp={userExp}
                levelInfo={levelInfo}
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
                user={user}
              />
            </div>

            <div style={{ display: miniqueTab === 'dungeon' ? 'block' : 'none' }}>
              <DungeonMiniGame 
                userLevel={levelInfo?.level || 1} 
                userExp={userExp}
                levelInfo={levelInfo}
                addExp={addExp} 
                gachaTickets={gachaTickets}
                addTickets={addTickets}
                equipment={equipment}
                setEquipment={setEquipment}
                inventory={inventory}
                setInventory={setInventory}
                encounteredEnemies={encounteredEnemies}
                setEncounteredEnemies={setEncounteredEnemies}
                user={user}
              />
            </div>

            <div style={{ display: miniqueTab === 'raid' ? 'block' : 'none' }}>
              <RaidBossMiniGame 
                userLevel={levelInfo?.level || 1}
                userExp={userExp}
                addExp={addExp}
                gachaTickets={gachaTickets}
                addTickets={addTickets}
                equipment={equipment}
                user={user}
                hn={hn}
                globalOnlineCount={globalOnlineCount}
              />
            </div>

            <div style={{ display: miniqueTab === 'gacha' ? 'block' : 'none' }}>
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
            </div>
          </div>
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

      <StatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        userLevel={levelInfo?.level || 1}
        userExp={userExp || 0}
        levelInfo={levelInfo}
        hn={hn}
        equipment={equipment}
      />
    </div>
  );
};

export default Sidebar;
