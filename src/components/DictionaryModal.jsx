import React, { useState, useEffect } from 'react';
import { 
  ITEMS, 
  EFFECT_DESCRIPTIONS, 
  getReqLevel, 
  getItemEffectDescription,
  getRarityColor,
  getRarityTextStyle,
  getRarityBadgeStyle,
  RARITY_CONFIG
} from '../items';
import { ENEMIES } from '../enemies';

const DictionaryModal = ({ isOpen, onClose, acquiredItems = [], encounteredEnemies = [] }) => {
  const [tab, setTab] = useState('items'); // 'items' | 'enemies'
  const [selectedItem, setSelectedItem] = useState(null); // 選択中のアイテムID
  const [selectedEnemy, setSelectedEnemy] = useState(null); // 選択中のエネミーID
  const [sortOrder, setSortOrder] = useState('default'); // 'default' | 'rarityDesc' | 'rarityAsc'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'weapon' | 'armor' | 'accessory' | 'partner'
  const [ownedOnly, setOwnedOnly] = useState(false); // 入手済み(エネミーは遭遇済み)のみ表示
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen) return null;

  const totalItems = ITEMS.length;
  const collectedItems = ITEMS.filter(i => acquiredItems.includes(i.id)).length;
  
  const totalEnemies = ENEMIES.length;
  const collectedEnemies = ENEMIES.filter(e => encounteredEnemies.includes(e.id)).length;

  // 種類フィルター用の定義（各種類の収集数もチップに表示）
  const TYPE_FILTERS = [
    { key: 'all', label: 'すべて' },
    { key: 'weapon', label: '🗡️ 武器' },
    { key: 'armor', label: '🛡️ 防具' },
    { key: 'accessory', label: '💍 アクセ' },
    { key: 'partner', label: '👤 お供' },
  ];
  const typeCounts = (key) => {
    const pool = key === 'all' ? ITEMS : ITEMS.filter(i => i.type === key);
    return `${pool.filter(i => acquiredItems.includes(i.id)).length}/${pool.length}`;
  };

  const getEnemyColor = (type) => {
    const colors = { normal: '#334155', elite: '#0284c7', rare: '#ef4444' };
    return colors[type] || '#333';
  };

  const getEnemyStyle = (type) => {
    if (type === 'rare') {
      return {
        color: '#ef4444',
        fontWeight: 'bold',
        textShadow: '0 0 8px rgba(239, 68, 68, 0.7)'
      };
    }
    if (type === 'elite') {
      return {
        color: '#0284c7',
        fontWeight: 'bold',
        textShadow: '0 0 6px rgba(2, 132, 199, 0.5)'
      };
    }
    return { color: '#64748b', fontWeight: 'bold' };
  };

  // 左側ペインのリストレンダリング
  const renderList = () => {
    if (tab === 'items') {
      let displayItems = ITEMS.filter(i =>
        (typeFilter === 'all' || i.type === typeFilter) &&
        (!ownedOnly || acquiredItems.includes(i.id))
      );
      const rarityOrder = { LR: 5, UR: 4, SR: 3, R: 2, N: 1 };
      
      if (sortOrder === 'default') {
        displayItems.sort((a, b) => (a.dexNo || 0) - (b.dexNo || 0));
      } else if (sortOrder === 'rarityDesc') {
        displayItems.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
      } else if (sortOrder === 'rarityAsc') {
        displayItems.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
      } else if (sortOrder === 'reqLevelAsc') {
        displayItems.sort((a, b) => getReqLevel(a) - getReqLevel(b));
      } else if (sortOrder === 'reqLevelDesc') {
        displayItems.sort((a, b) => getReqLevel(b) - getReqLevel(a));
      }

      if (displayItems.length === 0) {
        return (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
            該当するアイテムがありません。<br />絞り込みを変えてみてね🐰
          </div>
        );
      }

      return displayItems.map(item => {
        const isAcquired = acquiredItems.includes(item.id);
        const isSelected = selectedItem === item.id;
        const formattedNo = `No.${String(item.dexNo || 0).padStart(4, '0')}`;
        const rarityCfg = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.N;
        const isHighRarity = isAcquired && ['SR', 'UR', 'LR'].includes(item.rarity);

        return (
          <div 
            key={item.id} 
            onClick={() => isAcquired && setSelectedItem(item.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #e2e8f0',
              background: isSelected ? '#eff6ff' : isHighRarity ? 'rgba(254, 243, 199, 0.15)' : 'white', 
              cursor: isAcquired ? 'pointer' : 'not-allowed',
              opacity: isAcquired ? 1 : 0.5, 
              borderLeft: isSelected 
                ? `4px solid ${rarityCfg.color}` 
                : isHighRarity 
                  ? `3px solid ${rarityCfg.border}` 
                  : '3px solid transparent'
            }}
          >
            <div style={{ 
              fontSize: '1.5rem', 
              filter: isAcquired ? (isHighRarity ? `drop-shadow(0 0 6px ${rarityCfg.color}88)` : 'none') : 'grayscale(100%) brightness(0.5)' 
            }}>
              {isAcquired ? item.icon : '❓'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#64748b' }}>
                  {formattedNo}
                </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  ...(isAcquired 
                    ? (isHighRarity ? getRarityTextStyle(item.rarity) : { color: '#1e293b' })
                    : { color: '#94a3b8' })
                }}>
                  {isAcquired ? item.name : '？？？？？？'}
                </span>
              </div>
              {isAcquired && (
                <div style={{ marginTop: '3px' }}>
                  <span style={getRarityBadgeStyle(item.rarity)}>
                    {rarityCfg.sparkle && <span>{rarityCfg.sparkle}</span>}
                    <span>{item.rarity}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      });
    } else {
      let displayEnemies = ENEMIES.filter(e => !ownedOnly || encounteredEnemies.includes(e.id));
      displayEnemies.sort((a, b) => (a.dexNo || 0) - (b.dexNo || 0));
      if (displayEnemies.length === 0) {
        return (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>
            まだ遭遇したエネミーがいません。<br />パトロールに出かけよう🐰
          </div>
        );
      }
      return displayEnemies.map(enemy => {
        const isEncountered = encounteredEnemies.includes(enemy.id);
        const isSelected = selectedEnemy === enemy.id;
        const formattedNo = `No.${String(enemy.dexNo || 0).padStart(3, '0')}`;
        return (
          <div 
            key={enemy.id} 
            onClick={() => isEncountered && setSelectedEnemy(enemy.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #e2e8f0',
              background: isSelected ? '#eff6ff' : 'white', cursor: isEncountered ? 'pointer' : 'not-allowed',
              opacity: isEncountered ? 1 : 0.5, borderLeft: isSelected ? `4px solid ${getEnemyColor(enemy.type)}` : '4px solid transparent'
            }}
          >
            <div style={{ fontSize: '1.5rem', filter: isEncountered ? 'none' : 'grayscale(100%) brightness(0.5)' }}>
              {isEncountered ? enemy.icon : '❓'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#64748b' }}>
                  {formattedNo}
                </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: isEncountered ? '#1e293b' : '#94a3b8', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  ...(isEncountered && enemy.type !== 'normal' ? getEnemyStyle(enemy.type) : {})
                }}>
                  {isEncountered ? enemy.name : '？？？？？？'}
                </span>
              </div>
              {isEncountered && (
                <div style={{ marginTop: '3px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: enemy.type === 'rare' 
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                      : enemy.type === 'elite' 
                        ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                        : '#64748b',
                    color: 'white',
                    boxShadow: enemy.type === 'rare' ? '0 0 8px rgba(239, 68, 68, 0.4)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}>
                    {enemy.type === 'rare' ? '🔥 RARE' : enemy.type === 'elite' ? '⚡ ELITE' : 'NORMAL'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      });
    }
  };

  // 右側ペインの詳細レンダリング
  const renderDetail = () => {
    if (tab === 'items' && selectedItem) {
      const item = ITEMS.find(i => i.id === selectedItem);
      if (!item) return null;
      const rarityCfg = RARITY_CONFIG[item.rarity] || RARITY_CONFIG.N;
      const isHighRarity = ['SR', 'UR', 'LR'].includes(item.rarity);

      return (
        <div style={{ padding: isMobile ? '16px 12px' : '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
          {isMobile && (
            <button
              onClick={() => { setSelectedItem(null); setSelectedEnemy(null); }}
              style={{
                alignSelf: 'flex-start',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#334155',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <span>←</span>
              <span>一覧に戻る</span>
            </button>
          )}
          <div style={{ 
            fontSize: isMobile ? '4rem' : '5rem', 
            marginBottom: '12px', 
            filter: isHighRarity 
              ? `drop-shadow(0 0 16px ${rarityCfg.color}99)` 
              : 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' 
          }}>
            {item.icon}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '2px' }}>
            No.{String(item.dexNo || 0).padStart(4, '0')}
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            textAlign: 'center',
            ...getRarityTextStyle(item.rarity)
          }}>
            {item.name}
          </div>
          <div style={{ 
            ...getRarityBadgeStyle(item.rarity),
            padding: '5px 14px', 
            borderRadius: '16px', 
            fontSize: '0.85rem', 
            marginBottom: '16px' 
          }}>
            {rarityCfg.sparkle && <span>{rarityCfg.sparkle}</span>}
            <span>{item.rarity} {item.type === 'weapon' ? '武器' : item.type === 'armor' ? '防具' : item.type === 'accessory' ? '装飾' : 'お供'}</span>
          </div>
          
          <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '16px' }}>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>ATK</div><div style={{ fontWeight: 'bold', color: '#ef4444' }}>{item.atk || 0}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>DEF</div><div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.def || 0}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>HP</div><div style={{ fontWeight: 'bold', color: '#10b981' }}>{item.hp || 0}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>必要Lv</div><div style={{ fontWeight: 'bold', color: '#059669' }}>{getReqLevel(item)}</div></div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
              {item.desc}
            </div>
          </div>
          
          {item.effect && (
            <div style={{ width: '100%', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 'bold', marginBottom: '4px' }}>✨ 特殊能力</div>
              <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 'bold', marginBottom: '4px' }}>
                {getItemEffectDescription(item) || '【特殊効果あり】'}
              </div>
              {item.effectMsg && (
                <div style={{ fontSize: '0.75rem', color: '#b45309', fontStyle: 'italic' }}>
                  発動時: {item.effectMsg}
                </div>
              )}
            </div>
          )}
        </div>
      );
    } else if (tab === 'enemies' && selectedEnemy) {
      const enemy = ENEMIES.find(e => e.id === selectedEnemy);
      if (!enemy) return null;
      return (
        <div style={{ padding: isMobile ? '16px 12px' : '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
          {isMobile && (
            <button
              onClick={() => { setSelectedItem(null); setSelectedEnemy(null); }}
              style={{
                alignSelf: 'flex-start',
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: '#334155',
                cursor: 'pointer',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <span>←</span>
              <span>一覧に戻る</span>
            </button>
          )}
          <div style={{ 
            fontSize: isMobile ? '4rem' : '5rem', 
            marginBottom: '12px', 
            filter: enemy.type === 'rare' 
              ? 'drop-shadow(0 0 16px rgba(239, 68, 68, 0.7))' 
              : enemy.type === 'elite' 
                ? 'drop-shadow(0 0 12px rgba(2, 132, 199, 0.6))' 
                : 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' 
          }}>
            {enemy.icon}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '2px' }}>
            No.{String(enemy.dexNo || 0).padStart(3, '0')}
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.25rem' : '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '8px', 
            textAlign: 'center',
            ...getEnemyStyle(enemy.type)
          }}>
            {enemy.name}
          </div>
          <div style={{ 
            padding: '5px 14px', 
            borderRadius: '16px', 
            fontSize: '0.85rem', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            background: enemy.type === 'rare' 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
              : enemy.type === 'elite' 
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                : '#64748b',
            color: 'white',
            boxShadow: enemy.type === 'rare' ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
          }}>
            {enemy.type === 'rare' ? '🔥 RARE ENEMY' : enemy.type === 'elite' ? '⚡ ELITE ENEMY' : 'NORMAL ENEMY'}
          </div>
          
          <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', marginBottom: '16px' }}>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>基本 ATK</div><div style={{ fontWeight: 'bold', color: '#ef4444' }}>{enemy.atk || 0}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>基本 DEF</div><div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{enemy.def || 0}</div></div>
              <div><div style={{ fontSize: '0.75rem', color: '#64748b' }}>基本 HP</div><div style={{ fontWeight: 'bold', color: '#10b981' }}>{enemy.hp || 0}</div></div>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
              {enemy.desc}
            </div>
          </div>
          
          {enemy.skills && enemy.skills.length > 0 && (
            <div style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold', marginBottom: '6px' }}>⚡ 固有スキル</div>
              {enemy.skills.map((s, idx) => (
                <div key={idx} style={{ marginBottom: idx < enemy.skills.length - 1 ? '8px' : 0 }}>
                  <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>『{s.name}』</div>
                  <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>{s.desc || s.msg}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>※遭遇時のレベルによってステータスは変動します。</div>
        </div>
      );
    }
    
    // 未選択時
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👈</div>
        <div>リストから選択してください</div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '8px 4px' : '16px' }}>
      <div style={{ background: '#f8fafc', width: '100%', maxWidth: '800px', height: isMobile ? '92vh' : '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
        
        {/* ヘッダー */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: isMobile ? '12px 16px' : '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.25rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            📖 みんクエ大図鑑
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '0 4px' }}>×</button>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#f1f5f9' }}>
          <button 
            onClick={() => { setTab('items'); setSelectedItem(null); setSelectedEnemy(null); }}
            style={{ flex: 1, padding: isMobile ? '10px 6px' : '12px', background: tab === 'items' ? 'white' : 'transparent', border: 'none', fontWeight: 'bold', fontSize: isMobile ? '0.78rem' : '0.9rem', borderBottom: tab === 'items' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🎁 収集アイテム ({collectedItems} / {totalItems})
          </button>
          <button 
            onClick={() => { setTab('enemies'); setSelectedItem(null); setSelectedEnemy(null); }}
            style={{ flex: 1, padding: isMobile ? '10px 6px' : '12px', background: tab === 'enemies' ? 'white' : 'transparent', border: 'none', fontWeight: 'bold', fontSize: isMobile ? '0.78rem' : '0.9rem', borderBottom: tab === 'enemies' ? '3px solid #ef4444' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            👾 エネミー ({collectedEnemies} / {totalEnemies})
          </button>
        </div>

        {/* メインコンテンツ (PC: 左右2ペイン / スマホ: リスト ⇔ 詳細 切り替え) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* 左ペイン: リスト */}
          <div style={{
            width: isMobile ? '100%' : '42%',
            display: isMobile && (selectedItem || selectedEnemy) ? 'none' : 'flex',
            borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
            background: 'white',
            flexDirection: 'column'
          }}>
            {/* 絞り込みUI */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tab === 'items' && (
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch' }}>
                  {TYPE_FILTERS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTypeFilter(t.key)}
                      style={{
                        padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                        border: typeFilter === t.key ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                        background: typeFilter === t.key ? '#3b82f6' : 'white',
                        color: typeFilter === t.key ? 'white' : '#475569'
                      }}
                    >
                      {t.label} <span style={{ fontWeight: 'normal', opacity: 0.85 }}>{typeCounts(t.key)}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
                  {tab === 'items' ? '入手済みだけ表示' : '遭遇済みだけ表示'}
                </label>
                {tab === 'items' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>並び順:</span>
                    <select 
                      value={sortOrder} 
                      onChange={(e) => setSortOrder(e.target.value)}
                      style={{ padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.72rem', background: 'white' }}
                    >
                      <option value="default">図鑑番号順</option>
                      <option value="rarityDesc">レア順 (高)</option>
                      <option value="rarityAsc">レア順 (低)</option>
                      <option value="reqLevelAsc">必要Lv順 (低)</option>
                      <option value="reqLevelDesc">必要Lv順 (高)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderList()}
            </div>
          </div>
          
          {/* 右ペイン: 詳細 */}
          <div style={{
            width: isMobile ? '100%' : '58%',
            display: isMobile && !selectedItem && !selectedEnemy ? 'none' : 'block',
            background: '#f8fafc',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {renderDetail()}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DictionaryModal;
