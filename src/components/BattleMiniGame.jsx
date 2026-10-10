import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const BattleMiniGame = ({ userLevel, addExp, equipment, globalOnlineCount, user }) => {
  const [battleLog, setBattleLog] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [rewardMessage, setRewardMessage] = useState('');
  
  // 今日の曜日に合わせたボス名
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const todayDay = days[new Date().getDay()];
  const bossName = `${todayDay}曜日の魔物`;

  // 🐉 レイドボスの状態
  const BOSS_MAX_HP = 500000; // 50万HP（現実的なラインに調整）
  const [totalDamage, setTotalDamage] = useState(0);
  const [isBossLoading, setIsBossLoading] = useState(true);

  // 1日のバトル回数制限 (最大3回)
  const getTodayBattles = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    let data;
    try { data = JSON.parse(localStorage.getItem('daily_battles_v2') || '{}'); } catch { data = {}; }
    if (data.date !== todayStr) return { date: todayStr, count: 0 };
    return data;
  };
  const [battlesToday, setBattlesToday] = useState(getTodayBattles().count);
  const MAX_BATTLES = 3;

  // ステータス計算
  const equipAtk = (equipment?.weapon?.atk || 0) + (equipment?.accessory?.atk || 0);
  const baseAtk = userLevel * 5 + 10;
  const myAtk = baseAtk + equipAtk;

  const weaponName = equipment?.weapon?.name || '素手';
  const weaponRarity = equipment?.weapon?.rarity || 'N';
  const rarityStar = weaponRarity === 'UR' ? '✨UR ' : weaponRarity === 'SR' ? '⭐SR ' : weaponRarity === 'R' ? '🔸R ' : '';

  // 📡 ボスのダメージ履歴をタイムラインから集計
  useEffect(() => {
    const fetchDamage = async () => {
      const { data } = await supabase
        .from('timeline_posts')
        .select('content')
        .in('name', ['🤖 コロシアム実況', '🤖 みんクエ実況bot']);
      
      if (data) {
        let dmg = 0;
        data.forEach(p => {
          const match = p.content.match(/で ([\d,]+) ダメージ/);
          if (match) {
            dmg += parseInt(match[1].replace(/,/g, ''), 10);
          }
        });
        setTotalDamage(dmg);
      }
      setIsBossLoading(false);
    };
    fetchDamage();

    // リアルタイムで誰かが殴ったのを検知
    const channel = supabase.channel('boss_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_posts' }, (payload) => {
        if (payload.new.name === '🤖 コロシアム実況' || payload.new.name === '🤖 みんクエ実況bot') {
          const match = payload.new.content.match(/で ([\d,]+) ダメージ/);
          if (match) {
            const newDmg = parseInt(match[1].replace(/,/g, ''), 10);
            setTotalDamage(prev => prev + newDmg);
            setBattleLog(prev => [...prev.slice(-3), payload.new.content]); // 他人のログも表示
          }
        }
      }).subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const bossHp = Math.max(0, BOSS_MAX_HP - totalDamage);
  const hpPercent = Math.max(0, Math.min(100, (bossHp / BOSS_MAX_HP) * 100));

  const hitSandbag = async () => {
    if (battlesToday >= MAX_BATTLES || isPosting || bossHp <= 0) return;
    setIsPosting(true);
    
    // ダメージ計算（装備のレア度でド派手にインフレする脳汁仕様を復活！）
    let damage = myAtk;
    if (weaponRarity === 'UR') damage *= (800 + Math.random() * 400); // 約1000倍
    else if (weaponRarity === 'SR') damage *= (80 + Math.random() * 40); // 約100倍
    else if (weaponRarity === 'R') damage *= (8 + Math.random() * 4); // 約10倍
    else damage *= (0.8 + Math.random() * 0.4); // 素手・N装備
    
    // 10%の確率で会心の一撃（さらに1.5倍！）
    const isCritical = Math.random() < 0.1;
    if (isCritical) damage *= 1.5;
    
    damage = Math.max(1, Math.floor(damage));
    
    const playerName = localStorage.getItem('minake_hn') || '匿名広場民';
    const timelineMessage = isCritical
      ? `📢 [${playerName}] の会心の一撃！【${rarityStar}${weaponName}】で ${damage.toLocaleString()} ダメージを与えた！！！⚡️💥`
      : `📢 [${playerName}] が【${rarityStar}${weaponName}】で ${damage.toLocaleString()} ダメージを与えた！💥`;

    // 自分の画面にはすぐにログを表示する
    setBattleLog(prev => [...prev.slice(-2), timelineMessage]);

    // 🚨 【テスト中はストップ！】タイムラインへの実況送信を一時的に無効化
    // 本番環境のみんなのタイムラインに謎の実況が流れてしまうのを防ぐためです🐰💦
    /*
    await supabase
      .from('timeline_posts')
      .insert([{
        name: '🤖 みんクエ実況bot',
        avatar: '📢',
        content: timelineMessage
      }]);
    */

    // ダメージをローカルステートに加算（本来はDBから同期）
    const newTotalDamage = totalDamage + damage;
    setTotalDamage(newTotalDamage);

    // 報酬と回数消費
    const currentData = getTodayBattles();
    currentData.count += 1;
    localStorage.setItem('daily_battles_v2', JSON.stringify(currentData));
    setBattlesToday(currentData.count);

    // 討伐判定（トドメを刺したか？）
    const isKillingBlow = totalDamage < BOSS_MAX_HP && newTotalDamage >= BOSS_MAX_HP;

    if (addExp) addExp(isKillingBlow ? 50 : 5);
    if (window.addTicketsGlobal) window.addTicketsGlobal(isKillingBlow ? 10 : 1);

    setTimeout(() => {
      setIsPosting(false);
      if (isKillingBlow) {
        setRewardMessage('🎉 見事トドメを刺した！ 50 EXP & ガチャチケ🎫x10 を獲得！！');
        setBattleLog(prev => [...prev, `🎊 [${playerName}] が ${bossName} にトドメを刺した！！！ 世界は平和になった！🕊️`]);
      } else {
        setRewardMessage('🎁 参加報酬：5 EXP & ガチャチケ🎫x1 獲得！');
      }
      setTimeout(() => setRewardMessage(''), isKillingBlow ? 6000 : 3000);
    }, 1000);
  };

  return (
    <div style={{ marginTop: '16px', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', borderRadius: '12px', border: '2px solid #334155', padding: '16px', color: 'white', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', lineHeight: '1.4' }}>
            🚨 【緊急討伐】<br />{bossName}
          </h4>
          <span style={{ fontSize: '0.65rem', background: '#ef4444', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', animation: 'pulse-red 2s infinite', whiteSpace: 'nowrap', flexShrink: 0 }}>全プレイヤー協力戦</span>
        </div>
      </div>
      
      {/* 🐲 ボスのHPバー */}
      <div style={{ background: '#334155', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px inset #475569' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px' }}>
          <span>ボスの残りHP</span>
          <span style={{ color: bossHp === 0 ? '#10b981' : '#f8fafc' }}>
            {isBossLoading ? '読込中...' : bossHp === 0 ? '討伐完了！' : `${bossHp.toLocaleString()} / ${BOSS_MAX_HP.toLocaleString()}`}
          </span>
        </div>
        <div style={{ width: '100%', background: '#0f172a', height: '14px', borderRadius: '7px', overflow: 'hidden', border: '1px solid #1e293b' }}>
          <div style={{ width: `${hpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #ef4444, #b91c1c)', transition: 'width 0.5s ease-out' }}></div>
        </div>
      </div>

      {/* 自分のステータス表示 */}
      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', color: '#cbd5e1' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#f87171', fontWeight: 'bold' }}>あなたの攻撃力 (ATK): {myAtk}</span>
            <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#94a3b8' }}>装備中: {rarityStar}{weaponName}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', background: '#0f172a', padding: '8px', borderRadius: '6px', border: '1px solid #334155', minHeight: '60px' }}>
          <div style={{ color: '#94a3b8', marginBottom: '4px', borderBottom: '1px solid #334155', paddingBottom: '2px' }}>📡 リアルタイム攻撃ログ</div>
          {battleLog.length === 0 ? <div style={{ color: '#64748b' }}>待機中...</div> : battleLog.map((log, i) => (
            <div key={i} style={{ padding: '2px 0', animation: 'fadeIn 0.3s ease-out', color: i === battleLog.length - 1 ? '#f87171' : '#94a3b8' }}>
              {log}
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={hitSandbag}
        disabled={battlesToday >= MAX_BATTLES || isPosting || bossHp === 0}
        style={{
          width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
          background: bossHp === 0 ? '#10b981' : battlesToday >= MAX_BATTLES ? '#475569' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
          color: bossHp === 0 || battlesToday >= MAX_BATTLES ? '#cbd5e1' : 'white',
          fontWeight: '900', cursor: (battlesToday >= MAX_BATTLES || bossHp === 0 || isPosting) ? 'not-allowed' : 'pointer',
          boxShadow: (battlesToday >= MAX_BATTLES || bossHp === 0) ? 'none' : '0 0 15px rgba(245, 158, 11, 0.5)',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)', fontSize: '1rem',
          transition: 'all 0.2s ease-in-out',
          opacity: isPosting ? 0.7 : 1
        }}
      >
        {isPosting ? '⚔️ 攻撃中...' : bossHp === 0 ? '🎉 討伐成功！（報酬配布待ち）' : battlesToday >= MAX_BATTLES ? '✅ 本日の攻撃権を使い切りました' : `⚔️ ボスを攻撃する！ (残り${MAX_BATTLES - battlesToday}回)`}
      </button>

      {/* フワッと出る報酬メッセージ */}
      <div style={{ height: '24px', marginTop: '8px', textAlign: 'center' }}>
        {rewardMessage && (
          <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.85rem', animation: 'pulse 1s' }}>
            {rewardMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleMiniGame;
