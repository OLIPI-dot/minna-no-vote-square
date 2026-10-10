import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { rollGacha } from '../items';
import confetti from 'canvas-confetti';

const rarityColors = {
  N: '#94a3b8',
  R: '#3b82f6',
  SR: '#ec4899',
  UR: '#f59e0b',
  LR: '#ef4444' // 真っ赤（PSO赤箱リスペクト）
};

const GachaMiniGame = ({ gachaTickets, addTickets, equipment, setEquipment, addExp, inventory = [], setInventory }) => {
  const [gachaResult, setGachaResult] = useState(null);
  const [showInventory, setShowInventory] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const COST = 1; // 1回1チケット

  const handleRoll = () => {
    if (gachaTickets < COST || isRolling) return;
    
    setIsRolling(true);
    addTickets(-COST); // チケット消費
    setGachaResult(null);

    // ガチャ演出
    setTimeout(() => {
      const item = rollGacha();
      setGachaResult(item);
      
      // URかSRなら派手なエフェクト
      if (item.rarity === 'UR' || item.rarity === 'SR') {
        confetti({
          particleCount: item.rarity === 'UR' ? 200 : 100,
          spread: 80,
          colors: item.rarity === 'UR' ? ['#f59e0b', '#fbbf24', '#fffbeb'] : ['#ec4899', '#fbcfe8'],
          zIndex: 9999
        });
      }

      setIsRolling(false);
    }, 1000);
  };

  const handleEquipFromGacha = () => {
    const newItem = { ...gachaResult, id: Date.now() + Math.random() };
    const oldItem = equipment[newItem.type];
    
    setEquipment(prev => ({ ...prev, [newItem.type]: newItem }));
    if (oldItem) setInventory(prev => [...prev, oldItem]);
    
    setGachaResult(null);
  };

  const handleStoreInInventory = () => {
    const newItem = { ...gachaResult, id: Date.now() + Math.random() };
    setInventory(prev => [...prev, newItem]);
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
    setSelectedEquip(null);
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
      tooltipText += `\n${item.desc}`;
    }

    return (
      <div 
        onClick={() => item && setSelectedEquip(selectedEquip?.type === item.type ? null : item)}
        title={tooltipText}
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', textAlign: 'center', cursor: item ? 'pointer' : 'default', transition: 'background 0.2s' }}
        onMouseOver={e => { if (item) e.currentTarget.style.background = '#f1f5f9'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'white'; }}
      >
        <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '4px' }}>{label}</div>
        {item ? (
          <div>
            <div style={{ fontSize: '1.2rem' }}>{item.icon}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: rarityColors[item.rarity], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
      </div>

      {/* ガチャ結果モーダル風 */}
      {gachaResult && (
        <div style={{ background: '#fffbeb', border: `2px solid ${rarityColors[gachaResult.rarity]}`, borderRadius: '8px', padding: '12px', textAlign: 'center', marginBottom: '12px', animation: 'fadeIn 0.3s' }}>
          <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>ガチャ結果！</div>
          <div style={{ fontSize: '2rem', margin: '8px 0' }}>{gachaResult.icon}</div>
          <div style={{ fontWeight: 'bold', color: rarityColors[gachaResult.rarity] }}>
            [{gachaResult.rarity}] {gachaResult.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569', margin: '6px 0' }}>
            ATK+{gachaResult.atk} / DEF+{gachaResult.def} / HP+{gachaResult.hp}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#854d0e', background: '#fef3c7', padding: '6px', borderRadius: '4px', marginBottom: '10px', fontStyle: 'italic' }}>
            「{gachaResult.desc}」
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleEquipFromGacha} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', flex: '1' }}>
              すぐ装備
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

      {/* 装備詳細モーダル (タップ時) */}
      {selectedEquip && (
        <div style={{ background: '#f8fafc', border: `2px solid ${rarityColors[selectedEquip.rarity]}`, borderRadius: '8px', padding: '12px', textAlign: 'center', marginBottom: '12px', animation: 'fadeIn 0.2s' }}>
          <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 'bold' }}>装備の詳細</div>
          <div style={{ fontSize: '2rem', margin: '8px 0' }}>{selectedEquip.icon}</div>
          <div style={{ fontWeight: 'bold', color: rarityColors[selectedEquip.rarity] }}>
            [{selectedEquip.rarity}] {selectedEquip.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#475569', margin: '6px 0' }}>
            ATK+{selectedEquip.atk} / DEF+{selectedEquip.def} / HP+{selectedEquip.hp}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#334155', background: '#e2e8f0', padding: '6px', borderRadius: '4px', marginBottom: '10px' }}>
            「{selectedEquip.desc}」
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setSelectedEquip(null)} style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              閉じる
            </button>
            <button onClick={() => handleUnequip(selectedEquip.type)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              外す（鞄へ）
            </button>
          </div>
        </div>
      )}

      {/* インベントリモーダル */}
      {showInventory && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', justifyContent: 'space-between' }}>
              <span>👜 インベントリ ({inventory.length}個)</span>
              <button onClick={() => setShowInventory(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </h3>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {inventory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>アイテムがありません</div>
              ) : (
                inventory.map(item => {
                  const currentEquip = equipment[item.type];
                  const diffAtk = item.atk - (currentEquip ? currentEquip.atk : 0);
                  const diffDef = item.def - (currentEquip ? currentEquip.def : 0);
                  const diffHp = item.hp - (currentEquip ? currentEquip.hp : 0);

                  const renderDiff = (diff) => {
                    if (diff > 0) return <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '2px' }}>(+{diff})</span>;
                    if (diff < 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>({diff})</span>;
                    return <span style={{ color: '#94a3b8', marginLeft: '2px' }}>(±0)</span>;
                  };

                  return (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', border: `1px solid ${rarityColors[item.rarity]}`, borderRadius: '8px' }}>
                      <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: rarityColors[item.rarity] }}>[{item.rarity}] {item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#475569', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px', marginBottom: '2px' }}>
                          <span>ATK: {item.atk}{renderDiff(diffAtk)}</span>
                          <span>DEF: {item.def}{renderDiff(diffDef)}</span>
                          <span>HP: {item.hp}{renderDiff(diffHp)}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.desc}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button onClick={() => equipFromInventory(item)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          装備
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
          disabled={gachaTickets < COST || isRolling || gachaResult}
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
