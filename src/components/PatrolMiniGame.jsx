import React, { useState } from 'react';
import { rollEnemy } from '../enemies';

const PatrolMiniGame = ({ userLevel, userExp, addExp, equipment, setEquipment, addTickets, gachaTickets, inventory, setInventory }) => {
  const [battleState, setBattleState] = useState('idle'); // idle, battling, won, lost
  const [enemy, setEnemy] = useState(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [dropItem, setDropItem] = useState(null);
  const [healCount, setHealCount] = useState(0); // 何回回復したか

  // 1日のパトロール回数制限 (最大5回)
  const getTodayPatrols = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    let data;
    try { data = JSON.parse(localStorage.getItem('daily_patrols') || '{}'); } catch { data = {}; }
    if (data.date !== todayStr) return { date: todayStr, count: 0 };
    return data;
  };
  const [patrolsToday, setPatrolsToday] = useState(getTodayPatrols().count);
  const MAX_PATROLS = 5;

  // プレイヤーステータス計算
  const pMaxHp = (userLevel * 10 + 100) + (equipment?.accessory?.hp || 0);
  const pAtk = (userLevel * 5 + 10) + (equipment?.weapon?.atk || 0);
  const pDef = (userLevel * 2) + (equipment?.armor?.def || 0);

  const startPatrol = () => {
    if (patrolsToday >= MAX_PATROLS) return;
    
    // 回数消費
    const currentData = getTodayPatrols();
    currentData.count += 1;
    localStorage.setItem('daily_patrols', JSON.stringify(currentData));
    setPatrolsToday(currentData.count);

    // 敵の抽選
    const newEnemy = rollEnemy();
    setEnemy(newEnemy);
    setEnemyHp(newEnemy.hp);
    setPlayerHp(pMaxHp);
    setDropItem(null);
    setHealCount(0);
    setBattleLog([`🚓 パトロール中...`, `⚠️ 【${newEnemy.name}】 に遭遇した！`]);
    setBattleState('battling');
  };

  const handleAttack = () => {
    if (battleState !== 'battling') return;

    let newLogs = [...battleLog];
    let currentEnemyHp = enemyHp;
    let currentPlayerHp = playerHp;

    // 🎲 お互いの命中率とクリティカル判定
    const pMiss = Math.random() < 0.05; // 5% ミス
    const pCrit = Math.random() < 0.10; // 10% 会心の一撃

    const eMiss = Math.random() < 0.05; // 5% ミス
    const ePainful = Math.random() < (enemy.type === 'rare' ? 0.15 : 0.05); // 敵の痛恨の一撃

    // 🗡️ プレイヤーの攻撃フェーズ
    if (pMiss) {
      newLogs.push(`💨 あなたの攻撃... しかし【${enemy.name}】に避けられた！`);
    } else {
      let dmgToEnemy = pAtk - enemy.def;
      if (dmgToEnemy < 1) dmgToEnemy = 1;
      if (pCrit) dmgToEnemy = Math.floor(dmgToEnemy * 2.5); // クリティカル！
      
      currentEnemyHp = Math.max(0, currentEnemyHp - dmgToEnemy);
      newLogs.push(pCrit 
        ? `⚡ 会心の一撃！！！ ${dmgToEnemy} の大ダメージ！` 
        : `🗡️ あなたの攻撃！ ${dmgToEnemy} のダメージ！`);
    }

    if (currentEnemyHp === 0) {
      // 勝利処理
      newLogs.push(`🎉 【${enemy.name}】 を撃退した！`);
      setEnemyHp(0);
      setBattleLog(newLogs);
      handleWin(enemy);
      return;
    }

    // 💥 敵の反撃フェーズ
    if (eMiss) {
      newLogs.push(`💨 敵の反撃... しかしあなたはヒョイッと避けた！`);
    } else {
      let dmgToPlayer = enemy.atk - pDef;
      if (dmgToPlayer < 1) dmgToPlayer = 1;
      if (ePainful) dmgToPlayer = Math.floor(dmgToPlayer * 2.5); // 痛恨の一撃！
      
      currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
      newLogs.push(ePainful 
        ? `🩸 痛恨の一撃！！！ 敵の猛攻で ${dmgToPlayer} の大ダメージを受けた！` 
        : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);
    }

    if (currentPlayerHp === 0) {
      // 敗北処理
      newLogs.push(`💀 目の前が真っ暗になった... 敵に逃げられた。`);
      setPlayerHp(0);
      setEnemyHp(currentEnemyHp);
      setBattleLog(newLogs);
      setBattleState('lost');
      return;
    }

    setEnemyHp(currentEnemyHp);
    setPlayerHp(currentPlayerHp);
    setBattleLog(newLogs);
  };

  const handleHeal = () => {
    if (battleState !== 'battling') return;
    
    if (healCount > 0) {
      if (gachaTickets < 1) return;
      addTickets(-1); // 2回目以降はガチャチケ消費
    }
    
    setHealCount(prev => prev + 1);
    
    const healAmount = Math.floor(pMaxHp * 0.3);
    const newHp = Math.min(pMaxHp, playerHp + healAmount);
    
    let newLogs = [...battleLog, healCount === 0 
      ? `💊 応急手当！ ${healAmount} 回復した！（無料）` 
      : `🎫 ガチャチケを1枚消費して強引に回復！ ${healAmount} 回復！`];
    
    // 敵は容赦なく殴ってくる
    let dmgToPlayer = enemy.atk - pDef;
    if (dmgToPlayer < 1) dmgToPlayer = 1;
    const ePainful = Math.random() < (enemy.type === 'rare' ? 0.15 : 0.05);
    if (ePainful) dmgToPlayer = Math.floor(dmgToPlayer * 2.5);

    const finalHp = Math.max(0, newHp - dmgToPlayer);
    newLogs.push(ePainful 
      ? `🩸 痛恨の一撃！！！ 敵の猛攻で ${dmgToPlayer} の大ダメージを受けた！` 
      : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);

    if (finalHp === 0) {
      newLogs.push(`💀 目の前が真っ暗になった... 敵に逃げられた。`);
      setPlayerHp(0);
      setBattleLog(newLogs);
      setBattleState('lost');
      return;
    }

    setPlayerHp(finalHp);
    setBattleLog(newLogs);
  };

  const handleWin = (defeatedEnemy) => {
    setBattleState('won');
    
    if (defeatedEnemy.type === 'rare') addExp(50);
    else if (defeatedEnemy.type === 'elite') {
      addExp(30);
      addTickets(1); // エリートならガチャチケ1枚確定！
    }
    else addExp(10);
    
    // レアエネミーなら赤箱ドロップ判定
    if (defeatedEnemy.type === 'rare') {
      const rand = Math.random();
      // 激甘ドロップ: LR 2%, UR 20%, それ以外はR以上確定など
      let drop = null;
      if (rand < 0.02) drop = rollGachaSpecific('LR');
      else if (rand < 0.22) drop = rollGachaSpecific('UR');
      else if (rand < 0.50) drop = rollGachaSpecific('SR');
      
      if (drop) {
        setDropItem(drop);
        setBattleLog(prev => [...prev, `🎁 激レアな【赤箱】をドロップした！！！`]);
      } else {
        setBattleLog(prev => [...prev, `💨 しかし何もドロップしなかった...`]);
      }
    }
  };

  const rollGachaSpecific = (rarity) => {
    const { ITEMS } = require('../items');
    const pool = ITEMS.filter(i => i.rarity === rarity);
    if(pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const takeDropItem = () => {
    if (dropItem) {
      setEquipment(prev => ({
        ...prev,
        [dropItem.type]: dropItem
      }));
    }
    setBattleState('idle');
  };

  return (
    <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #cbd5e1', padding: '16px', color: '#334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900' }}>
          🚓 広場パトロール
        </h4>
        <span style={{ fontSize: '0.75rem', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
          通常戦闘
        </span>
      </div>

      {battleState === 'idle' && (
        <>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
            広場を見回りして、迷惑なユーザーを撃退しよう！<br/>
            稀にレアな荒らしが出現するかも...？
          </div>
          <button 
            onClick={startPatrol}
            disabled={patrolsToday >= MAX_PATROLS}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              background: patrolsToday >= MAX_PATROLS ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
              color: patrolsToday >= MAX_PATROLS ? '#94a3b8' : 'white',
              fontWeight: 'bold', cursor: patrolsToday >= MAX_PATROLS ? 'not-allowed' : 'pointer',
              boxShadow: patrolsToday >= MAX_PATROLS ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
            }}
          >
            {patrolsToday >= MAX_PATROLS ? '✅ 本日のパトロール終了' : `出発する (残り${MAX_PATROLS - patrolsToday}回)`}
          </button>
        </>
      )}

      {battleState !== 'idle' && enemy && (
        <div>
          {/* 戦闘画面UI */}
          <div style={{ background: enemy.type === 'rare' ? '#fffbeb' : enemy.type === 'elite' ? '#f8fafc' : 'white', border: `2px solid ${enemy.type === 'rare' ? '#f59e0b' : enemy.type === 'elite' ? '#94a3b8' : '#e2e8f0'}`, borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '8px', animation: enemy.type === 'rare' ? 'pulse 2s infinite' : 'none' }}>
              {enemy.icon}
            </div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: enemy.type === 'rare' ? '#b45309' : '#334155', marginBottom: '8px' }}>
              {enemy.name}
            </div>
            {/* 敵のHPバー */}
            <div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${Math.max(0, (enemyHp / enemy.hp) * 100)}%`, height: '100%', background: '#ef4444', transition: 'width 0.3s' }}></div>
            </div>

            {/* 自分のHPバー */}
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>あなたのHP</span>
              <span>{playerHp} / {pMaxHp}</span>
            </div>
            <div style={{ background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, (playerHp / pMaxHp) * 100)}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }}></div>
            </div>
          </div>

          {/* ログ */}
          <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '8px', borderRadius: '6px', minHeight: '80px', maxHeight: '120px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {battleLog.map((log, i) => (
              <div key={i} style={{ animation: 'fadeIn 0.3s' }}>{log}</div>
            ))}
          </div>

          {/* アクションボタン */}
          {battleState === 'battling' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={handleAttack}
                style={{ flex: 2, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)' }}
              >
                🗡️ 攻撃する！
              </button>
              <button 
                onClick={handleHeal}
                disabled={healCount > 0 && gachaTickets < 1}
                style={{ flex: 1, padding: '12px', background: (healCount > 0 && gachaTickets < 1) ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (healCount > 0 && gachaTickets < 1) ? 'not-allowed' : 'pointer', boxShadow: (healCount > 0 && gachaTickets < 1) ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.4)', fontSize: '0.8rem' }}
                title="1回目は無料、2回目以降はガチャチケ1枚消費"
              >
                💊 回復<br/>({healCount === 0 ? '初回無料' : 'チケ1枚'})
              </button>
            </div>
          )}

          {battleState === 'won' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '12px' }}>
                EXPを獲得しました！{enemy.type === 'elite' && '🎫チケ+1！'}
              </div>
              {dropItem && (
                <div style={{ background: '#fffbeb', border: '2px dashed #f59e0b', padding: '12px', borderRadius: '8px', marginBottom: '12px', animation: 'pulse-orange 1.5s infinite' }}>
                  <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 'bold' }}>🎁 レアドロップ獲得！</div>
                  <div style={{ fontSize: '1.5rem', margin: '4px 0' }}>{dropItem.icon}</div>
                  <div style={{ fontWeight: 'bold' }}>[{dropItem.rarity}] {dropItem.name}</div>
                </div>
              )}
              <button 
                onClick={() => { dropItem ? takeDropItem() : setBattleState('idle'); setDropItem(null); setEnemy(null); }}
                style={{ padding: '8px 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {dropItem ? '装備して戻る' : '戻る'}
              </button>
            </div>
          )}

          {battleState === 'lost' && (
            <button 
              onClick={() => { setBattleState('idle'); setEnemy(null); }}
              style={{ width: '100%', padding: '12px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              広場に逃げ帰る...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PatrolMiniGame;
