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
  const [invSortType, setInvSortType] = useState('rarity'); // 'rarity' | 'type' | 'power' | 'newest'
  const [invFilterType, setInvFilterType] = useState('all'); // 'all' | 'weapon' | 'armor' | 'accessory' | 'partner'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const invListRef = React.useRef(null);
  const COST = 1; // 1回1チケット
  const MAX_INVENTORY = 300; // インベントリ上限枠数

  // 🎒 インベントリのフィルタリング＆ソート（同名まとめ対応）
  const RARITY_WEIGHT = { LR: 5, UR: 4, SR: 3, R: 2, N: 1 };
  const TYPE_ORDER = { weapon: 1, armor: 2, accessory: 3, partner: 4 };

  const processedInventory = React.useMemo(() => {
    let list = (inventory || []).map(raw => syncItemWithMaster(raw));

    if (invFilterType !== 'all') {
      list = list.filter(item => item && item.type === invFilterType);
    }

    return [...list].sort((a, b) => {
      if (!a || !b) return 0;

      if (invSortType === 'rarity') {
        // 1. レアリティ降順 (LR -> UR -> SR -> R -> N)
        const rDiff = (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0);
        if (rDiff !== 0) return rDiff;

        // 2. 同一レアリティ内: 同姓同名のアイテムを一緒にする（名前順）
        const nameDiff = (a.name || '').localeCompare(b.name || '', 'ja');
        if (nameDiff !== 0) return nameDiff;

        // 3. 同名アイテム内: タイムスタンプの新しい順
        const getTime = (it) => {
          const parts = (it.id || '').split('_');
          const ts = parseInt(parts[parts.length - 1], 10);
          return isNaN(ts) ? 0 : ts;
        };
        const tDiff = getTime(b) - getTime(a);
        if (tDiff !== 0) return tDiff;

        return (a.id || '').localeCompare(b.id || '');
      }

      if (invSortType === 'type') {
        // 種別順 (武器 -> 防具 -> アクセ -> お供)
        const tDiff = (TYPE_ORDER[a.type] || 0) - (TYPE_ORDER[b.type] || 0);
        if (tDiff !== 0) return tDiff;

        // 同種別内: レアリティ降順
        const rDiff = (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0);
        if (rDiff !== 0) return rDiff;

        // 同名まとめ
        const nameDiff = (a.name || '').localeCompare(b.name || '', 'ja');
        if (nameDiff !== 0) return nameDiff;

        return (a.id || '').localeCompare(b.id || '');
      }

      if (invSortType === 'power') {
        // 戦闘力（ATK + DEF + HP）降順
        const pA = (a.atk || 0) + (a.def || 0) + (a.hp || 0);
        const pB = (b.atk || 0) + (b.def || 0) + (b.hp || 0);
        const pDiff = pB - pA;
        if (pDiff !== 0) return pDiff;

        const rDiff = (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0);
        if (rDiff !== 0) return rDiff;

        return (a.name || '').localeCompare(b.name || '', 'ja');
      }

      if (invSortType === 'newest') {
        // 新しい順（タイムスタンプ降順）
        const getTime = (it) => {
          const parts = (it.id || '').split('_');
          const ts = parseInt(parts[parts.length - 1], 10);
          return isNaN(ts) ? 0 : ts;
        };
        const tDiff = getTime(b) - getTime(a);
        if (tDiff !== 0) return tDiff;
        return (a.id || '').localeCompare(b.id || '');
      }

      return 0;
    });
  }, [inventory, invFilterType, invSortType]);

  const filterCounts = React.useMemo(() => {
    const counts = { all: (inventory || []).length, weapon: 0, armor: 0, accessory: 0, partner: 0 };
    (inventory || []).forEach(raw => {
      const it = syncItemWithMaster(raw);
      if (it && counts[it.type] !== undefined) {
        counts[it.type]++;
      }
    });
    return counts;
  }, [inventory]);

  const filterOptions = [
    { key: 'all', label: 'すべて', count: filterCounts.all },
    { key: 'weapon', label: '🗡️ 武器', count: filterCounts.weapon },
    { key: 'armor', label: '🛡️ 防具', count: filterCounts.armor },
    { key: 'accessory', label: '💍 アクセ', count: filterCounts.accessory },
    { key: 'partner', label: '👤 お供', count: filterCounts.partner },
  ];

  const sortOptions = [
    { key: 'rarity', icon: '🌟', label: 'レア順' },
    { key: 'type', icon: '⚔️', label: '種別順' },
    { key: 'power', icon: '⚡', label: '強さ順' },
    { key: 'newest', icon: '🕒', label: '新しい順' },
  ];

  // 🌟 ガチャ専用演出ステート ('none' | 'charging' | 'blackout' | 'cutin' | 'reveal')
  const [animStep, setAnimStep] = useState('none');
  const [animItem, setAnimItem] = useState(null);
  const animTimeouts = React.useRef([]);

  const clearAnimTimers = () => {
    animTimeouts.current.forEach(t => clearTimeout(t));
    animTimeouts.current = [];
  };

  const triggerConfettiForRarity = (rarity) => {
    if (rarity === 'LR') {
      confetti({
        particleCount: 350,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ffd700'],
        zIndex: 9999999
      });
      setTimeout(() => {
        confetti({ particleCount: 150, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, zIndex: 9999999 });
        confetti({ particleCount: 150, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, zIndex: 9999999 });
      }, 250);
    } else if (rarity === 'UR') {
      confetti({
        particleCount: 220,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#fbbf24', '#ec4899', '#c084fc', '#ffffff'],
        zIndex: 9999999
      });
    } else if (rarity === 'SR') {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#fef08a'],
        zIndex: 9999999
      });
    }
  };

  const fastForwardReveal = (item) => {
    if (!item) return;
    clearAnimTimers();
    setAnimStep('reveal');
    setGachaResult(item);
    setIsRolling(false);
    triggerConfettiForRarity(item.rarity);
  };

  const handleRoll = () => {
    if (gachaTickets < COST || isRolling) return;

    if (inventory.length >= MAX_INVENTORY) {
      alert(`鞄がいっぱいです（${inventory.length}/${MAX_INVENTORY}個）！\n不要な装備を売却して空きを作ってください🎒`);
      setShowInventory(true);
      return;
    }

    // 前回の結果が表示されたままなら、自動で鞄にしまう
    if (gachaResult) {
      const prevItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
      setInventory(prev => [...prev, prevItem]);
      if (setAcquiredItems && !acquiredItems.includes(gachaResult.id)) {
        setAcquiredItems(prev => [...prev, gachaResult.id]);
      }
    }
    
    clearAnimTimers();
    setIsRolling(true);
    addTickets(-COST); // チケット消費
    setGachaResult(null);

    const item = rollGacha();
    setAnimItem(item);
    setAnimStep('charging');

    // 🎬 レアリティ別の演出タイムライン
    if (item.rarity === 'LR') {
      // LR: 神話級暗転演出！ charging(800ms) -> blackout(450ms) -> cutin(800ms) -> reveal
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('blackout');
      }, 800));
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('cutin');
      }, 1250));
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('reveal');
        setGachaResult(item);
        setIsRolling(false);
        triggerConfettiForRarity('LR');
      }, 2050));
    } else if (item.rarity === 'UR') {
      // UR: 極光レインボー演出！ charging(700ms) -> cutin(750ms) -> reveal
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('cutin');
      }, 700));
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('reveal');
        setGachaResult(item);
        setIsRolling(false);
        triggerConfettiForRarity('UR');
      }, 1450));
    } else if (item.rarity === 'SR') {
      // SR: 黄金の閃光演出！ charging(600ms) -> cutin(650ms) -> reveal
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('cutin');
      }, 600));
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('reveal');
        setGachaResult(item);
        setIsRolling(false);
        triggerConfettiForRarity('SR');
      }, 1250));
    } else {
      // N / R: charging(600ms) -> reveal
      animTimeouts.current.push(setTimeout(() => {
        setAnimStep('reveal');
        setGachaResult(item);
        setIsRolling(false);
      }, 600));
    }
  };

  const handleEquipFromGacha = () => {
    if (!gachaResult) return;
    const newItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
    const oldItem = equipment[newItem.type];
    
    setEquipment(prev => ({ ...prev, [newItem.type]: newItem }));
    if (oldItem) setInventory(prev => [...prev, oldItem]);
    if (setAcquiredItems && !acquiredItems.includes(newItem.id.split('_')[0])) {
      setAcquiredItems(prev => [...prev, newItem.id.split('_')[0] || newItem.id]);
    }
    
    setGachaResult(null);
    setAnimStep('none');
    setAnimItem(null);
  };

  const handleStoreInInventory = () => {
    if (!gachaResult) return;
    const newItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
    setInventory(prev => [...prev, newItem]);
    if (setAcquiredItems && !acquiredItems.includes(gachaResult.id)) {
      setAcquiredItems(prev => [...prev, gachaResult.id]);
    }
    setGachaResult(null);
    setAnimStep('none');
    setAnimItem(null);
  };

  const closeGachaModal = () => {
    if (gachaResult) {
      const newItem = { ...gachaResult, id: `${gachaResult.id}_${Date.now()}` };
      setInventory(prev => [...prev, newItem]);
      if (setAcquiredItems && !acquiredItems.includes(gachaResult.id)) {
        setAcquiredItems(prev => [...prev, gachaResult.id]);
      }
    }
    clearAnimTimers();
    setGachaResult(null);
    setAnimStep('none');
    setAnimItem(null);
    setIsRolling(false);
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
    if (invItem.locked) {
      alert('このアイテムはロックされているため売却できません🔒');
      return;
    }
    const expBack = getRecycleExp(invItem.rarity);
    addExp(expBack);
    setInventory(prev => prev.filter(i => i.id !== invItem.id));
  };

  const toggleLockItem = (targetItem) => {
    setInventory(prev => prev.map(it => {
      if (it.id === targetItem.id) {
        return { ...it, locked: !it.locked };
      }
      return it;
    }));
  };

  const handleBulkSell = (targetRarity) => {
    const equippedIds = new Set(
      Object.values(equipment || {})
        .filter(Boolean)
        .map(eq => eq.id)
        .filter(Boolean)
    );

    const targetItems = inventory.filter(item => {
      if (!item || !item.id) return false;
      if (equippedIds.has(item.id)) return false;
      if (item.locked) return false; // 🔒 ロックアイテムは売却から確実に保護
      if (targetRarity === 'N') return item.rarity === 'N';
      if (targetRarity === 'R_BELOW') return item.rarity === 'N' || item.rarity === 'R';
      return false;
    });

    if (targetItems.length === 0) {
      alert(targetRarity === 'N' ? '売却可能な N 装備はありません' : '売却可能な R 以下の装備はありません');
      return;
    }

    const totalExp = targetItems.reduce((sum, item) => sum + getRecycleExp(item.rarity), 0);
    const label = targetRarity === 'N' ? '未装備・未ロックの「N 装備」' : '未装備・未ロックの「R 以下の装備」';

    const confirmed = window.confirm(
      `【一括売却】\n${label} ${targetItems.length}個 を売却して、\n合計 +${totalExp} EXP を獲得しますか？\n\n※装備中およびロック中のアイテム、高レア（SR以上）は売却されません。`
    );
    if (!confirmed) return;

    const targetIds = new Set(targetItems.map(i => i.id));
    setInventory(prev => prev.filter(i => !targetIds.has(i.id)));
    addExp(totalExp);
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
    if (!gachaResult) return;
    const expBack = getRecycleExp(gachaResult.rarity);
    addExp(expBack); // 売却時は少量のEXPにする
    setGachaResult(null);
    setAnimStep('none');
    setAnimItem(null);
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
                      <span style={{ fontWeight: 'bold', fontSize: '0.82rem', wordBreak: 'break-word', ...getRarityTextStyle(equipment[selectedSlot].rarity) }}>
                        {equipment[selectedSlot].name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '2px', fontWeight: 'bold' }}>
                      ATK+{equipment[selectedSlot].atk} / DEF+{equipment[selectedSlot].def} / HP+{equipment[selectedSlot].hp}
                    </div>
                    {getEffectKey(equipment[selectedSlot]) && (
                      <div style={{ fontSize: '0.68rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 6px', marginTop: '3px', fontWeight: 'bold', lineHeight: 1.35, wordBreak: 'break-word' }}>
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
            {(() => {
              const currentEquip = syncItemWithMaster(equipment[selectedSlot]);
              // 装備中のアイテムそのもの（ID一致）はカバンから除外して非表示（見えなく）する！
              const displaySlotItems = inventory
                .filter(i => i.type === selectedSlot)
                .filter(i => {
                  if (currentEquip && i.id && currentEquip.id && i.id === currentEquip.id) {
                    return false; // 装備中そのものはカバンから非表示！
                  }
                  return true;
                })
                .map(rawItem => syncItemWithMaster(rawItem))
                .sort((a, b) => {
                  const rDiff = (RARITY_WEIGHT[b.rarity] || 0) - (RARITY_WEIGHT[a.rarity] || 0);
                  if (rDiff !== 0) return rDiff;
                  const nameDiff = (a.name || '').localeCompare(b.name || '', 'ja');
                  if (nameDiff !== 0) return nameDiff;
                  return 0;
                });

              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                      カバンの中 ({displaySlotItems.length}個)
                    </div>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px', minHeight: '180px' }}>
                    {displaySlotItems.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '0.75rem', lineHeight: 1.6 }}>
                        カバンに他の{selectedSlot === 'weapon' ? '武器' : selectedSlot === 'armor' ? '防具' : selectedSlot === 'accessory' ? 'アクセ' : 'お供'}はありません
                      </div>
                    ) : (
                      displaySlotItems.map((item, idx) => {
                        const diffAtk = item.atk - (currentEquip ? currentEquip.atk : 0);
                        const diffDef = item.def - (currentEquip ? currentEquip.def : 0);
                        const diffHp = item.hp - (currentEquip ? currentEquip.hp : 0);
                        const isDuplicateName = currentEquip && currentEquip.name === item.name;

                        const renderDiff = (diff) => {
                          if (diff > 0) return <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '2px' }}>(+{diff})</span>;
                          if (diff < 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>({diff})</span>;
                          return <span style={{ color: '#94a3b8', marginLeft: '2px' }}>(±0)</span>;
                        };

                        return (
                          <div key={`${item.id}_${idx}`} style={{ 
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
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', wordBreak: 'break-word', ...getRarityTextStyle(item.rarity) }}>
                                  {item.name}
                                </span>
                                {isDuplicateName && (
                                  <span style={{ fontSize: '0.62rem', background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                    📦 予備(2個目)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#475569', display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                                <span>ATK: {item.atk}{renderDiff(diffAtk)}</span>
                                <span>DEF: {item.def}{renderDiff(diffDef)}</span>
                                <span>HP: {item.hp}{renderDiff(diffHp)}</span>
                                <span style={{ color: userLevel >= getReqLevel(item) ? '#059669' : '#ef4444', fontWeight: 'bold', marginLeft: 'auto', fontSize: '0.68rem' }}>
                                  必要Lv: {getReqLevel(item)}
                                </span>
                              </div>
                              {item.desc && (
                                <div style={{ fontSize: '0.7rem', color: '#64748b', wordBreak: 'break-word', marginTop: '3px' }}>
                                  {item.desc}
                                </div>
                              )}
                              {getEffectKey(item) && (
                                <div style={{ fontSize: '0.68rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 6px', marginTop: '3px', fontWeight: 'bold', lineHeight: 1.35, wordBreak: 'break-word' }}>
                                  ✨ {getItemEffectDescription(item)}
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => { equipFromInventory(item); setSelectedSlot(null); }} 
                              disabled={userLevel < getReqLevel(item)}
                              style={{ background: userLevel >= getReqLevel(item) ? '#10b981' : '#94a3b8', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: userLevel >= getReqLevel(item) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>
                              {userLevel >= getReqLevel(item) ? (isDuplicateName ? '入替' : '装備') : `Lv${getReqLevel(item)}`}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* インベントリモーダル */}
      {showInventory && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '10px' }}>
          <div style={{ background: '#fff', padding: '14px 16px', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0' }}>
            {/* ヘッダー */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👜 インベントリ</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: inventory.length >= MAX_INVENTORY ? '#fee2e2' : '#f1f5f9', 
                  color: inventory.length >= MAX_INVENTORY ? '#dc2626' : '#64748b', 
                  fontWeight: inventory.length >= MAX_INVENTORY ? 'bold' : 'normal',
                  padding: '2px 8px', 
                  borderRadius: '12px' 
                }}>
                  {inventory.length} / {MAX_INVENTORY}個 {inventory.length >= MAX_INVENTORY && '(満杯!)'}
                </span>
              </h3>
              <button onClick={() => setShowInventory(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, color: '#64748b', padding: '2px 6px' }}>×</button>
            </div>

            {/* 種別フィルター (タブ) */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px', WebkitOverflowScrolling: 'touch', flexShrink: 0 }}>
              {filterOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setInvFilterType(opt.key);
                    if (invListRef.current) invListRef.current.scrollTop = 0;
                  }}
                  style={{
                    padding: '5px 9px',
                    fontSize: '0.74rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: invFilterType === opt.key ? 'bold' : 'normal',
                    background: invFilterType === opt.key ? '#3b82f6' : '#f1f5f9',
                    color: invFilterType === opt.key ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  {opt.label} ({opt.count})
                </button>
              ))}
            </div>

            {/* ソートバー */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', background: '#f8fafc', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', flexShrink: 0 }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>並び順:</span>
              <div style={{ display: 'flex', gap: '4px', flex: 1, flexWrap: 'wrap' }}>
                {sortOptions.map(s => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setInvSortType(s.key);
                      if (invListRef.current) invListRef.current.scrollTop = 0;
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      borderRadius: '6px',
                      border: invSortType === s.key ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                      background: invSortType === s.key ? '#eff6ff' : '#ffffff',
                      color: invSortType === s.key ? '#1d4ed8' : '#475569',
                      fontWeight: invSortType === s.key ? 'bold' : 'normal',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* 🧹 まとめて売却バー */}
            {(() => {
              const equippedIds = new Set(
                Object.values(equipment || {})
                  .filter(Boolean)
                  .map(eq => eq.id)
                  .filter(Boolean)
              );
              const unequippedN = inventory.filter(i => !equippedIds.has(i.id) && !i.locked && i.rarity === 'N');
              const unequippedRBelow = inventory.filter(i => !equippedIds.has(i.id) && !i.locked && (i.rarity === 'N' || i.rarity === 'R'));
              const nExp = unequippedN.reduce((sum, i) => sum + getRecycleExp(i.rarity), 0);
              const rExp = unequippedRBelow.reduce((sum, i) => sum + getRecycleExp(i.rarity), 0);

              return (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  marginBottom: '10px',
                  background: '#fffbeb',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #fef3c7',
                  flexShrink: 0,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span>🧹 一括売却:</span>
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleBulkSell('N')}
                      disabled={unequippedN.length === 0}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: unequippedN.length > 0 ? 'pointer' : 'not-allowed',
                        background: unequippedN.length > 0 ? '#f59e0b' : '#e2e8f0',
                        color: unequippedN.length > 0 ? '#ffffff' : '#94a3b8',
                        transition: 'all 0.15s ease'
                      }}
                      title="未装備のN装備を一括売却して経験値に変換します"
                    >
                      N一括 ({unequippedN.length}個/+{nExp}EXP)
                    </button>
                    <button
                      onClick={() => handleBulkSell('R_BELOW')}
                      disabled={unequippedRBelow.length === 0}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: unequippedRBelow.length > 0 ? 'pointer' : 'not-allowed',
                        background: unequippedRBelow.length > 0 ? '#d97706' : '#e2e8f0',
                        color: unequippedRBelow.length > 0 ? '#ffffff' : '#94a3b8',
                        transition: 'all 0.15s ease'
                      }}
                      title="未装備のRおよびN装備を一括売却して経験値に変換します"
                    >
                      R以下一括 ({unequippedRBelow.length}個/+{rExp}EXP)
                    </button>
                  </div>
                </div>
              );
            })()}
            
            <div ref={invListRef} style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '2px' }}>
              {processedInventory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: '0.8rem' }}>アイテムがありません</div>
              ) : (
                processedInventory.map((item, idx) => {
                  const currentEquip = syncItemWithMaster(equipment[item.type]);
                  const diffAtk = item.atk - (currentEquip ? currentEquip.atk : 0);
                  const diffDef = item.def - (currentEquip ? currentEquip.def : 0);
                  const diffHp = item.hp - (currentEquip ? currentEquip.hp : 0);
                  const isEquipped = Object.values(equipment).some(eq => eq && eq.id === item.id);

                  const renderDiff = (diff) => {
                    if (diff > 0) return <span style={{ color: '#10b981', fontWeight: 'bold', marginLeft: '2px' }}>(+{diff})</span>;
                    if (diff < 0) return <span style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>({diff})</span>;
                    return <span style={{ color: '#94a3b8', marginLeft: '2px' }}>(±0)</span>;
                  };

                  const typeLabels = { weapon: '🗡️ 武器', armor: '🛡️ 防具', accessory: '💍 アクセ', partner: '👤 お供' };

                  return (
                    <div key={`${item.id}_${idx}`} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 10px', 
                      background: isEquipped ? '#f0fdf4' : '#f8fafc', 
                      border: isEquipped ? '2px solid #10b981' : `1.5px solid ${getRarityColor(item.rarity)}`, 
                      borderRadius: '8px',
                      boxShadow: ['SR', 'UR', 'LR'].includes(item.rarity) ? RARITY_CONFIG[item.rarity]?.boxGlow : 'none'
                    }}>
                      <div style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={getRarityBadgeStyle(item.rarity)}>
                            {RARITY_CONFIG[item.rarity]?.sparkle && <span>{RARITY_CONFIG[item.rarity]?.sparkle}</span>}
                            <span>{item.rarity}</span>
                          </span>
                          <span style={{ fontWeight: 'bold', wordBreak: 'break-word', ...getRarityTextStyle(item.rarity) }}>
                            {item.name}
                          </span>
                          {item.locked && (
                            <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                              🔒 ロック
                            </span>
                          )}
                          {isEquipped && (
                            <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                              ⚔️ 装備中
                            </span>
                          )}
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
                        <div style={{ fontSize: '0.7rem', color: '#64748b', wordBreak: 'break-word' }}>{item.desc}</div>
                        {getEffectKey(item) && (
                          <div style={{ fontSize: '0.7rem', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 6px', marginTop: '4px', fontWeight: 'bold', lineHeight: 1.35, wordBreak: 'break-word' }}>
                            ✨ {getItemEffectDescription(item)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                        {isEquipped ? (
                          <div style={{ background: '#10b981', color: 'white', padding: '5px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
                            装備中
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => equipFromInventory(item)} 
                              disabled={userLevel < getReqLevel(item)}
                              style={{ background: userLevel >= getReqLevel(item) ? '#10b981' : '#94a3b8', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: userLevel >= getReqLevel(item) ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.8rem' }}>
                              {userLevel >= getReqLevel(item) ? '装備' : `Lv${getReqLevel(item)}`}
                            </button>
                            <button 
                              onClick={() => handleSellFromInventory(item)} 
                              disabled={item.locked}
                              title={item.locked ? 'ロック中のため売却できません' : '売却して経験値に変換'}
                              style={{ 
                                background: item.locked ? '#e2e8f0' : '#f59e0b', 
                                color: item.locked ? '#94a3b8' : 'white', 
                                border: 'none', padding: '4px 8px', borderRadius: '4px', 
                                cursor: item.locked ? 'not-allowed' : 'pointer', 
                                fontSize: '0.8rem' 
                              }}>
                              {item.locked ? '🔒' : '売却'}
                            </button>
                          </>
                        )}
                        {/* 🔒 お気に入りロックボタン */}
                        <button
                          onClick={() => toggleLockItem(item)}
                          title={item.locked ? 'ロックを解除する' : 'ロックして誤売却を防止する'}
                          style={{
                            background: item.locked ? '#fef3c7' : '#f8fafc',
                            color: item.locked ? '#b45309' : '#64748b',
                            border: item.locked ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '2px',
                            fontWeight: item.locked ? 'bold' : 'normal',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {item.locked ? '🔒 保護中' : '🔓 ロック'}
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
          disabled={gachaTickets < COST || isRolling || inventory.length >= MAX_INVENTORY}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
            background: (gachaTickets >= COST && !isRolling && inventory.length < MAX_INVENTORY) 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
              : '#e2e8f0',
            color: (gachaTickets >= COST && !isRolling && inventory.length < MAX_INVENTORY) ? 'white' : '#94a3b8',
            fontWeight: 'bold', 
            cursor: (gachaTickets >= COST && !isRolling && inventory.length < MAX_INVENTORY) ? 'pointer' : 'not-allowed',
            boxShadow: (gachaTickets >= COST && !isRolling && inventory.length < MAX_INVENTORY) ? '0 4px 6px -1px rgba(245, 158, 11, 0.4)' : 'none'
          }}
        >
          {inventory.length >= MAX_INVENTORY ? '👜 鞄満杯 (整理が必要)' : isRolling ? '...' : `🎫 回す(1枚)`}
        </button>
        <button 
          onClick={() => setShowInventory(true)}
          style={{
            padding: '10px 14px', borderRadius: '8px', 
            border: inventory.length >= MAX_INVENTORY ? '2px solid #ef4444' : 'none',
            background: inventory.length >= MAX_INVENTORY ? '#fee2e2' : '#3b82f6', 
            color: inventory.length >= MAX_INVENTORY ? '#dc2626' : 'white',
            fontWeight: 'bold', cursor: 'pointer',
            boxShadow: inventory.length >= MAX_INVENTORY ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' : '0 4px 6px -1px rgba(59, 130, 246, 0.4)',
            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          <span>👜 鞄</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>({inventory.length}/{MAX_INVENTORY})</span>
        </button>
      </div>

      {/* 🎬 豪華ガチャ演出モーダル (SR / UR / LR レアリティ別演出) */}
      {animStep !== 'none' && animItem && createPortal(
        <div 
          onClick={() => {
            if (animStep !== 'reveal') {
              fastForwardReveal(animItem);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            background: animStep === 'blackout' 
              ? '#000000' 
              : 'radial-gradient(circle at center, rgba(15, 23, 42, 0.96) 0%, rgba(2, 6, 23, 0.98) 100%)',
            backdropFilter: animStep === 'blackout' ? 'none' : 'blur(8px)',
            transition: 'background 0.2s ease',
            cursor: animStep !== 'reveal' ? 'pointer' : 'default'
          }}
        >
          <style>{`
            @keyframes gachaShake {
              0% { transform: translate(0, 0) rotate(0deg) scale(1); }
              20% { transform: translate(-3px, 2px) rotate(-4deg) scale(1.04); }
              40% { transform: translate(3px, -2px) rotate(4deg) scale(1.06); }
              60% { transform: translate(-4px, -1px) rotate(-3deg) scale(1.08); }
              80% { transform: translate(4px, 2px) rotate(3deg) scale(1.1); }
              100% { transform: translate(0, 0) rotate(0deg) scale(1); }
            }
            @keyframes gachaPulseGold {
              0%, 100% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.6), inset 0 0 15px rgba(251, 191, 36, 0.8); }
              50% { box-shadow: 0 0 60px rgba(245, 158, 11, 0.95), inset 0 0 30px rgba(255, 255, 255, 0.9); }
            }
            @keyframes gachaPulseRainbow {
              0% { filter: drop-shadow(0 0 20px #ef4444) hue-rotate(0deg); }
              50% { filter: drop-shadow(0 0 50px #8b5cf6) hue-rotate(180deg); }
              100% { filter: drop-shadow(0 0 20px #ef4444) hue-rotate(360deg); }
            }
            @keyframes gachaCutinPop {
              0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
              60% { transform: scale(1.15) rotate(2deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes gachaHeartbeat {
              0%, 100% { transform: scale(1); opacity: 0.3; }
              50% { transform: scale(1.4); opacity: 1; }
            }
            @keyframes gachaCardZoomIn {
              0% { transform: scale(0.7) translateY(20px); opacity: 0; }
              100% { transform: scale(1) translateY(0); opacity: 1; }
            }
            @keyframes gachaShineSweep {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>

          {/* 1. チャージ中演出 (カプセルが震えて光を放つ) */}
          {animStep === 'charging' && (
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{
                fontSize: '5rem',
                margin: '0 auto 20px auto',
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background: animItem.rarity === 'LR' 
                  ? 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(139, 92, 246, 0.3) 70%, transparent 100%)'
                  : animItem.rarity === 'UR'
                  ? 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(245, 158, 11, 0.3) 70%, transparent 100%)'
                  : animItem.rarity === 'SR'
                  ? 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                animation: animItem.rarity === 'LR' || animItem.rarity === 'UR'
                  ? 'gachaShake 0.08s infinite, gachaPulseRainbow 1.2s infinite'
                  : animItem.rarity === 'SR'
                  ? 'gachaShake 0.1s infinite, gachaPulseGold 0.8s infinite'
                  : 'gachaShake 0.12s infinite'
              }}>
                🔮
              </div>
              <div style={{
                color: animItem.rarity === 'LR' ? '#f43f5e' : animItem.rarity === 'UR' ? '#fbbf24' : animItem.rarity === 'SR' ? '#f59e0b' : '#38bdf8',
                fontSize: '1.1rem',
                fontWeight: '900',
                letterSpacing: '1px',
                textShadow: '0 0 15px rgba(255,255,255,0.6)'
              }}>
                {animItem.rarity === 'LR' ? '⚡ 異次元の波動を感知……！' :
                 animItem.rarity === 'UR' ? '✨ 神秘的な極光が集結中…！' :
                 animItem.rarity === 'SR' ? '⭐ 黄金の輝きが溢れ出す…！' :
                 '💫 ガチャ召喚中…'}
              </div>
              <div style={{ marginTop: '14px', fontSize: '0.75rem', color: '#64748b' }}>
                画面タップでスキップ
              </div>
            </div>
          )}

          {/* 2. LR専用！神話級暗転フリーズ演出 (0.45秒間の静寂) */}
          {animStep === 'blackout' && (
            <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 25px #ef4444, 0 0 50px #dc2626',
                margin: '0 auto 16px auto',
                animation: 'gachaHeartbeat 0.3s infinite ease-in-out'
              }}></div>
              <div style={{ color: '#fda4af', fontSize: '1.2rem', fontWeight: '900', letterSpacing: '4px', textShadow: '0 0 20px #ef4444' }}>
                ……！？？
              </div>
            </div>
          )}

          {/* 3. SR / UR / LR カットイン演出 */}
          {animStep === 'cutin' && (
            <div style={{ textAlign: 'center', pointerEvents: 'none', animation: 'gachaCutinPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              {animItem.rarity === 'LR' && (
                <div>
                  <div style={{ fontSize: '4.5rem', marginBottom: '8px', filter: 'drop-shadow(0 0 35px #f43f5e)' }}>🌌✨</div>
                  <div style={{
                    fontSize: '2.1rem',
                    fontWeight: '900',
                    lineHeight: 1.2,
                    background: 'linear-gradient(90deg, #ff007a, #9d00ff, #00d4ff, #ffd700, #ff007a)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'gachaShineSweep 1.5s linear infinite',
                    filter: 'drop-shadow(0 0 20px rgba(255, 0, 122, 0.9))'
                  }}>
                    🌈 神話級 LEGEND RARE 降臨！！！！
                  </div>
                  <div style={{ color: '#fef08a', fontSize: '1rem', fontWeight: 'bold', marginTop: '8px', textShadow: '0 0 10px rgba(254, 240, 138, 0.8)' }}>
                    神々の祝福を受けた伝説の逸品！
                  </div>
                </div>
              )}

              {animItem.rarity === 'UR' && (
                <div>
                  <div style={{ fontSize: '4rem', marginBottom: '8px', filter: 'drop-shadow(0 0 30px #ec4899)' }}>💖✨</div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    lineHeight: 1.2,
                    background: 'linear-gradient(135deg, #f43f5e, #fbbf24, #a855f7)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 18px rgba(244, 63, 94, 0.8))'
                  }}>
                    ✨ ULTRA RARE 確定！！ ✨
                  </div>
                  <div style={{ color: '#fbcfe8', fontSize: '0.95rem', fontWeight: 'bold', marginTop: '6px' }}>
                    時空を超えた超絶なる奇跡を感知！
                  </div>
                </div>
              )}

              {animItem.rarity === 'SR' && (
                <div>
                  <div style={{ fontSize: '3.8rem', marginBottom: '8px', filter: 'drop-shadow(0 0 25px #f59e0b)' }}>⭐👑</div>
                  <div style={{
                    fontSize: '1.9rem',
                    fontWeight: '900',
                    lineHeight: 1.2,
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fffbeb)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.8))'
                  }}>
                    ⭐ SUPER RARE 確定！！ ⭐
                  </div>
                  <div style={{ color: '#fef08a', fontSize: '0.95rem', fontWeight: 'bold', marginTop: '6px' }}>
                    黄金の輝きを放つお宝を召喚！
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. 結果カード発表 (Reveal) */}
          {animStep === 'reveal' && gachaResult && (
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '420px',
                borderRadius: '16px',
                padding: '20px 18px',
                boxSizing: 'border-box',
                textAlign: 'center',
                position: 'relative',
                animation: 'gachaCardZoomIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                background: gachaResult.rarity === 'LR'
                  ? 'linear-gradient(135deg, #1e112a 0%, #2b123d 50%, #15102a 100%)'
                  : gachaResult.rarity === 'UR'
                  ? 'linear-gradient(135deg, #2a1120 0%, #36172d 50%, #1a102b 100%)'
                  : gachaResult.rarity === 'SR'
                  ? 'linear-gradient(135deg, #2b1f0d 0%, #3b2a10 50%, #1c150a 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: gachaResult.rarity === 'LR'
                  ? '2.5px solid #ec4899'
                  : gachaResult.rarity === 'UR'
                  ? '2px solid #f43f5e'
                  : gachaResult.rarity === 'SR'
                  ? '2px solid #fbbf24'
                  : '1.5px solid #64748b',
                boxShadow: gachaResult.rarity === 'LR'
                  ? '0 0 45px rgba(236, 72, 153, 0.7), inset 0 0 25px rgba(139, 92, 246, 0.5)'
                  : gachaResult.rarity === 'UR'
                  ? '0 0 35px rgba(244, 63, 94, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.4)'
                  : gachaResult.rarity === 'SR'
                  ? '0 0 30px rgba(251, 191, 36, 0.6), inset 0 0 15px rgba(245, 158, 11, 0.3)'
                  : '0 10px 25px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* 閉じる✕ボタン */}
              <button 
                onClick={closeGachaModal}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1
                }}
              >
                ✕
              </button>

              {/* 上部タイトル */}
              <div style={{
                fontSize: '0.85rem',
                fontWeight: '900',
                letterSpacing: '1px',
                marginBottom: '10px',
                color: gachaResult.rarity === 'LR' ? '#f43f5e' : gachaResult.rarity === 'UR' ? '#fbbf24' : gachaResult.rarity === 'SR' ? '#f59e0b' : '#38bdf8'
              }}>
                {gachaResult.rarity === 'LR' ? '🌈 LEGEND RARE 降臨！' :
                 gachaResult.rarity === 'UR' ? '✨ ULTRA RARE 獲得！' :
                 gachaResult.rarity === 'SR' ? '⭐ SUPER RARE 獲得！' :
                 '🎁 ガチャ結果'}
              </div>

              {/* アイコン */}
              <div style={{
                fontSize: '4.2rem',
                margin: '6px 0 10px 0',
                lineHeight: 1,
                filter: gachaResult.rarity === 'LR'
                  ? 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.9))'
                  : gachaResult.rarity === 'UR'
                  ? 'drop-shadow(0 0 16px rgba(244, 63, 94, 0.8))'
                  : gachaResult.rarity === 'SR'
                  ? 'drop-shadow(0 0 14px rgba(251, 191, 36, 0.8))'
                  : 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
              }}>
                {gachaResult.icon}
              </div>

              {/* レアリティバッジ＆アイテム名＆部位 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={getRarityBadgeStyle(gachaResult.rarity)}>
                  {RARITY_CONFIG[gachaResult.rarity]?.sparkle && <span>{RARITY_CONFIG[gachaResult.rarity]?.sparkle}</span>}
                  <span>{gachaResult.rarity}</span>
                </span>
                <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#ffffff', ...getRarityTextStyle(gachaResult.rarity) }}>
                  {gachaResult.name}
                </span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.12)', color: '#cbd5e1', padding: '2px 7px', borderRadius: '4px' }}>
                  {{ weapon: '🗡️ 武器', armor: '🛡️ 防具', accessory: '💍 アクセ', partner: '👤 お供' }[gachaResult.type] || gachaResult.type}
                </span>
              </div>

              {/* ステータス */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '8px 10px',
                marginBottom: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {gachaResult.atk > 0 && <span style={{ color: '#f87171' }}>ATK +{gachaResult.atk}</span>}
                  {gachaResult.def > 0 && <span style={{ color: '#60a5fa' }}>DEF +{gachaResult.def}</span>}
                  {gachaResult.hp > 0 && <span style={{ color: '#4ade80' }}>HP +{gachaResult.hp}</span>}
                </div>
                <div style={{ fontSize: '0.72rem', marginTop: '3px', color: userLevel >= getReqLevel(gachaResult) ? '#34d399' : '#f87171', fontWeight: 'bold' }}>
                  必要Lv: {getReqLevel(gachaResult)} {userLevel >= getReqLevel(gachaResult) ? '（装備可能）' : '（Lv不足）'}
                </div>
              </div>

              {/* 特殊効果 */}
              {gachaResult.effect && (
                <div style={{
                  fontSize: '0.82rem',
                  color: '#fef08a',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px dashed #fbbf24',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                  lineHeight: 1.4
                }}>
                  ✨ {getItemEffectDescription(gachaResult)}
                </div>
              )}

              {/* 説明文 */}
              <div style={{ fontSize: '0.76rem', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.45 }}>
                「{gachaResult.desc}」
              </div>

              {/* 操作ボタン */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handleEquipFromGacha}
                    disabled={userLevel < getReqLevel(gachaResult)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      background: userLevel >= getReqLevel(gachaResult) 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : '#475569',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: userLevel >= getReqLevel(gachaResult) ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      boxShadow: userLevel >= getReqLevel(gachaResult) ? '0 4px 10px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                  >
                    {userLevel >= getReqLevel(gachaResult) ? '⚔️ すぐ装備する' : `Lv.${getReqLevel(gachaResult)}で装備可能`}
                  </button>
                  <button 
                    onClick={handleStoreInInventory}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                      boxShadow: '0 4px 10px rgba(59, 130, 246, 0.4)'
                    }}
                  >
                    👜 鞄にしまう
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {gachaTickets >= COST && (
                    <button
                      onClick={handleRoll}
                      disabled={isRolling}
                      style={{
                        flex: 1,
                        padding: '9px 8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.82rem',
                        boxShadow: '0 3px 8px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      🎫 もう1回引く (残り{gachaTickets}枚)
                    </button>
                  )}
                  <button 
                    onClick={handleRecycle}
                    style={{
                      padding: '9px 12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.78rem'
                    }}
                  >
                    売却 (+{getRecycleExp(gachaResult.rarity)} EXP)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default GachaMiniGame;
