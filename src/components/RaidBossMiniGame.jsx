import React, { useState, useEffect, useRef } from 'react';
import RAID_BOSSES from '../data/raid_bosses.json';
import { ITEMS, getRarityColor, getRarityTextStyle, getRarityBadgeStyle, RARITY_CONFIG } from '../items';
import { supabase } from '../supabaseClient';

const RaidBossMiniGame = ({
  userLevel = 1,
  userExp = 0,
  addExp,
  gachaTickets = 0,
  addTickets,
  equipment = {},
  user,
  hn = 'あなた',
  globalOnlineCount = 1
}) => {
  // 今日の曜日 (0:日, 1:月, ..., 6:土)
  const todayDay = new Date().getDay();
  const currentBoss = RAID_BOSSES.find(b => b.day === todayDay) || RAID_BOSSES[0];

  // 1日のレイドボスHP & ランキング管理キー
  const getTodayKey = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return `minique_raid_boss_${currentBoss.id}_${todayStr}`;
  };

  const getRankingKey = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return `minique_raid_ranking_${currentBoss.id}_${todayStr}`;
  };

  const getFaintKey = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return `minique_raid_faint_${currentBoss.id}_${todayStr}`;
  };

  // ボスHP
  const [bossHp, setBossHp] = useState(() => {
    try {
      const saved = localStorage.getItem(getTodayKey());
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) return Math.min(parsed, currentBoss.maxHp);
      }
    } catch (e) {}
    return currentBoss.maxHp;
  });

  // プレイヤーのステータス計算
  const equipSlots = ['weapon', 'armor', 'accessory', 'partner'];
  const baseAtk = (userLevel * 5) + 15;
  const equipAtk = equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.atk || 0), 0);
  const myTotalAtk = baseAtk + equipAtk;

  const baseDef = (userLevel * 2) + 5;
  const equipDef = equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.def || 0), 0);
  const myTotalDef = baseDef + equipDef;

  const pMaxHp = (userLevel * 15) + 120 + equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.hp || 0), 0);

  // プレイヤーHP ＆ 気絶タイマー
  const [playerHp, setPlayerHp] = useState(pMaxHp);
  const [faintSeconds, setFaintSeconds] = useState(0);

  // 🧪 回復薬（最大3回まで・HP回復＆気絶からの即時復活に使用可能）
  const [healsLeft, setHealsLeft] = useState(3);

  // 📡 オンライン同期ステート（10秒バッチ＆超軽量WebSocket）
  const unsyncedDamageRef = useRef(0);
  const channelRef = useRef(null);
  const [syncSecondsLeft, setSyncSecondsLeft] = useState(10);
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);

  // 初回ロード時の気絶復帰チェック
  useEffect(() => {
    try {
      const faintUntil = localStorage.getItem(getFaintKey());
      if (faintUntil) {
        const remaining = Math.ceil((parseInt(faintUntil, 10) - Date.now()) / 1000);
        if (remaining > 0) {
          setFaintSeconds(remaining);
          setPlayerHp(0);
        } else {
          localStorage.removeItem(getFaintKey());
          setPlayerHp(pMaxHp);
        }
      }
    } catch (e) {}
  }, [pMaxHp]);

  // 気絶カウントダウン
  useEffect(() => {
    if (faintSeconds > 0) {
      const timer = setTimeout(() => {
        setFaintSeconds(prev => {
          if (prev <= 1) {
            try { localStorage.removeItem(getFaintKey()); } catch (e) {}
            setPlayerHp(pMaxHp);
            setRaidLogs(logs => [`💖 休憩を終えて全快で気絶から復帰した！ 再び戦えるぞ！`, ...logs].slice(0, 15));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [faintSeconds, pMaxHp]);

  // バトルステート
  const [isAttacking, setIsAttacking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [damagePopup, setDamagePopup] = useState(null);
  const [bossAttackPopup, setBossAttackPopup] = useState(null);
  const [raidLogs, setRaidLogs] = useState(() => [
    `⚔️ 【${currentBoss.title}】 ${currentBoss.name} が広場に出現中！`,
    `📡 10秒更新のリアルタイム通信で広場のみんなと共闘中！`
  ]);

  // クールタイムタイマー
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => Math.max(0, prev - 1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 🏆 ダメージ貢献ランキング管理
  const [rankingList, setRankingList] = useState(() => {
    try {
      const saved = localStorage.getItem(getRankingKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      { id: 'npc_1', name: 'ベテラン広場民 🛡️', damage: 8500, isMe: false },
      { id: 'npc_2', name: '深夜の調査兵 🔦', damage: 5200, isMe: false },
      { id: 'npc_3', name: 'らびたん親衛隊 🐰', damage: 3400, isMe: false },
      { id: 'npc_4', name: '週末パトロール隊長 🚓', damage: 1800, isMe: false },
      { id: 'me', name: hn || 'あなた', damage: 0, isMe: true }
    ];
  });

  const myDamage = rankingList.find(r => r.isMe)?.damage || 0;

  // ⚡ 10秒バッチ同期のリアルタイムWebSocket購読
  useEffect(() => {
    if (!supabase) return;

    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const channelName = `raid_sync_${currentBoss.id}_${todayStr.replace(/\//g, '-')}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } }
    });

    // 📡 他のプレイヤーからの10秒バッチダメージ受信
    channel.on('broadcast', { event: 'batch_damage' }, ({ payload }) => {
      if (!payload || !payload.damage) return;

      const allyName = payload.senderName || '広場民';
      const allyDmg = payload.damage;

      setBossHp(prevHp => {
        const nextHp = Math.max(0, prevHp - allyDmg);
        try { localStorage.setItem(getTodayKey(), String(nextHp)); } catch (e) {}
        return nextHp;
      });

      setRaidLogs(logs => [
        `🤝 【共闘速報】 『${allyName}』 が ${allyDmg.toLocaleString()} の追撃ダメージ！`,
        ...logs
      ].slice(0, 15));

      setRankingList(prevList => {
        let found = false;
        let nextList = prevList.map(item => {
          if (item.name === allyName && !item.isMe) {
            found = true;
            return { ...item, damage: item.damage + allyDmg };
          }
          return item;
        });

        if (!found) {
          nextList.push({
            id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: allyName,
            damage: payload.totalDamage || allyDmg,
            isMe: false
          });
        }

        nextList.sort((a, b) => b.damage - a.damage);
        try { localStorage.setItem(getRankingKey(), JSON.stringify(nextList)); } catch (e) {}
        return nextList;
      });
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsOnlineConnected(true);
      }
    });

    channelRef.current = channel;

    const intervalTimer = setInterval(() => {
      setSyncSecondsLeft(prev => {
        if (prev <= 1) {
          if (unsyncedDamageRef.current > 0 && channelRef.current) {
            const dmgToSend = unsyncedDamageRef.current;
            unsyncedDamageRef.current = 0;

            channelRef.current.send({
              type: 'broadcast',
              event: 'batch_damage',
              payload: {
                senderName: hn || 'あなた',
                damage: dmgToSend,
                totalDamage: myDamage + dmgToSend,
                timestamp: Date.now()
              }
            }).catch(e => console.warn('Broadcast send error:', e));
          }
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalTimer);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentBoss.id, hn, myDamage]);

  // 🧪 回復薬を使う（HP回復 または 気絶からの即座復帰）
  const handleHeal = () => {
    if (healsLeft <= 0 || bossHp <= 0) return;

    if (faintSeconds > 0) {
      try { localStorage.removeItem(getFaintKey()); } catch (e) {}
      setFaintSeconds(0);
      setPlayerHp(pMaxHp);
      setHealsLeft(prev => prev - 1);
      setRaidLogs(logs => [
        `🧪 秘伝の回復薬をグイッと飲んで気絶から即座に復活した！！ (残り${healsLeft - 1}回)`,
        ...logs
      ].slice(0, 15));
      return;
    }

    if (playerHp >= pMaxHp) return;

    const healAmt = Math.round(pMaxHp * 0.5);
    const newHp = Math.min(pMaxHp, playerHp + healAmt);
    setPlayerHp(newHp);
    setHealsLeft(prev => prev - 1);
    setRaidLogs(logs => [
      `🧪 回復薬を使用した！ HPが ${healAmt} 回復した！ (残り${healsLeft - 1}回)`,
      ...logs
    ].slice(0, 15));
  };

  // 攻撃処理（プレイヤー即時反映 ＋ ボス反撃 ＋ 仲間加勢）
  const handleAttack = () => {
    if (cooldown > 0 || isAttacking || faintSeconds > 0 || bossHp <= 0) return;

    setIsAttacking(true);

    const isCrit = Math.random() < 0.22;
    const critMult = isCrit ? 1.85 : 1.0;
    const variance = 0.85 + (Math.random() * 0.30);
    const calculatedDmg = Math.max(15, Math.floor(myTotalAtk * variance * critMult));

    unsyncedDamageRef.current += calculatedDmg;

    const allyDmg = Math.floor(80 + Math.random() * 180);
    const totalTurnDmg = calculatedDmg + allyDmg;

    const nextHp = Math.max(0, bossHp - totalTurnDmg);
    setBossHp(nextHp);
    try { localStorage.setItem(getTodayKey(), String(nextHp)); } catch (e) {}

    setDamagePopup({ val: calculatedDmg, isCrit });
    setTimeout(() => setDamagePopup(null), 1100);

    const weaponName = equipment?.weapon?.name || '素手';
    const logMsg = isCrit
      ? `💥 【会心の一撃！】 『${weaponName}』 で ${calculatedDmg.toLocaleString()} の超大ダメージ！`
      : `⚔️ 『${weaponName}』 で ${calculatedDmg.toLocaleString()} のダメージを与えた！`;

    let updatedRanking = rankingList.map(entry => {
      if (entry.isMe) {
        return { ...entry, name: hn || 'あなた', damage: entry.damage + calculatedDmg };
      }
      const npcBonus = Math.random() < 0.4 ? Math.floor(Math.random() * 60) : 0;
      return { ...entry, damage: entry.damage + npcBonus };
    });
    updatedRanking.sort((a, b) => b.damage - a.damage);
    setRankingList(updatedRanking);
    try { localStorage.setItem(getRankingKey(), JSON.stringify(updatedRanking)); } catch (e) {}

    const smallExp = Math.floor(calculatedDmg / 20) + 6;
    if (addExp) addExp(smallExp);

    if (nextHp > 0) {
      setTimeout(() => {
        const randomSkill = currentBoss.skills[Math.floor(Math.random() * currentBoss.skills.length)];
        const rawEnemyAtk = 30 + (userLevel * 3.2);
        const isBossCrit = Math.random() < 0.15;
        const bossVariance = 0.85 + (Math.random() * 0.3);
        const mitigatedDmg = Math.max(8, Math.floor((rawEnemyAtk * bossVariance * (isBossCrit ? 1.5 : 1.0)) - (myTotalDef * 0.4)));

        setPlayerHp(curHp => {
          const nextPlayerHp = Math.max(0, curHp - mitigatedDmg);
          setBossAttackPopup({ val: mitigatedDmg, skill: randomSkill, isCrit: isBossCrit });
          setTimeout(() => setBossAttackPopup(null), 1200);

          if (nextPlayerHp === 0) {
            const faintTime = 30;
            setFaintSeconds(faintTime);
            try {
              localStorage.setItem(getFaintKey(), String(Date.now() + faintTime * 1000));
            } catch (e) {}
            setRaidLogs(prev => [
              `😵 【戦闘不能…！】 ボスの強烈な一撃で気絶してしまった！ (回復薬で即復帰可能)`,
              `💥 『${currentBoss.name}』の『${randomSkill}』！ あなたは ${mitigatedDmg} のダメージを受けた！`,
              logMsg,
              ...prev
            ].slice(0, 15));
          } else {
            setRaidLogs(prev => [
              `💥 『${currentBoss.name}』の『${randomSkill}』！ あなたは ${mitigatedDmg} のダメージを受けた！`,
              logMsg,
              ...prev
            ].slice(0, 15));
          }
          return nextPlayerHp;
        });
      }, 400);
    } else {
      const victoryMsg = `🎉🎉 【討伐成功！！】 広場のみんなで 『${currentBoss.name}』 を打ち倒した！！ 🎉🎉`;
      setRaidLogs(prev => [victoryMsg, logMsg, ...prev].slice(0, 15));
      if (addTickets) addTickets(currentBoss.rewardTickets);
      if (addExp) addExp(currentBoss.rewardExp);
    }

    setCooldown(3);
    setIsAttacking(false);
  };

  const hpPercent = Math.max(0, Math.min(100, (bossHp / currentBoss.maxHp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / pMaxHp) * 100));

  const myRankIdx = rankingList.findIndex(r => r.isMe);
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : rankingList.length;

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '12px',
      color: '#f8fafc',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ボスヘッダー情報 */}
      <div style={{
        background: currentBoss.bgGradient,
        borderRadius: '10px',
        padding: '10px 10px 8px 10px',
        border: `1px solid ${currentBoss.accentColor}44`,
        boxShadow: `0 4px 16px ${currentBoss.accentColor}22`,
        marginBottom: '8px',
        position: 'relative'
      }}>
        {/* 曜日バッジ ＆ 10秒同期インジケーター */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.4)',
            color: currentBoss.accentColor,
            padding: '2px 8px',
            borderRadius: '10px',
            border: `1px solid ${currentBoss.accentColor}66`
          }}>
            {currentBoss.dayName}限定
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              display: 'inline-block',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isOnlineConnected ? '#22c55e' : '#f59e0b',
              boxShadow: isOnlineConnected ? '0 0 6px #22c55e' : 'none'
            }}></span>
            <span>共闘同期 {syncSecondsLeft}s</span>
          </span>
        </div>

        {/* ボスアイコン ＆ ダメージポップアップ */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '2px 0' }}>
          <div style={{
            fontSize: '3.4rem',
            filter: `drop-shadow(0 0 14px ${currentBoss.accentColor}88)`,
            transform: isAttacking ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s'
          }}>
            {currentBoss.icon}
          </div>

          {damagePopup && (
            <div style={{
              position: 'absolute',
              top: '10%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: damagePopup.isCrit ? '#fbbf24' : '#ef4444',
              fontSize: damagePopup.isCrit ? '1.4rem' : '1.15rem',
              fontWeight: '900',
              textShadow: damagePopup.isCrit 
                ? '0 0 10px rgba(251, 191, 36, 0.9), 0 2px 4px rgba(0,0,0,0.8)' 
                : '0 0 8px rgba(239, 68, 68, 0.8), 0 2px 4px rgba(0,0,0,0.8)',
              pointerEvents: 'none',
              animation: 'bounce 0.4s ease'
            }}>
              {damagePopup.isCrit && <div style={{ fontSize: '0.7rem', color: '#fef08a' }}>CRITICAL!!</div>}
              -{damagePopup.val.toLocaleString()}
            </div>
          )}

          {bossAttackPopup && (
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translate(-50%, 0)',
              color: '#f87171',
              fontSize: '0.82rem',
              fontWeight: 'bold',
              background: 'rgba(0,0,0,0.85)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #ef4444',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
            }}>
              💥 『{bossAttackPopup.skill}』 -{bossAttackPopup.val}
            </div>
          )}
        </div>

        {/* ボス名 */}
        <div style={{ fontSize: '1.02rem', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px', margin: '2px 0 2px 0' }}>
          {currentBoss.name}
        </div>

        {/* 巨大HPバー */}
        <div style={{ marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 'bold', marginBottom: '2px' }}>
            <span style={{ color: '#ef4444' }}>BOSS HP</span>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
              {bossHp.toLocaleString()} / {currentBoss.maxHp.toLocaleString()} ({hpPercent.toFixed(1)}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '13px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '7px',
            border: '1px solid rgba(255,255,255,0.15)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: `${hpPercent}%`,
              height: '100%',
              background: hpPercent > 50 
                ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)' 
                : hpPercent > 20 
                  ? 'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)' 
                  : 'linear-gradient(90deg, #991b1b 0%, #ef4444 100%)',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
      </div>

      {/* 📢 【新配置】リアルタイム実況ログ（ゆったり広げて見やすさ大幅UP！） */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.55)',
        borderRadius: '8px',
        padding: '8px 10px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'left',
        maxHeight: '105px',
        overflowY: 'auto',
        scrollbarWidth: 'thin'
      }}>
        {raidLogs.slice(0, 5).map((log, idx) => {
          const isLatest = idx === 0;
          const isFaint = log.includes('気絶') || log.includes('戦闘不能');
          const isHeal = log.includes('回復薬');
          const isCrit = log.includes('会心');
          const isAlly = log.includes('共闘速報');

          let color = '#cbd5e1';
          if (isFaint) color = '#fca5a5';
          else if (isHeal) color = '#86efac';
          else if (isCrit) color = '#fef08a';
          else if (isAlly) color = '#38bdf8';

          return (
            <div
              key={idx}
              style={{
                fontSize: isLatest ? '0.76rem' : '0.7rem',
                fontWeight: isLatest ? 'bold' : 'normal',
                color,
                lineHeight: 1.45,
                marginBottom: '3px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '5px'
              }}
            >
              {isLatest && <span style={{ color: '#fbbf24', fontSize: '0.65rem' }}>▶</span>}
              <span>{log}</span>
            </div>
          );
        })}
      </div>

      {/* プレイヤーのHP & 戦闘力ステータス */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        padding: '7px 9px',
        marginBottom: '8px',
        textAlign: 'left',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        {/* プレイヤーHPバー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 'bold', marginBottom: '3px' }}>
          <span style={{ color: faintSeconds > 0 ? '#ef4444' : '#10b981' }}>
            {faintSeconds > 0 ? `😵 気絶中… (残り${faintSeconds}秒)` : '💚 あなたのHP'}
          </span>
          <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
            {playerHp} / {pMaxHp}
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '6px'
        }}>
          <div style={{
            width: `${playerHpPercent}%`,
            height: '100%',
            background: faintSeconds > 0 
              ? '#64748b' 
              : playerHpPercent > 50 
                ? 'linear-gradient(90deg, #10b981, #34d399)' 
                : playerHpPercent > 25 
                  ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                  : 'linear-gradient(90deg, #ef4444, #f87171)',
            transition: 'width 0.3s'
          }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>ATK </span>
            <strong style={{ color: '#fbbf24' }}>{myTotalAtk}</strong>
            <span style={{ color: '#94a3b8', marginLeft: '6px' }}>DEF </span>
            <strong style={{ color: '#60a5fa' }}>{myTotalDef}</strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>累計: </span>
            <strong style={{ color: '#38bdf8' }}>{myDamage.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* ⚔️ 操作ボタン（攻撃 ＆ 🧪回復薬の2列配置） */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px', marginBottom: '8px' }}>
        {/* 攻撃アクションボタン */}
        <button
          onClick={handleAttack}
          disabled={cooldown > 0 || faintSeconds > 0 || bossHp <= 0}
          style={{
            padding: '11px',
            borderRadius: '8px',
            border: 'none',
            background: bossHp <= 0
              ? '#334155'
              : faintSeconds > 0
                ? '#475569'
                : cooldown > 0
                  ? '#475569'
                  : 'linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
            borderBottom: (cooldown > 0 || faintSeconds > 0 || bossHp <= 0) ? 'none' : '3px solid #991b1b',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.92rem',
            cursor: cooldown > 0 || faintSeconds > 0 || bossHp <= 0 ? 'not-allowed' : 'pointer',
            boxShadow: cooldown > 0 || faintSeconds > 0 || bossHp <= 0 ? 'none' : '0 3px 10px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          {bossHp <= 0 ? (
            <span>🎉 本日の討伐成功！</span>
          ) : faintSeconds > 0 ? (
            <span>😵 気絶中... ({faintSeconds}s)</span>
          ) : cooldown > 0 ? (
            <span>⏳ 準備中... ({cooldown}s)</span>
          ) : (
            <>
              <span>⚔️</span>
              <span>攻撃する！</span>
            </>
          )}
        </button>

        {/* 🧪 回復薬ボタン（HP回復 ＆ 気絶時の即時復活対応） */}
        <button
          onClick={handleHeal}
          disabled={healsLeft <= 0 || (playerHp >= pMaxHp && faintSeconds <= 0) || bossHp <= 0}
          title={faintSeconds > 0 ? "回復薬で即座に気絶から復活！" : "HPを約50%回復します"}
          style={{
            padding: '11px 12px',
            borderRadius: '8px',
            border: '1px solid #059669',
            borderBottom: '3px solid #047857',
            background: healsLeft <= 0 || (playerHp >= pMaxHp && faintSeconds <= 0)
              ? '#334155'
              : faintSeconds > 0
                ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)' // 気絶中は目立つゴールド「即復活！」
                : 'linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.82rem',
            cursor: healsLeft <= 0 || (playerHp >= pMaxHp && faintSeconds <= 0) ? 'not-allowed' : 'pointer',
            boxShadow: healsLeft <= 0 ? 'none' : '0 3px 8px rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <span>🧪</span>
          <span>{faintSeconds > 0 ? '即復活' : '回復'}</span>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(0,0,0,0.25)',
            padding: '1px 5px',
            borderRadius: '6px'
          }}>
            {healsLeft}
          </span>
        </button>
      </div>

      {/* 🏆 ダメージ貢献ランキングカード */}
      <div style={{
        padding: '8px 10px',
        background: 'rgba(0, 0, 0, 0.35)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'left',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🏆</span>
            <span>ダメージ貢献ランキング</span>
          </span>
          <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 'bold' }}>
            現在 {myRank}位 🔥
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {rankingList.slice(0, 5).map((item, idx) => {
            const isMe = item.isMe;
            const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 7px',
                  borderRadius: '5px',
                  background: isMe ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isMe ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  fontSize: '0.7rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                  <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold' }}>{medal}</span>
                  <span style={{
                    fontWeight: isMe ? 'bold' : 'normal',
                    color: isMe ? '#38bdf8' : '#e2e8f0',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '140px'
                  }}>
                    {item.name} {isMe && '(あなた)'}
                  </span>
                </div>
                <div style={{ fontWeight: 'bold', color: isMe ? '#38bdf8' : '#94a3b8', fontFamily: 'monospace' }}>
                  {item.damage.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ボススキル / 報酬情報カード */}
      <div style={{
        padding: '6px 8px',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '6px',
        fontSize: '0.66rem',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '2px' }}>
          <span>討伐報酬:</span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
            🎫 ガチャチケ {currentBoss.rewardTickets}枚 / ⭐ {currentBoss.rewardExp} EXP
          </span>
        </div>
        <div style={{ color: '#94a3b8' }}>
          <span>警戒スキル: </span>
          <span style={{ color: '#fca5a5' }}>{currentBoss.skills.join(' / ')}</span>
        </div>
      </div>
    </div>
  );
};

export default RaidBossMiniGame;
