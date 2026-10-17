import React, { useState, useEffect, useRef } from 'react';
import RAID_BOSSES from '../data/raid_bosses.json';
import { ITEMS, getRarityColor, getRarityTextStyle, getRarityBadgeStyle, RARITY_CONFIG } from '../items';

const RaidBossMiniGame = ({
  userLevel = 1,
  userExp = 0,
  addExp,
  gachaTickets = 0,
  addTickets,
  equipment = {},
  user,
  globalOnlineCount = 1
}) => {
  // 今日の曜日 (0:日, 1:月, ..., 6:土)
  const todayDay = new Date().getDay();
  const currentBoss = RAID_BOSSES.find(b => b.day === todayDay) || RAID_BOSSES[0];

  // 1日のレイドボスHP管理 (ローカル＋クラウド同期用キャッシュ)
  const getTodayKey = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return `minique_raid_boss_${currentBoss.id}_${todayStr}`;
  };

  const [bossHp, setBossHp] = useState(() => {
    try {
      const saved = localStorage.getItem(getTodayKey());
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return currentBoss.maxHp;
  });

  // プレイヤーの総合攻撃力計算
  const equipSlots = ['weapon', 'armor', 'accessory', 'partner'];
  const baseAtk = (userLevel * 5) + 10;
  const equipAtk = equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.atk || 0), 0);
  const myTotalAtk = baseAtk + equipAtk;

  // バトルステート
  const [isAttacking, setIsAttacking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [damagePopup, setDamagePopup] = useState(null);
  const [raidLogs, setRaidLogs] = useState(() => [
    `⚔️ 【${currentBoss.title}】 ${currentBoss.name} が広場に出現中！`,
    `📢 広場のみんなで力を合わせて巨大ボスを討伐しよう！`
  ]);
  const [myTotalDamage, setMyTotalDamage] = useState(0);

  // クールタイムタイマー
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => Math.max(0, prev - 1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 攻撃処理
  const handleAttack = () => {
    if (cooldown > 0 || isAttacking || bossHp <= 0) return;

    setIsAttacking(true);

    // 会心の一撃や乱数の計算
    const isCrit = Math.random() < 0.20;
    const critMult = isCrit ? 1.8 : 1.0;
    const variance = 0.85 + (Math.random() * 0.30);
    const calculatedDmg = Math.max(10, Math.floor(myTotalAtk * variance * critMult));

    // 新しいHP
    const nextHp = Math.max(0, bossHp - calculatedDmg);
    setBossHp(nextHp);
    setMyTotalDamage(prev => prev + calculatedDmg);

    try {
      localStorage.setItem(getTodayKey(), String(nextHp));
    } catch (e) {}

    // ダメージポップアップ
    setDamagePopup({
      val: calculatedDmg,
      isCrit
    });
    setTimeout(() => setDamagePopup(null), 1200);

    // ログ追加
    const weaponName = equipment?.weapon?.name || '素手';
    const logMsg = isCrit
      ? `💥 【会心の一撃！】 『${weaponName}』 で ${calculatedDmg.toLocaleString()} の超大ダメージを与えた！`
      : `⚔️ 『${weaponName}』 で ${calculatedDmg.toLocaleString()} のダメージを与えた！`;

    setRaidLogs(prev => [logMsg, ...prev].slice(0, 15));

    // EXPボーナス（微量）
    const smallExp = Math.floor(calculatedDmg / 20) + 5;
    if (addExp) addExp(smallExp);

    // クールタイム設定 (3秒)
    setCooldown(3);
    setIsAttacking(false);

    // ボス撃破判定
    if (nextHp === 0) {
      const victoryMsg = `🎉🎉 【討伐成功！！】 みんなで 『${currentBoss.name}』 を打ち倒した！ 🎉🎉`;
      setRaidLogs(prev => [victoryMsg, ...prev]);
      if (addTickets) addTickets(currentBoss.rewardTickets);
      if (addExp) addExp(currentBoss.rewardExp);
    }
  };

  const hpPercent = Math.max(0, Math.min(100, (bossHp / currentBoss.maxHp) * 100));

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.65)',
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
        padding: '12px 10px',
        border: `1px solid ${currentBoss.accentColor}44`,
        boxShadow: `0 4px 16px ${currentBoss.accentColor}22`,
        marginBottom: '12px',
        position: 'relative'
      }}>
        {/* 曜日バッジ ＆ 参加人数 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 'bold',
            background: 'rgba(0,0,0,0.4)',
            color: currentBoss.accentColor,
            padding: '2px 8px',
            borderRadius: '10px',
            border: `1px solid ${currentBoss.accentColor}66`
          }}>
            {currentBoss.dayName}限定
          </span>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
            オンライン共闘中
          </span>
        </div>

        {/* ボスアイコン ＆ ダメージポップアップ */}
        <div style={{ position: 'relative', display: 'inline-block', margin: '4px 0' }}>
          <div style={{
            fontSize: '3.8rem',
            filter: `drop-shadow(0 0 14px ${currentBoss.accentColor}88)`,
            transform: isAttacking ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s'
          }}>
            {currentBoss.icon}
          </div>

          {/* ダメージポップアップ */}
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
        </div>

        {/* ボス名 */}
        <div style={{ fontSize: '0.75rem', color: currentBoss.accentColor, fontWeight: 'bold' }}>
          {currentBoss.title}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px', margin: '2px 0 6px 0' }}>
          {currentBoss.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4, maxWidth: '280px', margin: '0 auto' }}>
          {currentBoss.desc}
        </div>

        {/* 巨大HPバー */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', fontWeight: 'bold', marginBottom: '3px' }}>
            <span style={{ color: '#ef4444' }}>HP 残量</span>
            <span style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
              {bossHp.toLocaleString()} / {currentBoss.maxHp.toLocaleString()} ({hpPercent.toFixed(1)}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '14px',
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

      {/* プレイヤー戦闘力 ＆ 攻撃ボタン */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: '8px',
        padding: '8px 10px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem'
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>現在の攻撃力</div>
          <div style={{ fontWeight: 'bold', color: '#fbbf24' }}>
            ⚔️ ATK {myTotalAtk.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>あなたの与ダメージ</div>
          <div style={{ fontWeight: 'bold', color: '#38bdf8' }}>
            {myTotalDamage.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 攻撃アクションボタン */}
      <button
        onClick={handleAttack}
        disabled={cooldown > 0 || bossHp <= 0}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: '8px',
          border: 'none',
          background: bossHp <= 0
            ? '#334155'
            : cooldown > 0
              ? '#475569'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.92rem',
          cursor: cooldown > 0 || bossHp <= 0 ? 'not-allowed' : 'pointer',
          boxShadow: cooldown > 0 || bossHp <= 0 ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.45)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        {bossHp <= 0 ? (
          <span>🎉 本日のレイドボス討伐成功！</span>
        ) : cooldown > 0 ? (
          <span>⏳ 攻撃準備中... ({cooldown}秒)</span>
        ) : (
          <>
            <span>⚔️</span>
            <span>ボスを一斉攻撃する！</span>
          </>
        )}
      </button>

      {/* ボススキル / 報酬情報カード */}
      <div style={{
        marginTop: '10px',
        padding: '6px 8px',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '6px',
        fontSize: '0.68rem',
        color: '#94a3b8',
        display: 'flex',
        justifyContent: 'space-around'
      }}>
        <div>🎁 討伐報酬: <strong style={{ color: '#fbbf24' }}>+{currentBoss.rewardExp} EXP</strong></div>
        <div>🎫 チケット: <strong style={{ color: '#34d399' }}>+{currentBoss.rewardTickets}枚</strong></div>
      </div>

      {/* リアルタイム戦闘ログ */}
      <div style={{
        marginTop: '10px',
        textAlign: 'left',
        background: 'rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '8px',
        padding: '8px 10px'
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>📜</span>
          <span>レイド実況ログ</span>
        </div>
        <div style={{
          maxHeight: '90px',
          overflowY: 'auto',
          fontSize: '0.68rem',
          lineHeight: 1.45,
          color: '#cbd5e1',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}>
          {raidLogs.map((log, idx) => (
            <div key={idx} style={{ opacity: Math.max(0.4, 1 - (idx * 0.1)) }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RaidBossMiniGame;
