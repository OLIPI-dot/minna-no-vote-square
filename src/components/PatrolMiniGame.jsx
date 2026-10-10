import React, { useState, useEffect, useRef } from 'react';
import { rollEnemy } from '../enemies';

const PatrolMiniGame = ({ userLevel, userExp, addExp, equipment, setEquipment, addTickets, gachaTickets, inventory, setInventory, globalOnlineCount, encounteredEnemies = [], setEncounteredEnemies }) => {
  const [battleState, setBattleState] = useState('idle'); // idle, battling, won, lost
  const [enemy, setEnemy] = useState(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [dropItem, setDropItem] = useState(null);
  const [healCount, setHealCount] = useState(0); // 何回回復したか
  const [usedSos, setUsedSos] = useState(false); // 救援を呼んだか
  const [sosState, setSosState] = useState('idle'); // idle, voting, completed
  const [sosVotes, setSosVotes] = useState({ A: 0, B: 0, C: 0, D: 0 });
  const [sosTime, setSosTime] = useState(30);
  const [enemyStatus, setEnemyStatus] = useState(null); // 'virus' など
  const timerRef = useRef(null);
  const botIntervalRef = useRef(null);

  // 1日のパトロール回数制限 (最大5回)
  const getTodayPatrols = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    let data;
    try { data = JSON.parse(localStorage.getItem('daily_patrols') || '{}'); } catch { data = {}; }
    if (data.date !== todayStr) return { date: todayStr, count: 0 };
    return data;
  };
  const [patrolsToday, setPatrolsToday] = useState(getTodayPatrols().count);
  const MAX_PATROLS = 9999; // テスト用に一時的に無制限

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
    setPlayerHp(pMaxHp); // 修正: 追加
    
    // 図鑑に追加
    if (setEncounteredEnemies && !encounteredEnemies.includes(newEnemy.id)) {
      setEncounteredEnemies(prev => [...prev, newEnemy.id]);
    }
    setDropItem(null);
    setHealCount(0);
    setUsedSos(false);
    setSosState('idle');
    setSosVotes({ A: 0, B: 0, C: 0, D: 0 });
    setSosTime(30);
    setEnemyStatus(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    
    let logs = [`🚓 パトロール中...`, `⚠️ 【Lv.${newEnemy.level || 1} ${newEnemy.name}】 に遭遇した！`];
    if (newEnemy.isEnraged) {
      logs.push(`💢 相手は異常に怒り狂っている！！気をつけろ！`);
    }
    setBattleLog(logs);
    setBattleState('battling');
  };

  const handleAttack = () => {
    if (battleState !== 'battling') return;

    let newLogs = [...battleLog];
    let currentEnemyHp = enemyHp;
    let currentPlayerHp = playerHp;

    const hasEffect = (eff) => {
      return (equipment?.weapon?.effect === eff) || 
             (equipment?.armor?.effect === eff) || 
             (equipment?.accessory?.effect === eff);
    };

    // ✨ 【自動回復: regen】ターンの開始時に回復
    if (hasEffect('regen')) {
      const healAmount = Math.floor(pMaxHp * 0.1);
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + healAmount);
      newLogs.push(`✨ 【リジェネ】 装備の力で体力が ${healAmount} 回復した！`);
    }

    // 🦠 【ウイルス: virus】ターンの開始時に敵に継続ダメージ
    if (enemyStatus === 'virus') {
      const virusDmg = Math.max(5, Math.floor(enemy.hp * 0.1)); // 最大HPの10%
      currentEnemyHp = Math.max(0, currentEnemyHp - virusDmg);
      newLogs.push(`🦠 【感染】 敵は謎のウイルスに苦しんでいる... ${virusDmg} のダメージ！`);
      if (currentEnemyHp === 0) {
        newLogs.push(`🎉 ウイルスにより敵は力尽きた... 【${enemy.name}】 を撃退した！`);
        setEnemyHp(0);
        setPlayerHp(currentPlayerHp);
        setBattleLog(newLogs);
        handleWin(enemy);
        return;
      }
    }

    // 🎲 お互いの命中率とクリティカル判定
    const basePCrit = hasEffect('crit_up') ? 0.30 : 0.10; // 会心アップで30%
    const pMiss = Math.random() < 0.05; // 5% ミス
    const pCrit = Math.random() < basePCrit;

    const baseEMiss = hasEffect('dodge_up') ? 0.30 : 0.05; // 回避アップで30%
    const eMiss = Math.random() < baseEMiss; 
    const ePainful = Math.random() < (enemy.type === 'rare' ? 0.15 : 0.05);

    let isEnemyStunned = false;

    // 🗡️ プレイヤーの攻撃フェーズ
    if (pMiss) {
      newLogs.push(`💨 あなたの攻撃... しかし【${enemy.name}】に避けられた！`);
    } else {
      const calcDamage = () => {
        let dmg = pAtk - enemy.def;
        const variance = 1.0 + (Math.random() * 0.4 - 0.2);
        dmg = Math.floor(dmg * variance);
        const minDmg = Math.max(1, Math.floor(pAtk * 0.2));
        return Math.max(minDmg, dmg);
      };

      let dmgToEnemy = calcDamage();
      if (pCrit) dmgToEnemy = Math.floor(dmgToEnemy * 2.5);
      currentEnemyHp = Math.max(0, currentEnemyHp - dmgToEnemy);
      newLogs.push(pCrit 
        ? `⚡ 会心の一撃！！！ ${dmgToEnemy} の大ダメージ！` 
        : `🗡️ あなたの攻撃！ ${dmgToEnemy} のダメージ！`);

      // 🩸 【吸血: lifesteal】
      if (currentEnemyHp > 0 && hasEffect('lifesteal')) {
        const drain = Math.floor(dmgToEnemy * 0.3);
        currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + drain);
        newLogs.push(`🩸 【吸血】 敵の体力を奪い ${drain} 回復した！`);
      }

      // ⚔️ 【二刀流: double_attack】
      if (currentEnemyHp > 0 && hasEffect('double_attack')) {
        let secondDmg = Math.floor(calcDamage() * 0.7); // 2撃目は70%の威力
        currentEnemyHp = Math.max(0, currentEnemyHp - secondDmg);
        newLogs.push(`⚔️ 【連撃】 怒涛の追撃！さらに ${secondDmg} のダメージ！`);
      }

      // 💀 【精神崩壊: mental_damage】
      if (currentEnemyHp > 0 && hasEffect('mental_damage') && Math.random() < 0.3) {
        isEnemyStunned = true;
        newLogs.push(`💀 【精神破壊】 敵はメンタルをやられて動けない！！`);
      }

      // 🦠 【ウイルス付与: virus】
      if (currentEnemyHp > 0 && hasEffect('virus') && enemyStatus !== 'virus') {
        if (Math.random() < 0.4) { // 40%で感染
          setEnemyStatus('virus');
          newLogs.push(`💉 【感染源】 敵に謎のウイルスを感染させた！`);
        }
      }

      // 😰 【ドン引き: cringe】
      if (currentEnemyHp > 0 && hasEffect('cringe')) {
        if (Math.random() < 0.15) { // 15%で逃亡
          newLogs.push(`😰 【ドン引き】 あなたのヤバすぎる言動に、【${enemy.name}】 はドン引きして逃げ出した...`);
          newLogs.push(`🎉 （不戦勝） 【${enemy.name}】 を撃退した！`);
          setEnemyHp(0);
          setPlayerHp(currentPlayerHp);
          setBattleLog(newLogs);
          handleWin(enemy);
          return;
        }
      }
    }

    // 敵が死んだかチェック
    if (currentEnemyHp === 0) {
      newLogs.push(`🎉 【${enemy.name}】 を撃退した！`);
      setEnemyHp(0);
      setPlayerHp(currentPlayerHp); // 吸血やリジェネの回復を反映
      setBattleLog(newLogs);
      handleWin(enemy);
      return;
    }

    // 💥 敵の反撃フェーズ
    if (isEnemyStunned) {
      newLogs.push(`... 【${enemy.name}】 は虚空を見つめている。`);
    } else if (eMiss) {
      newLogs.push(`💨 敵の反撃... しかしあなたはヒョイッと避けた！`);
    } else {
      let dmgToPlayer = enemy.atk - pDef;
      const variance = 1.0 + (Math.random() * 0.4 - 0.2);
      dmgToPlayer = Math.floor(dmgToPlayer * variance);
      const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2));
      if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;
      if (ePainful) dmgToPlayer = Math.floor(dmgToPlayer * 2.5);
      
      currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
      newLogs.push(ePainful 
        ? `🩸 痛恨の一撃！！！ 敵の猛攻で ${dmgToPlayer} の大ダメージを受けた！` 
        : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);
        
      // 🪞 【ダメージ反射: reflect】
      if (currentPlayerHp > 0 && hasEffect('reflect')) {
        const refDmg = Math.floor(dmgToPlayer * 0.5); // 50%反射
        currentEnemyHp = Math.max(0, currentEnemyHp - refDmg);
        newLogs.push(`🪞 【反射】 装備がダメージを跳ね返した！ 敵に ${refDmg} のダメージ！`);
      }
    }

    // 反射で敵が死んだかチェック
    if (currentEnemyHp === 0) {
      newLogs.push(`🎉 敵は自滅した... 【${enemy.name}】 を撃退した！`);
      setEnemyHp(0);
      setPlayerHp(currentPlayerHp);
      setBattleLog(newLogs);
      handleWin(enemy);
      return;
    }

    if (currentPlayerHp === 0) {
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
    const variance = 1.0 + (Math.random() * 0.4 - 0.2);
    dmgToPlayer = Math.floor(dmgToPlayer * variance);
    const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2));
    if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;
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

  const handleSos = () => {
    if (battleState !== 'battling' || usedSos || sosState !== 'idle') return;
    
    setUsedSos(true);
    setSosState('voting');
    setSosTime(30);
    setSosVotes({ A: 0, B: 0, C: 0, D: 0 });
    
    let newLogs = [...battleLog, `📢 広場のみんなに救援アンケートを送信した！！！`];
    setBattleLog(newLogs);
    
    // タイマー開始
    timerRef.current = setInterval(() => {
      setSosTime(prev => {
        if (prev <= 1) {
          resolveSos();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Bot自動投票シミュレーション（オンライン人数に応じた頻度）
    const voteInterval = Math.max(200, 2000 / (globalOnlineCount || 1));
    botIntervalRef.current = setInterval(() => {
      setSosVotes(prev => {
        const keys = ['A', 'B', 'C', 'D'];
        // ランダムに誰かが投票した風にする。少し偏りを持たせる
        const rand = Math.random();
        let voteKey = 'A';
        if (rand < 0.4) voteKey = 'A';
        else if (rand < 0.7) voteKey = 'B';
        else if (rand < 0.9) voteKey = 'C';
        else voteKey = 'D';
        
        return { ...prev, [voteKey]: prev[voteKey] + 1 };
      });
    }, voteInterval);
  };

  const resolveSos = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    
    setSosState('completed');
    
    // 開票（強制再レンダリング前に最新のStateを取れない場合があるので、setState内ではなく現在のsosVotesを使う。React 18のバッチングに注意）
    // 最新状態を取得するためにコールバック形式で処理するか、単に現在の `sosVotes` を参照する。
    // タイマー内で呼ばれた場合、クロージャにより古い値になるため関数型アップデータの中で処理する。
    setSosVotes(currentVotes => {
      let maxVotes = -1;
      let winner = 'A';
      Object.entries(currentVotes).forEach(([key, val]) => {
        if (val > maxVotes) { maxVotes = val; winner = key; }
      });

      setBattleLog(prevLogs => {
        let newLogs = [...prevLogs, `🗳️ 投票終了！一番票を集めたのはパネル【${winner}】だ！`];
        
        let currentEnemyHp = enemyHp;
        let currentPlayerHp = playerHp;
        let isWin = false;

        if (winner === 'A') {
          // 超絶ダメージ
          newLogs.push(`💥 ✨ 究極魔法アルテマ！！！ 敵を一撃で粉砕した！`);
          currentEnemyHp = 0;
          isWin = true;
        } else if (winner === 'B') {
          // 割合ダメージ
          newLogs.push(`🔨 ✨ みんなの鉄槌！敵のHPを80%削り取った！`);
          currentEnemyHp = Math.max(1, Math.floor(currentEnemyHp - (enemy.hp * 0.8)));
          if (currentEnemyHp === 0) isWin = true;
        } else if (winner === 'C') {
          // レアドロップ確定バフ（今回は仮で、敵のHPを半減する等）
          newLogs.push(`🎁 ✨ アイテム発見率MAX！(※今は未実装なのでとりあえず敵のHPを半減！)`);
          currentEnemyHp = Math.floor(currentEnemyHp / 2);
        } else if (winner === 'D') {
          // EXP10倍
          newLogs.push(`📈 ✨ 覚醒バフ！次の攻撃の威力が10倍になる！（※仮で大ダメージ）`);
          currentEnemyHp = Math.max(0, currentEnemyHp - pAtk * 10);
          if (currentEnemyHp === 0) isWin = true;
        }
        
        // 即座にState更新
        setEnemyHp(currentEnemyHp);
        setPlayerHp(currentPlayerHp);
        
        if (isWin) {
          setTimeout(() => handleWin(enemy), 0);
        } else {
          // 敵の反撃
          let dmgToPlayer = enemy.atk - pDef;
          const variance = 1.0 + (Math.random() * 0.4 - 0.2);
          dmgToPlayer = Math.floor(dmgToPlayer * variance);
          const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2));
          if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;
          
          currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
          newLogs.push(`💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);
          setPlayerHp(currentPlayerHp);
          
          if (currentPlayerHp === 0) {
            newLogs.push(`💀 目の前が真っ暗になった... 敵に逃げられた。`);
            setBattleState('lost');
          }
        }
        return newLogs;
      });
      return currentVotes;
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, []);

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
            <div style={{ textAlign: 'center', fontWeight: 'bold', color: enemy.type === 'rare' ? '#ef4444' : '#334155', textShadow: enemy.type === 'rare' ? '0 0 5px rgba(239, 68, 68, 0.4)' : 'none', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginRight: '4px' }}>Lv.{enemy.level || 1}</span>
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
            {/* 自分のステータス */}
            <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', gap: '12px', marginTop: '6px', justifyContent: 'flex-end', fontWeight: 'bold' }}>
              <span>🗡️ ATK: {pAtk}</span>
              <span>🛡️ DEF: {pDef}</span>
            </div>
          </div>

          {/* ログ */}
          <div style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '8px', borderRadius: '6px', minHeight: '80px', maxHeight: '120px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[...battleLog].reverse().map((log, i) => {
              let logStyle = { animation: 'fadeIn 0.3s', borderBottom: i !== battleLog.length - 1 ? '1px dashed #cbd5e1' : 'none', paddingBottom: '4px' };
              if (log.includes('あなたの攻撃') || log.includes('会心')) {
                logStyle.color = '#2563eb'; // 青
                logStyle.fontWeight = 'bold';
              } else if (log.includes('敵の反撃') || log.includes('痛恨') || log.includes('敵の猛攻')) {
                logStyle.color = '#dc2626'; // 赤
              } else if (log.includes('回復') || log.includes('応急手当')) {
                logStyle.color = '#16a34a'; // 緑
                logStyle.fontWeight = 'bold';
              } else if (log.includes('救援') || log.includes('総攻撃') || log.includes('駆けつけた')) {
                logStyle.color = '#d97706'; // オレンジ
                logStyle.fontWeight = 'bold';
              }
              return (
                <div key={i} style={logStyle}>{log}</div>
              );
            })}
          </div>

          {/* アクションボタン */}
          {battleState === 'battling' && sosState !== 'voting' && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleAttack}
                style={{ flex: '1 1 40%', padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)' }}
              >
                🗡️ 攻撃する！
              </button>
              <button 
                onClick={handleHeal}
                disabled={healCount > 0 && gachaTickets < 1}
                style={{ flex: '1 1 30%', padding: '12px', background: (healCount > 0 && gachaTickets < 1) ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (healCount > 0 && gachaTickets < 1) ? 'not-allowed' : 'pointer', boxShadow: (healCount > 0 && gachaTickets < 1) ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.4)', fontSize: '0.8rem' }}
                title="1回目は無料、2回目以降はガチャチケ1枚消費"
              >
                💊 回復<br/>({healCount === 0 ? '初回無料' : 'チケ1枚'})
              </button>
              <button 
                onClick={handleSos}
                disabled={usedSos}
                style={{ flex: '1 1 100%', padding: '10px', background: usedSos ? '#cbd5e1' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: usedSos ? 'not-allowed' : 'pointer', boxShadow: usedSos ? 'none' : '0 4px 6px -1px rgba(245, 158, 11, 0.4)', fontSize: '0.85rem' }}
              >
                📢 広場のみんなに救援アンケートを呼ぶ！ (1回のみ)
              </button>
            </div>
          )}

          {/* 救援アンケート投票画面 */}
          {battleState === 'battling' && sosState === 'voting' && (
            <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px', padding: '12px', marginTop: '12px', animation: 'fadeIn 0.3s' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#b45309', marginBottom: '8px' }}>
                📢 みんなの投票を待っています！ (残り {sosTime} 秒)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {['A', 'B', 'C', 'D'].map(key => {
                  const total = Math.max(1, sosVotes.A + sosVotes.B + sosVotes.C + sosVotes.D);
                  const percent = Math.floor((sosVotes[key] / total) * 100);
                  return (
                    <div key={key} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`, background: '#fef08a', zIndex: 1, transition: 'width 0.3s' }}></div>
                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        <span>パネル {key}</span>
                        <span>{sosVotes[key]}票</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={resolveSos}
                style={{ width: '100%', padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                待てない！今すぐ開票！
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
