import React, { useState } from 'react';
import { rollGacha } from '../items';
import confetti from 'canvas-confetti';

const rarityColors = {
  N: '#94a3b8',
  R: '#3b82f6',
  SR: '#ec4899',
  UR: '#f59e0b',
  LR: '#ef4444' // 真っ赤（PSO赤箱リスペクト）
};

const GachaMiniGame = ({ gachaTickets, addTickets, equipment, setEquipment, addExp }) => {
  const [gachaResult, setGachaResult] = useState(null);
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

  const equipItem = (item) => {
    setEquipment(prev => ({
      ...prev,
      [item.type]: item
    }));
    setGachaResult(null);
  };

  const unequipItem = (type) => {
    setEquipment(prev => ({
      ...prev,
      [type]: null
    }));
    setSelectedEquip(null);
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
        onClick={() => item && setSelectedEquip(item)}
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => equipItem(gachaResult)} style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              装備する
            </button>
            <button onClick={handleRecycle} style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
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
            <button onClick={() => unequipItem(selectedEquip.type)} style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              外す
            </button>
          </div>
        </div>
      )}

      {/* ガチャボタン */}
      <button 
        onClick={handleRoll}
        disabled={gachaTickets < COST || isRolling || gachaResult}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
          background: gachaTickets >= COST && !isRolling ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#e2e8f0',
          color: gachaTickets >= COST && !isRolling ? 'white' : '#94a3b8',
          fontWeight: 'bold', cursor: gachaTickets >= COST && !isRolling ? 'pointer' : 'not-allowed',
          boxShadow: gachaTickets >= COST && !isRolling ? '0 4px 6px -1px rgba(245, 158, 11, 0.4)' : 'none'
        }}
      >
        {isRolling ? 'ガチャを回しています...' : `🎫 ガチャを回す (チケット${COST}枚)`}
      </button>
    </div>
  );
};

export default GachaMiniGame;
