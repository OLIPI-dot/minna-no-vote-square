import React from 'react';
import { createPortal } from 'react-dom';
import { ITEMS, EFFECT_DESCRIPTIONS } from '../items';

const rarityColors = {
  N: '#94a3b8',
  R: '#3b82f6',
  SR: '#ec4899',
  UR: '#f59e0b',
  LR: '#ef4444'
};

const slotLabels = {
  weapon: { name: '武器', icon: '🗡️' },
  armor: { name: '防具', icon: '🛡️' },
  accessory: { name: 'アクセ', icon: '💍' },
  partner: { name: 'お供', icon: '👤' }
};

// マスターデータから確実な desc と effect を引く
const getItemDetails = (item) => {
  if (!item) return { desc: '', effect: null };
  const baseId = typeof item?.id === 'string' ? item.id.split('_')[0] : item?.id;
  const master = ITEMS.find(i => (baseId && i.id === baseId) || (i.name && i.name === item.name));
  return {
    desc: item.desc || master?.desc || '',
    effect: item.effect || master?.effect || null
  };
};

const StatusModal = ({ isOpen, onClose, userLevel = 1, userExp = 0, levelInfo, hn = '広場民', equipment = {} }) => {
  if (!isOpen) return null;

  // プレイヤーの総合ステータス計算（PatrolMiniGameと同じ完全同一式）
  const baseHp = userLevel * 10 + 100;
  const equipHp = (equipment?.accessory?.hp || 0) + (equipment?.partner?.hp || 0);
  const totalHp = baseHp + equipHp;

  const baseAtk = userLevel * 5 + 10;
  const equipAtk = (equipment?.weapon?.atk || 0) + (equipment?.partner?.atk || 0);
  const totalAtk = baseAtk + equipAtk;

  const baseDef = userLevel * 2;
  const equipDef = (equipment?.armor?.def || 0) + (equipment?.partner?.def || 0);
  const totalDef = baseDef + equipDef;

  // 発動中の特殊効果を効果ごとに集約（重複スタック対応）
  const effectMap = {};
  ['weapon', 'armor', 'accessory', 'partner'].forEach(slot => {
    const item = equipment?.[slot];
    if (item) {
      const { effect } = getItemDetails(item);
      if (effect && EFFECT_DESCRIPTIONS[effect]) {
        if (!effectMap[effect]) {
          effectMap[effect] = {
            effectKey: effect,
            effectDesc: EFFECT_DESCRIPTIONS[effect],
            sources: []
          };
        }
        effectMap[effect].sources.push({
          slot,
          slotName: slotLabels[slot].name,
          slotIcon: slotLabels[slot].icon,
          itemName: item.name,
          rarity: item.rarity
        });
      }
    }
  });
  const groupedEffects = Object.values(effectMap);

  return createPortal(
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* ヘッダー */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          padding: '14px 18px',
          borderBottom: '2px solid #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.05rem', color: '#92400e' }}>
            <span>📊</span>
            <span>冒険者ステータス</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#78350f',
              lineHeight: 1,
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>

        {/* スクロール可能エリア */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 1. キャラクター概要 */}
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fbbf24',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#d97706', marginBottom: '4px' }}>
              {levelInfo?.title || 'ひよっこ広場民 🥚'}
            </div>
            <div style={{
              fontSize: '1.15rem',
              fontWeight: 'bold',
              color: hn.includes('◆OLiPi') ? '#ef4444' : '#1e293b',
              textShadow: hn.includes('◆OLiPi') ? '0 0 8px rgba(239, 68, 68, 0.3)' : 'none',
              marginBottom: '6px'
            }}>
              {hn.includes('◆OLiPi') ? `👑 ${hn}` : hn}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#78350f', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <span>Lv.{userLevel}</span>
              <span>累計: {userExp.toLocaleString()} EXP</span>
            </div>
            {levelInfo?.next && (
              <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#b45309' }}>
                次のレベルまであと {levelInfo.next - userExp} EXP
              </div>
            )}
          </div>

          {/* 2. 総合戦闘力（3大ステータス） */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>⚔️</span>
              <span>総合戦闘力</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {/* HP */}
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#991b1b', fontWeight: 'bold' }}>❤️ 最大HP</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', margin: '2px 0' }}>{totalHp}</div>
                <div style={{ fontSize: '0.65rem', color: '#7f1d1d' }}>
                  Lv: {baseHp}
                  {equipHp > 0 && <span style={{ color: '#16a34a', fontWeight: 'bold', marginLeft: '2px' }}>+{equipHp}</span>}
                </div>
              </div>

              {/* ATK */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#9a3412', fontWeight: 'bold' }}>⚔️ 攻撃力</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ea580c', margin: '2px 0' }}>{totalAtk}</div>
                <div style={{ fontSize: '0.65rem', color: '#7c2d12' }}>
                  Lv: {baseAtk}
                  {equipAtk > 0 && <span style={{ color: '#16a34a', fontWeight: 'bold', marginLeft: '2px' }}>+{equipAtk}</span>}
                </div>
              </div>

              {/* DEF */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#1e40af', fontWeight: 'bold' }}>🛡️ 防御力</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', margin: '2px 0' }}>{totalDef}</div>
                <div style={{ fontSize: '0.65rem', color: '#1e3a8a' }}>
                  Lv: {baseDef}
                  {equipDef > 0 && <span style={{ color: '#16a34a', fontWeight: 'bold', marginLeft: '2px' }}>+{equipDef}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 3. 装備一式（4箇所） */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>🎒</span>
              <span>現在の装備</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['weapon', 'armor', 'accessory', 'partner'].map(slot => {
                const item = equipment?.[slot];
                const meta = slotLabels[slot];
                return (
                  <div 
                    key={slot}
                    style={{
                      background: item ? '#f8fafc' : '#f1f5f9',
                      border: item ? `1.5px solid ${rarityColors[item.rarity] || '#cbd5e1'}` : '1px dashed #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: '#64748b', width: '48px', fontWeight: 'bold', flexShrink: 0 }}>
                      {meta.icon} {meta.name}
                    </div>
                    {item ? (
                      <>
                        <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: rarityColors[item.rarity] || '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            [{item.rarity}] {item.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            {item.atk > 0 && `ATK+${item.atk} `}
                            {item.def > 0 && `DEF+${item.def} `}
                            {item.hp > 0 && `HP+${item.hp}`}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        未装備
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. 発動中の特殊効果 */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>✨</span>
              <span>発動中の特殊効果</span>
            </div>
            {groupedEffects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groupedEffects.map((eff, idx) => (
                  <div 
                    key={idx}
                    style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      border: eff.sources.length > 1 ? '1.5px solid #f59e0b' : '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '0.75rem',
                      lineHeight: 1.4,
                      boxShadow: eff.sources.length > 1 ? '0 2px 4px rgba(245, 158, 11, 0.15)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      {eff.sources.map((src, sIdx) => (
                        <span key={sIdx} style={{ fontSize: '0.68rem', background: '#f59e0b', color: 'white', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {src.slotIcon} {src.slotName}: {src.itemName}
                        </span>
                      ))}
                      {eff.sources.length > 1 && (
                        <span style={{ fontSize: '0.68rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', padding: '1px 7px', borderRadius: '4px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(239, 68, 68, 0.3)' }}>
                          🔥 重複発動中（×{eff.sources.length}）
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#92400e', fontWeight: 'bold', marginTop: '2px' }}>
                      ✨ {eff.effectDesc}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '0.75rem'
              }}>
                現在発動している特殊効果はありません
              </div>
            )}
          </div>

        </div>

        {/* フッター */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          textAlign: 'center'
        }}>
          <button 
            onClick={onClose}
            style={{
              width: '100%',
              padding: '8px 0',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)'
            }}
          >
            閉じる
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default StatusModal;
