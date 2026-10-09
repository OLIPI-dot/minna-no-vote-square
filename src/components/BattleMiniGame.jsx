import React, { useState, useEffect, useRef } from 'react';

const BattleMiniGame = ({ userLevel, addExp, equipment, globalOnlineCount }) => {
  const [battleState, setBattleState] = useState('idle'); // idle, searching, battling, result
  const [opponent, setOpponent] = useState(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [isWinner, setIsWinner] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 装備ボーナスの計算
  const equipAtk = (equipment?.weapon?.atk || 0) + (equipment?.accessory?.atk || 0);
  const equipDef = (equipment?.armor?.def || 0) + (equipment?.accessory?.def || 0);
  const equipHp = (equipment?.weapon?.hp || 0) + (equipment?.armor?.hp || 0) + (equipment?.accessory?.hp || 0);

  // 基本ステータス
  const baseMaxHp = userLevel * 20 + 30;
  const baseAtk = userLevel * 5 + 10;
  const baseDef = userLevel * 2 + 5;

  // ステータス計算 (基本値 + 装備ボーナス)
  const myMaxHp = baseMaxHp + equipHp;
  const myAtk = baseAtk + equipAtk;
  const myDef = baseDef + equipDef;

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const startBattle = () => {
    if (cooldown > 0) return;
    
    // 広場に自分しかいない場合はバトルできない
    if (typeof globalOnlineCount !== 'undefined' && globalOnlineCount <= 1) {
      setBattleState('idle');
      setBattleLog(['📡 近くの広場民をスキャン中...', '❌ ...誰もいないようだ。（広場ぼっち）']);
      return;
    }

    setBattleState('searching');
    setBattleLog(['📡 近くの広場民をスキャン中...']);
    
    setTimeout(() => {
      // 相手の生成
      const opLevel = Math.max(1, userLevel + Math.floor(Math.random() * 5) - 2);
      const opTitles = ['ひよっこ広場民', '見習い広場民', '一人前の広場民', '熟練の広場民', '伝説の広場民'];
      const opTitle = opTitles[Math.min(4, Math.max(0, Math.floor(opLevel / 5)))] || '歴戦の広場民';
      
      const opMaxHp = opLevel * 20 + 30;
      const opAtk = opLevel * 5 + 10;
      const opDef = opLevel * 2 + 5;
      
      setOpponent({ level: opLevel, title: opTitle, hp: opMaxHp, maxHp: opMaxHp, atk: opAtk, def: opDef });
      setPlayerHp(myMaxHp);
      
      setBattleLog(prev => [...prev, `⚠️ 野生の「${opTitle} (Lv.${opLevel})」が現れた！`]);
      setBattleState('battling');
      
      processBattle(opMaxHp, myMaxHp, opAtk, opDef);
    }, 1500);
  };

  const processBattle = (initialOpHp, initialMyHp, opAtk, opDef) => {
    let currentOpHp = initialOpHp;
    let currentMyHp = initialMyHp;

    const attack = () => {
      if (currentMyHp <= 0 || currentOpHp <= 0) {
        finishBattle(currentMyHp > 0);
        return;
      }

      // 自分の攻撃 (ダメージ = 自分の攻撃力 - 相手の防御力 + 乱数)
      const baseMyDmg = Math.max(1, myAtk - opDef);
      const myDmg = Math.max(1, baseMyDmg + Math.floor(Math.random() * 10) - 5);
      currentOpHp = Math.max(0, currentOpHp - myDmg);
      
      setOpponent(prev => ({ ...prev, hp: currentOpHp }));
      setBattleLog(prev => [...prev.slice(-4), `⚔️ あなたの攻撃！ 相手に ${myDmg} ダメージ！`]); // ログは最新5件のみ保持
      
      if (currentOpHp <= 0) {
        setTimeout(() => finishBattle(true), 1000);
        return;
      }

      // 相手の攻撃
      setTimeout(() => {
        const baseOpDmg = Math.max(1, opAtk - myDef);
        const opDmg = Math.max(1, baseOpDmg + Math.floor(Math.random() * 10) - 5);
        currentMyHp = Math.max(0, currentMyHp - opDmg);
        
        setPlayerHp(currentMyHp);
        setBattleLog(prev => [...prev.slice(-4), `💥 相手の反撃！ あなたに ${opDmg} ダメージ！`]);
        
        if (currentMyHp <= 0) {
          setTimeout(() => finishBattle(false), 1000);
        } else {
          setTimeout(attack, 1000);
        }
      }, 1000);
    };

    setTimeout(attack, 1500);
  };

  const finishBattle = (won) => {
    setIsWinner(won);
    setBattleState('result');
    if (won) {
      setBattleLog(prev => [...prev.slice(-4), `🎉 勝利！！ 15 EXP 獲得した！`]);
      if (addExp) addExp(15);
    } else {
      setBattleLog(prev => [...prev.slice(-4), `💀 敗北... ボコボコにされた。(+2 EXP)`]);
      if (addExp) addExp(2);
    }
    setCooldown(15); // 15秒クールダウン
  };

  const resetBattle = () => {
    setBattleState('idle');
    setBattleLog([]);
    setOpponent(null);
  };

  const renderHpBar = (hp, maxHp, isOpponent = false) => {
    const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const color = percent > 50 ? '#10b981' : percent > 20 ? '#f59e0b' : '#ef4444';
    return (
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
          <span>{isOpponent ? '敵のHP' : 'あなたのHP'}</span>
          <span>{hp} / {maxHp}</span>
        </div>
        <div style={{ width: '100%', background: '#e2e8f0', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: color, transition: 'width 0.3s ease-in-out, background 0.3s' }}></div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', padding: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
        ⚔️ 広場民コロシアム
      </h4>
      
      {/* 自分のステータス表示 */}
      {battleState === 'idle' && (
        <div style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 'bold', color: '#475569', marginBottom: '6px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
            📊 あなたのステータス (Lv.{userLevel})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', color: '#64748b' }}>
            <div>
              <span style={{ color: '#10b981' }}>HP:</span> {myMaxHp}
              {equipHp > 0 && <span style={{ fontSize: '0.7rem', color: '#10b981', marginLeft: '2px' }}>(+{equipHp})</span>}
            </div>
            <div>
              <span style={{ color: '#ef4444' }}>ATK:</span> {myAtk}
              {equipAtk > 0 && <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '2px' }}>(+{equipAtk})</span>}
            </div>
            <div>
              <span style={{ color: '#3b82f6' }}>DEF:</span> {myDef}
              {equipDef > 0 && <span style={{ fontSize: '0.7rem', color: '#3b82f6', marginLeft: '2px' }}>(+{equipDef})</span>}
            </div>
          </div>
        </div>
      )}

      {battleState === 'idle' && (
        <button 
          onClick={startBattle}
          disabled={cooldown > 0}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            background: cooldown > 0 ? '#e2e8f0' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
            color: cooldown > 0 ? '#94a3b8' : 'white',
            fontWeight: 'bold', cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', boxShadow: cooldown > 0 ? 'none' : '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
          }}
        >
          {cooldown > 0 ? `体力回復中... (${cooldown}秒)` : '💥 近くの奴に戦いを挑む'}
        </button>
      )}

      {battleState !== 'idle' && (
        <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* 戦闘中のHPゲージ */}
          {(battleState === 'battling' || battleState === 'result') && opponent && (
            <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '4px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>
                😈 {opponent.title} (Lv.{opponent.level})
              </div>
              {renderHpBar(opponent.hp, opponent.maxHp, true)}
              <div style={{ marginTop: '12px' }}>
                {renderHpBar(playerHp, myMaxHp, false)}
              </div>
            </div>
          )}

          {/* バトルログ (最新4件を表示) */}
          <div style={{ fontSize: '0.8rem', color: '#334155', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px inset #e2e8f0', minHeight: '90px' }}>
            {battleLog.map((log, i) => (
              <div key={i} style={{ padding: '2px 0', animation: 'fadeIn 0.3s ease-out' }}>{log}</div>
            ))}
          </div>
          
          {battleState === 'result' && (
            <button 
              onClick={resetBattle}
              style={{ marginTop: '8px', padding: '8px', background: isWinner ? '#10b981' : '#64748b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              広場に戻る
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BattleMiniGame;
