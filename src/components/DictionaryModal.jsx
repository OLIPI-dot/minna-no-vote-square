import React, { useState } from 'react';
import { ITEMS, EFFECT_DESCRIPTIONS, getReqLevel } from '../items';
import { ENEMIES } from '../enemies';

const DictionaryModal = ({ isOpen, onClose, acquiredItems = [], encounteredEnemies = [] }) => {
  const [tab, setTab] = useState('items'); // 'items' | 'enemies'
  const [selectedItem, setSelectedItem] = useState(null); // 選択中のアイテムID
  const [selectedEnemy, setSelectedEnemy] = useState(null); // 選択中のエネミーID
  const [sortOrder, setSortOrder] = useState('default'); // 'default' | 'rarityDesc' | 'rarityAsc'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'weapon' | 'armor' | 'accessory' | 'partner'
  const [ownedOnly, setOwnedOnly] = useState(false); // 入手済み(エネミーは遭遇済み)のみ表示

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

  const getRarityColor = (rarity) => {
    const colors = { N: '#94a3b8', R: '#3b82f6', SR: '#eab308', UR: '#ec4899', LR: '#ef4444' };
    return colors[rarity] || '#333';
  };

  const getEnemyColor = (type) => {
    const colors = { normal: '#334155', elite: '#0ea5e9', rare: '#ef4444' };
    return colors[type] || '#333';
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
        return (
          <div 
            key={item.id} 
            onClick={() => isAcquired && setSelectedItem(item.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #e2e8f0',
              background: isSelected ? '#eff6ff' : 'white', cursor: isAcquired ? 'pointer' : 'not-allowed',
              opacity: isAcquired ? 1 : 0.5, borderLeft: isSelected ? `4px solid ${getRarityColor(item.rarity)}` : '4px solid transparent'
            }}
          >
            <div style={{ fontSize: '1.5rem', filter: isAcquired ? 'none' : 'grayscale(100%) brightness(0.5)' }}>
              {isAcquired ? item.icon : '❓'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#64748b' }}>
                  {formattedNo}
                </span>
                <span style={{ fontWeight: 'bold', color: isAcquired ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isAcquired ? item.name : '？？？？？？'}
                </span>
              </div>
              {isAcquired && (
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getRarityColor(item.rarity) }}>
                  [{item.rarity}]
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
                <span style={{ fontWeight: 'bold', color: isEncountered ? '#1e293b' : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isEncountered ? enemy.name : '？？？？？？'}
                </span>
              </div>
              {isEncountered && (
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: getEnemyColor(enemy.type) }}>
                  [{enemy.type.toUpperCase()}]
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
      return (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
          <div style={{ fontSize: '5rem', marginBottom: '16px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{item.icon}</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '2px' }}>
            No.{String(item.dexNo || 0).padStart(4, '0')}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>{item.name}</div>
          <div style={{ background: getRarityColor(item.rarity), color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '24px' }}>
            {item.rarity} {item.type === 'weapon' ? '武器' : item.type === 'armor' ? '防具' : item.type === 'accessory' ? '装飾' : 'お供'}
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
                {EFFECT_DESCRIPTIONS[item.effect] || '【謎の力】効果は未知数だ'}
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 0.3s' }}>
          <div style={{ fontSize: '5rem', marginBottom: '16px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{enemy.icon}</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '2px' }}>
            No.{String(enemy.dexNo || 0).padStart(3, '0')}
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', textAlign: 'center' }}>{enemy.name}</div>
          <div style={{ background: getEnemyColor(enemy.type), color: 'white', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '24px' }}>
            {enemy.type.toUpperCase()}
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#f8fafc', width: '100%', maxWidth: '800px', height: '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
        
        {/* ヘッダー */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            📖 みんクエ大図鑑
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', background: '#f1f5f9' }}>
          <button 
            onClick={() => { setTab('items'); setSelectedEnemy(null); }}
            style={{ flex: 1, padding: '12px', background: tab === 'items' ? 'white' : 'transparent', border: 'none', fontWeight: 'bold', borderBottom: tab === 'items' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            🎁 収集アイテム ({collectedItems} / {totalItems})
          </button>
          <button 
            onClick={() => { setTab('enemies'); setSelectedItem(null); }}
            style={{ flex: 1, padding: '12px', background: tab === 'enemies' ? 'white' : 'transparent', border: 'none', fontWeight: 'bold', borderBottom: tab === 'enemies' ? '3px solid #ef4444' : '3px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            👾 エネミー ({collectedEnemies} / {totalEnemies})
          </button>
        </div>

        {/* メインコンテンツ (左右2ペイン) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左ペイン: リスト */}
          <div style={{ width: '40%', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
            {/* 絞り込みUI（種類チップ＋入手済みトグル＋並び順） */}
            <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tab === 'items' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {TYPE_FILTERS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTypeFilter(t.key)}
                      style={{
                        padding: '4px 8px', borderRadius: '14px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap',
                        border: typeFilter === t.key ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                        background: typeFilter === t.key ? '#3b82f6' : 'white',
                        color: typeFilter === t.key ? 'white' : '#475569'
                      }}
                    >
                      {t.label} <span style={{ fontWeight: 'normal', opacity: 0.85 }}>{typeCounts(t.key)}</span>
                    </button>
                  ))}
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 'bold', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={ownedOnly} onChange={(e) => setOwnedOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
                {tab === 'items' ? '入手済みだけ表示' : '遭遇済みだけ表示'}
              </label>
              {tab === 'items' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>並び順:</span>
                  <select 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ flex: 1, padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: 'white' }}
                  >
                    <option value="default">図鑑番号順</option>
                    <option value="rarityDesc">レアリティ順 (高い順)</option>
                    <option value="rarityAsc">レアリティ順 (低い順)</option>
                    <option value="reqLevelAsc">必要Lv順 (低い順)</option>
                    <option value="reqLevelDesc">必要Lv順 (高い順)</option>
                  </select>
                </div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {renderList()}
            </div>
          </div>
          
          {/* 右ペイン: 詳細 */}
          <div style={{ width: '60%', background: '#f8fafc', overflowY: 'auto', position: 'relative' }}>
            {renderDetail()}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default DictionaryModal;
