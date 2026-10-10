import React, { useState } from 'react';
import { ITEMS } from '../items';
import { ENEMIES } from '../enemies';

const DictionaryModal = ({ isOpen, onClose, acquiredItems = [], encounteredEnemies = [] }) => {
  const [tab, setTab] = useState('items'); // 'items' | 'enemies'

  if (!isOpen) return null;

  const totalItems = ITEMS.length;
  const collectedItems = ITEMS.filter(i => acquiredItems.includes(i.id)).length;
  
  const totalEnemies = ENEMIES.length;
  const collectedEnemies = ENEMIES.filter(e => encounteredEnemies.includes(e.id)).length;

  const getRarityColor = (rarity) => {
    const colors = { N: '#94a3b8', R: '#3b82f6', SR: '#eab308', UR: '#ec4899', LR: '#ef4444' };
    return colors[rarity] || '#333';
  };

  const getEnemyColor = (type) => {
    const colors = { normal: '#334155', elite: '#0ea5e9', rare: '#ef4444' };
    return colors[type] || '#333';
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#f8fafc', width: '100%', maxWidth: '600px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}>
        
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            📖 みんクエ図鑑
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0' }}>
          <button 
            onClick={() => setTab('items')}
            style={{ flex: 1, padding: '12px', background: tab === 'items' ? 'white' : '#f1f5f9', border: 'none', fontWeight: 'bold', borderBottom: tab === 'items' ? '3px solid #3b82f6' : '3px solid transparent', cursor: 'pointer' }}
          >
            🎁 アイテム ({collectedItems} / {totalItems})
          </button>
          <button 
            onClick={() => setTab('enemies')}
            style={{ flex: 1, padding: '12px', background: tab === 'enemies' ? 'white' : '#f1f5f9', border: 'none', fontWeight: 'bold', borderBottom: tab === 'enemies' ? '3px solid #ef4444' : '3px solid transparent', cursor: 'pointer' }}
          >
            👾 エネミー ({collectedEnemies} / {totalEnemies})
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'white' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '12px' }}>
            {tab === 'items' && ITEMS.map(item => {
              const isAcquired = acquiredItems.includes(item.id);
              return (
                <div key={item.id} title={isAcquired ? `${item.name}\n${item.desc}` : '???'} style={{ border: `2px solid ${isAcquired ? getRarityColor(item.rarity) : '#e2e8f0'}`, borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: isAcquired ? '#fff' : '#f1f5f9', opacity: isAcquired ? 1 : 0.5, cursor: 'help' }}>
                  <div style={{ fontSize: '1.8rem', filter: isAcquired ? 'none' : 'grayscale(100%)' }}>
                    {isAcquired ? item.icon : '❓'}
                  </div>
                  {isAcquired && (
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: getRarityColor(item.rarity), marginTop: '4px', textAlign: 'center' }}>
                      {item.rarity}
                    </div>
                  )}
                </div>
              );
            })}

            {tab === 'enemies' && ENEMIES.map(enemy => {
              const isEncountered = encounteredEnemies.includes(enemy.id);
              return (
                <div key={enemy.id} title={isEncountered ? `${enemy.name}\n${enemy.desc}` : '???'} style={{ border: `2px solid ${isEncountered ? getEnemyColor(enemy.type) : '#e2e8f0'}`, borderRadius: '8px', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: isEncountered ? '#fff' : '#f1f5f9', opacity: isEncountered ? 1 : 0.5, cursor: 'help' }}>
                  <div style={{ fontSize: '1.8rem', filter: isEncountered ? 'none' : 'grayscale(100%)' }}>
                    {isEncountered ? enemy.icon : '❓'}
                  </div>
                  {isEncountered && (
                    <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: getEnemyColor(enemy.type), marginTop: '4px', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%' }}>
                      {enemy.name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryModal;
