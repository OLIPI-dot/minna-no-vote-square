import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  rollGacha, 
  getReqLevel, 
  EFFECT_DESCRIPTIONS, 
  ITEMS, 
  syncItemWithMaster, 
  getItemEffectDescription,
  getRarityColor,
  getRarityTextStyle,
  getRarityBadgeStyle,
  RARITY_CONFIG
} from '../items';
import confetti from 'canvas-confetti';


// 保存データに desc や effect が無い古いアイテムでも、マスターデータ(IDまたは名前)から確実に補完する
const getItemDetails = (item) => {
  if (!item) return { desc: '', effect: null };
  const baseId = typeof item?.id === 'string' ? item.id.split('_')[0] : item?.id;
  const master = ITEMS.find(i => (baseId && i.id === baseId) || (i.name && i.name === item.name));
  return {
    desc: item.desc || master?.desc || '',
    effect: item.effect || master?.effect || null
  };
};

const getEffectKey = (item) => {
  return getItemDetails(item).effect;
};

const getItemDesc = (item) => {
  return getItemDetails(item).desc;
};

const GachaMiniGame = ({ userLevel = 1, gachaTickets, addTickets, equipment, setEquipment, addExp, inventory = [], setInventory, acquiredItems = [], setAcquiredItems }) => {
  const [gachaResult, setGachaResult] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const COST = 1; // 1回1チケット

  const handleRoll = () => {
    if (gachaTickets < COST || isRolling) return;

    // 前回の結果が表示されたままなら、自動で鞄にしまう
    if (gachaResult) {
      const prevItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
      setInventory(prev => [...prev, prevItem]);
      if (setAcquiredItems && !acquiredItems.includes(gachaResult.id)) {
        setAcquiredItems(prev => [...prev, gachaResult.id]);
      }
    }
    
    setIsRolling(true);
    addTickets(-COST); // チケット消費
    setGachaResult(null);

    // ガチャ演出
    setTimeout(() => {
      const item = rollGacha();
      setGachaResult(item);
      
      // LR, UR, SRなら派手なエフェクト
      if (item.rarity === 'LR' || item.rarity === 'UR' || item.rarity === 'SR') {
        confetti({
          particleCount: item.rarity === 'LR' ? 300 : item.rarity === 'UR' ? 200 : 100,
          spread: 80,
          colors: item.rarity === 'LR' 
            ? ['#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'] 
            : item.rarity === 'UR' ? ['#f59e0b', '#fbbf24', '#fffbeb'] : ['#ec4899', '#fbcfe8'],
          zIndex: 9999
        });
      }

      setIsRolling(false);
    }, 800);
  };

  const handleEquipFromGacha = () => {
    const newItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
    const oldItem = equipment[newItem.type];
    
    setEquipment(prev => ({ ...prev, [newItem.type]: newItem }));
    if (oldItem) setInventory(prev => [...prev, oldItem]);
    if (setAcquiredItems && !acquiredItems.includes(newItem.id.split('_')[0])) {
      setAcquiredItems(prev => [...prev, newItem.id.split('_')[0] || newItem.id]);
    }
    
    setGachaResult(null);
  };

  const handleStoreInInventory = () => {
    const newItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
    setInventory(prev => [...prev, newItem]);
    if (setAcquiredItems && !acquiredItems.includes(gachaResult.id)) {
      setAcquiredItems(prev => [...prev, gachaResult.id]);
    }
    setGachaResult(null);
  };

  const equipFromInventory = (invItem) => {
    const oldItem = equipment[invItem.type];
    
    setEquipment(prev => ({ ...prev, [invItem.type]: invItem }));
    
    setInventory(prev => {
      const filtered = prev.filter(i => i.id !== invItem.id);
      if (oldItem) return [...filtered, oldItem];
      return filtered;
    });
  };

  const handleUnequip = (type) => {
    const oldItem = equipment[type];
    if (oldItem) setInventory(prev => [...prev, oldItem]);
    
    setEquipment(prev => ({ ...prev, [type]: null }));
    setSelectedSlot(null);
  };
  
  const handleSellFromInventory = (invItem) => {
    const expBack = getRecycleExp(invItem.rarity);
    addExp(expBack);
    setInventory(prev => prev.filter(i => i.id !== invItem.id));
  };

  const renderEquipSlot = (type, label) => {
    const item = equipment[type];
    
    // ツールチップ用のテキスト生成
    let tooltipText = "装備なし";
    if (item) {
      tooltipText = `[${item.rarity}] ${item.name}\n`;
      if (item.atk > 0) tooltipText += `ATK: +${item.atk}\n`;
      if (item.def > 0) tooltipText += `DEF: +${item.def}\n`;
      if (item.hp > 0) tooltipText += `HP: +${item.hp}\n`;
      if (item.effect) tooltipText += `\n✨ ${getItemEffectDescription(item)}\n`;
      tooltipText += `\n${item.desc}`;
    }

    return (
      <div 
        onClick={() => setSelectedSlot(type)}
        title={tooltipText}
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'white'; }}
      >
        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        {item ? (
          <div>
            <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
            <div style={{ 
              fontSize: '0.7rem', 
              fontWeight: 'bold', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              ...(['SR', 'UR', 'LR'].includes(item.rarity) ? getRarityTextStyle(item.rarity) : { color: getRarityColor(item.rarity) })
            }}>
              [{item.rarity}] {item.name}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
              {item.atk > 0 && `ATK+${item.atk} `}
              {item.def > 0 && `DEF+${item.def} `}
              {item.hp > 0 && `HP+${item.hp}`}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', padding: '8px 0' }}>装備なし</div>
        )}
      </div>
    );
  };

  const getRecycleExp = (rarity) => {
    switch(rarity) {
      case 'LR': return 9999; // 絶対売らないだろうけど
      case 'UR': return 8;
      case 'SR': return 5;
      case 'R': return 3;
      default: return 1;
    }
  };

  const handleRecycle = () => {
    const expBack = getRecycleExp(gachaResult.rarity);
    addExp(expBack); // 売却時は少量のEXPにする
    setGachaResult(null);
  };

  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', padding: '12px', marginBottom: '24px' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🎁 広場ガチャ ＆ 装備
      </h4>

      {/* 現在の装備 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {renderEquipSlot('weapon', '武器')}
        {renderEquipSlot('armor', '防具')}
        {renderEquipSlot('accessory', 'アクセ')}
        {renderEquipSlot('partner', 'お供')}
      </div>

      {/* ガチャ結果モーダル風 */}
      {gachaResult && (
        <div style={{ 
          background: '#fffbeb', 
          border: `2px solid ${getRarityColor(gachaResult.rarity)}`, 
          borderRadius: '8px', 
          padding: '12px', 
          textAlign: 'center', 
          marginBottom: '12px', 
          animation: 'fadeIn 0.3s',
          boxShadow: ['SR', 'UR', 'LR'].includes(gachaResult.rarity) ? RARITY_CONFIG[gachaResult.rarity]?.boxGlow : 'none'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>ガチャ結果！</div>
          <div style={{ 
            fontSize: '2.5rem', 
            margin: '8px 0',
            filter: ['SR', 'UR', 'LR'].includes(gachaResult.rarity) ? `drop-shadow(0 0 10px ${getRarityColor(gachaResult.rarity)}99)` : 'none'
          }}>
            {gachaResult.icon}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={getRarityBadgeStyle(gachaResult.rarity)}>
              {RARITY_CONFIG[gachaResult.rarity]?.sparkle && <span>{RARITY_CONFIG[gachaResult.rarity]?.sparkle}</span>}
              <span>{gachaResult.rarity}</span>
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', ...getRarityTextStyle(gachaResult.rarity) }}>
              {gachaResult.name}
            </span>
            <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
              {{ weapon: '🗡️ 武器', armor: '🛡️ 防具', accessory: '💍 アクセ', partner: '👤 お供' }[gachaResult.type] || gachaResult.type}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569', margin: '6px 0' }}>
            ATK+{gachaResult.atk} / DEF+{gachaResult.def} / HP+{gachaResult.hp}<br/>
            <span style={{ color: userLevel >= getReqLevel(gachaResult) ? '#059669' : '#ef4444', fontWeight: 'bold' }}>
              必要Lv: {getReqLevel(gachaResult)}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#854d0e', background: '#fef3c7', padding: '6px', borderRadius: '4px', marginBottom: '4px', fontStyle: 'italic' }}>
            「{gachaResult.desc}」
          </div>
          {gachaResult.effect && (
            <div style={{ fontSize: '0.8rem', color: '#92400e', background: '#fffbeb', border: '1px dashed #f59e0b', padding: '6px', borderRadius: '4px', marginBottom: '10px', fontWeight: 'bold' }}>
              ✨ {getItemEffectDescription(gachaResult)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handleEquipFromGacha} 
              disabled={userLevel < getReqLevel(gachaResult)}
              style={{ padding: '6px 12px', background: userLevel >= getReqLevel(gachaResult) ? '#10b981' : '#94a3b8', color: 'white', border: 'none', borderRadius: '6px', cursor: userLevel >= getReqLevel(gachaResult) ? 'pointer' : 'not-allowed', fontWeight: 'bold', flex: '1' }}>
              {userLevel >= getReqLevel(gachaResult) ? 'すぐ装備' : `Lv.${getReqLevel(gachaResult)}必要`}
            </button>
            <button onClick={handleStoreInInventory} style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: '1' }}>
              👜しまう
            </button>
            <button onClick={handleRecycle} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              売却 (+{getRecycleExp(gachaResult.rarity)} EXP)
            </button>
          </div>
        </div>
      )}

      {/* 装備変更モーダル */}
      {selectedSlot && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '10px' }}>
          <div style={{ background: '#fff', padding: '14px 16px', borderRadius: '14px', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{selectedSlot === 'weapon' ? '🗡️ 武器' : selectedSlot === 'armor' ? '🛡️ 防具' : selectedSlot === 'accessory' ? '💍 アクセ' : '👤 お供'}の変更</span>
              <button onClick={() => setSelectedSlot(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, color: '#64748b' }}>×</button>
            </h3>

            {/* 現在の装備（スリム＆コンパクト表示でカバンの視界を広げる） */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>現在の装備</div>
              {equipment[selectedSlot] ? (
                <div style={{ 
                  background: '#f8fafc', 
                  border: `2px solid ${getRarityColor(equipment[selectedSlot].rarity)}`, 
                  borderRadius: '8px', 
                  padding: '7px 10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  boxShadow: ['SR', 'UR', 'LR'].includes(equipment[selectedSlot].rarity) ? RARITY_CONFIG[equipment[selectedSlot].rarity]?.boxGlow : 'none'
                }}>
                  <div style={{ fontSize: '1.7rem', flexShrink: 0, lineHeight: 1 }}>{equipment[selectedSlot].icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <span style={getRarityBadgeStyle(equipment[selectedSlot].rarity)}>
                        {RARITY_CONFIG[equipment[selectedSlot].rarity]?.sparkle && <span>{RARITY_CONFIG[equipment[selectedSlot].rarity]?.sparkle}</span>}
                        <span>{equipment[selectedSlot].rarity}</span>
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...getRarityTextStyle(equipment[selectedSlot].rarity) }}>
                        {equipment[selectedSlot].name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px', fontWeight: 'bold' }}>
                      ATK+{equipment[selectedSlot].atk} / DEF+{equipment[selectedSlot].def} / HP+{equipment[selectedSlot].hp}
                    </div>
                    {getEffectKey(equipment[selectedSlot]) && (
                      <div style={{ fontSize: '0.66rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '2px 5px', marginTop: '2px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        ✨ {getItemEffectDescription(equipment[selectedSlot])}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleUnequip(selectedSlot)} style={{ padding: '5px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.72rem', flexShrink: 0 }}>外す</button>
                </div>
              ) : (
                <div style={{ background: '#f1f5f9', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                  装備なし
                </div>
              )}
            </div>

            {/* カバンの中身 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                カバンの中 ({inventory.filter(i => i.type === selectedSlot).length}個)
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px', minHeight: '180px' }}>
              {inventory.filter(i => i.type === selectedSlot).length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '0.75rem' }}>装備可能なアイテムがありません</div>
              ) : (
                inventory.filter(i => i.type === selectedSlot).map(rawItem => {
                  const item = syncItemWithMaster(rawItem);
                  const currentEquip = syncItemWithMaster(equipment[selectedSlot]);
                  const diffAtk = item.atk - (currentEquip ? currentEquip.atk : 0);
                  const diffDef = item.def - (currentEquip ? currentEquip.def : 0);
                  const diffHp = item.hp - (currentEquip ? currentEquip.hp : 0);

                  const renderDiff = (diff) => {
                    if (diff > 0) return <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '2px' }}>(+{diff})</span>;
                    if (diff < 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>({diff})</span>;
                    return <span style={{ color: '#94a3b8', marginLeft: '2px' }}>(±0)</span>;
                  };

                  return (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 10px', 
                      background: 'white', 
                      border: `1.5px solid ${getRarityColor(item.rarity)}`, 
                      borderRadius: '8px', 
                      boxShadow: ['SR', 'UR', 'LR'].includes(item.rarity) ? RARITY_CONFIG[item.rarity]?.boxGlow : '0 1px 3px rgba(0,0,0,0.06)' 
                    }}>
                      <div style={{ fontSize: '1.5rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                          <span style={getRarityBadgeStyle(item.rarity)}>
                            {RARITY_CONFIG[item.rarity]?.sparkle && <span>{RARITY_CONFIG[item.rarity]?.sparkle}</span>}
                            <span>{item.rarity}</span>
                          </span>
                          <span style={{ fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...getRarityTextStyle(item.rarity) }}>
                            {item.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                          <span>ATK: {item.atk}{renderDiff(diffAtk)}</span>
                          <span>DEF: {item.def}{renderDiff(diffDef)}</span>
                          <span>HP: {item.hp}{renderDiff(diffHp)}</span>
                          <span style={{ color: userLevel >= getReqLevel(item) ? '#059669' : '#ef4444', fontWeight: 'bold', marginLeft: 'auto', fontSize: '0.68rem' }}>
                            必要Lv: {getReqLevel(item)}
                          </span>
                        </div>
                        {getEffectKey(item) && (
                          <div style={{ fontSize: '0.66rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '2px 5px', marginTop: '2px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ✨ {getItemEffectDescription(item)}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => { equipFromInventory(item); setSelectedSlot(null); }} 
                        disabled={userLevel < getReqLevel(item)}
                        style={{ background: userLevel >= getReqLevel(item) ? '#10b981' : '#94a3b8', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: userLevel >= getReqLevel(item) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>
                        {userLevel >= getReqLevel(item) ? '装備' : `Lv${getReqLevel(item)}`}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* インベントリモーダル */}
      {showInventory && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '10px' }}>
          <div style={{ background: '#fff', padding: '14px 16px', borderRadius: '14px', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👜 インベントリ ({inventory.length}個)</span>
              <button onClick={() => setShowInventory(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, color: '#64748b' }}>×</button>
            </h3>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
              {inventory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: '0.8rem' }}>アイテムがありません</div>
              ) : (
                inventory.map(rawItem => {
                  const item = syncItemWithMaster(rawItem);
                  const currentEquip = syncItemWithMaster(equipment[item.type]);
                  const diffAtk = item.atk - (currentEquip ? currentEquip.atk : 0);
                  const diffDef = item.def - (currentEquip ? currentEquip.def : 0);
                  const diffHp = item.hp - (currentEquip ? currentEquip.hp : 0);

                  const renderDiff = (diff) => {
                    if (diff > 0) return <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '2px' }}>(+{diff})</span>;
                    if (diff < 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>({diff})</span>;
                    return <span style={{ color: '#94a3b8', marginLeft: '2px' }}>(±0)</span>;
                  };

                  const typeLabels = { weapon: '🗡️ 武器', armor: '🛡️ 防具', accessory: '💍 アクセ', partner: '👤 お供' };

                  return (
                    <div key={item.id} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 10px', 
                      background: '#f8fafc', 
                      border: `1.5px solid ${getRarityColor(item.rarity)}`, 
                      borderRadius: '8px',
                      boxShadow: ['SR', 'UR', 'LR'].includes(item.rarity) ? RARITY_CONFIG[item.rarity]?.boxGlow : 'none'
                    }}>
                      <div style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={getRarityBadgeStyle(item.rarity)}>
                            {RARITY_CONFIG[item.rarity]?.sparkle && <span>{RARITY_CONFIG[item.rarity]?.sparkle}</span>}
                            <span>{item.rarity}</span>
                          </span>
                          <span style={{ fontWeight: 'bold', ...getRarityTextStyle(item.rarity) }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                            {typeLabels[item.type] || item.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px', marginBottom: '2px' }}>
                          <span>ATK: {item.atk}{renderDiff(diffAtk)}</span>
                          <span>DEF: {item.def}{renderDiff(diffDef)}</span>
                          <span>HP: {item.hp}{renderDiff(diffHp)}</span>
                          <span style={{ color: userLevel >= getReqLevel(item) ? '#059669' : '#ef4444', fontWeight: 'bold', marginLeft: 'auto' }}>
                            必要Lv: {getReqLevel(item)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.desc}</div>
                        {getEffectKey(item) && (
                          <div style={{ fontSize: '0.7rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 6px', marginTop: '4px', fontWeight: 'bold', lineHeight: 1.4 }}>
                            ✨ {getItemEffectDescription(item)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button 
                          onClick={() => equipFromInventory(item)} 
                          disabled={userLevel < getReqLevel(item)}
                          style={{ background: userLevel >= getReqLevel(item) ? '#10b981' : '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: userLevel >= getReqLevel(item) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          {userLevel >= getReqLevel(item) ? '装備' : `Lv${getReqLevel(item)}`}
                        </button>
                        <button onClick={() => handleSellFromInventory(item)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          売却
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ガチャ＆インベントリボタン */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={handleRoll}
          disabled={gachaTickets < COST || isRolling}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: gachaTickets >= COST && !isRolling ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#e2e8f0',
            color: gachaTickets >= COST && !isRolling ? 'white' : '#94a3b8',
            fontWeight: 'bold', cursor: gachaTickets >= COST && !isRolling ? 'pointer' : 'not-allowed',
            boxShadow: gachaTickets >= COST && !isRolling ? '0 4px 6px -1px rgba(245, 158, 11, 0.4)' : 'none'
          }}
        >
          {isRolling ? '...' : `🎫 回す(1枚)`}
        </button>
        <button 
          onClick={() => setShowInventory(true)}
          style={{
            padding: '10px 16px', borderRadius: '8px', border: 'none',
            background: '#3b82f6', color: 'white',
            fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
          }}
        >
          👜 鞄
        </button>
      </div>
    </div>
  );
};

export default GachaMiniGame;
