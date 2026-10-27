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

  const getLogsKey = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return `minique_raid_logs_${currentBoss.id}_${todayStr}`;
  };

  const getAttackedKey = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    return `minique_raid_attacked_${currentBoss.id}_${todayStr}`;
  };

  const RAID_RESET_VERSION = '20261027_clean_v2';

  // ☁️ レイド進捗（ボスHP・自ダメージ・ランキング・回復薬・実況ログ）のクラウド ＆ ローカル双方向同期
  const getInitialRaidProgress = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // 🧹 過去テストデータ・同名混線データの確実な強制クリーンアップ
    try {
      if (localStorage.getItem('minique_raid_reset_version') !== RAID_RESET_VERSION) {
        localStorage.removeItem(getTodayKey());
        localStorage.removeItem(getRankingKey());
        localStorage.removeItem(getFaintKey());
        localStorage.removeItem(getLogsKey());
        localStorage.removeItem(getAttackedKey());
        localStorage.removeItem(`minique_raid_heals_${currentBoss.id}_${todayStr}`);
        localStorage.removeItem(`minique_raid_participation_${todayStr}`);
        localStorage.setItem('minique_raid_reset_version', RAID_RESET_VERSION);
      }
    } catch (e) {}

    const hasLocallyAttacked = (() => {
      try { return localStorage.getItem(getAttackedKey()) === 'true'; } catch (e) { return false; }
    })();

    let localBossHp = currentBoss.maxHp;
    try {
      const saved = localStorage.getItem(getTodayKey());
      if (saved && hasLocallyAttacked) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) localBossHp = Math.min(parsed, currentBoss.maxHp);
      }
    } catch (e) {}

    let localRanking = null;
    try {
      const saved = localStorage.getItem(getRankingKey());
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // 自分がまだ1回も攻撃していない場合は、isMeのダメージを必ず0に保つ（他人の匿名通信混入防止）
          localRanking = parsed.map(r => r.isMe ? { ...r, damage: hasLocallyAttacked ? (r.damage || 0) : 0 } : r)
            .sort((a, b) => b.damage - a.damage);
        }
      }
    } catch (e) {}

    let localHeals = 3;
    try {
      const saved = localStorage.getItem(`minique_raid_heals_${currentBoss.id}_${todayStr}`);
      if (saved !== null && hasLocallyAttacked) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) localHeals = Math.max(0, Math.min(3, parsed));
      }
    } catch (e) {}

    let localLogs = null;
    try {
      const saved = localStorage.getItem(getLogsKey());
      if (saved && hasLocallyAttacked) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) localLogs = parsed;
      }
    } catch (e) {}

    const defaultLogs = localLogs || [
      `⚔️ 【${currentBoss.title}】 ${currentBoss.name} が広場に出現中！`,
      `📡 10秒更新のリアルタイム通信で広場のみんなと共闘中！`
    ];

    const defaultRanking = localRanking || [
      { id: 'npc_1', name: 'ベテラン広場民 🛡️', damage: 8500, isMe: false },
      { id: 'npc_2', name: '深夜の調査兵 🔦', damage: 5200, isMe: false },
      { id: 'npc_3', name: 'らびたん親衛隊 🐰', damage: 3400, isMe: false },
      { id: 'npc_4', name: '週末パトロール隊長 🚓', damage: 1800, isMe: false },
      { id: 'me', name: hn || 'あなた', damage: 0, isMe: true }
    ];

    // クラウドデータの統合（現行リセットバージョンと一致するもののみ信頼）
    const cloudProgress = user?.user_metadata?.raid_progress_v1;
    if (
      cloudProgress &&
      cloudProgress.resetVersion === RAID_RESET_VERSION &&
      cloudProgress.date === todayStr &&
      cloudProgress.bossId === currentBoss.id
    ) {
      const syncedBossHp = typeof cloudProgress.bossHp === 'number'
        ? Math.min(localBossHp, cloudProgress.bossHp)
        : localBossHp;
      const cloudMyDmg = typeof cloudProgress.myDamage === 'number' ? cloudProgress.myDamage : 0;
      const localMyDmg = hasLocallyAttacked ? (defaultRanking.find(r => r.isMe)?.damage || 0) : 0;
      const syncedMyDmg = Math.max(cloudMyDmg, localMyDmg);
      const syncedHeals = typeof cloudProgress.healsLeft === 'number'
        ? Math.min(localHeals, cloudProgress.healsLeft)
        : localHeals;
      const cloudLogs = Array.isArray(cloudProgress.raidLogs) && cloudProgress.raidLogs.length > 0
        ? cloudProgress.raidLogs
        : null;
      const syncedLogs = cloudLogs || defaultLogs;

      const cleanedDefault = defaultRanking.filter(r => r.isMe || r.name !== (hn || 'あなた'));
      const syncedRanking = cleanedDefault.map(r => {
        if (r.isMe) return { ...r, damage: syncedMyDmg, name: hn || 'あなた' };
        return r;
      }).sort((a, b) => b.damage - a.damage);

      try {
        if (syncedMyDmg > 0) localStorage.setItem(getAttackedKey(), 'true');
        localStorage.setItem(getTodayKey(), String(syncedBossHp));
        localStorage.setItem(getRankingKey(), JSON.stringify(syncedRanking));
        localStorage.setItem(`minique_raid_heals_${currentBoss.id}_${todayStr}`, String(syncedHeals));
        localStorage.setItem(getLogsKey(), JSON.stringify(syncedLogs));
      } catch (e) {}

      return {
        bossHp: syncedBossHp,
        rankingList: syncedRanking,
        healsLeft: syncedHeals,
        raidLogs: syncedLogs
      };
    }

    return {
      bossHp: localBossHp,
      rankingList: defaultRanking,
      healsLeft: localHeals,
      raidLogs: defaultLogs
    };
  };

  const initialProgress = useRef(getInitialRaidProgress());
  const [bossHp, setBossHp] = useState(() => initialProgress.current.bossHp);

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
  const [healsLeft, setHealsLeft] = useState(() => initialProgress.current.healsLeft);

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
  const [raidLogs, setRaidLogs] = useState(() => initialProgress.current.raidLogs || [
    `⚔️ 【${currentBoss.title}】 ${currentBoss.name} が広場に出現中！`,
    `📡 10秒更新のリアルタイム通信で広場のみんなと共闘中！`
  ]);

  // 📜 レイド専用ログをローカルストレージへ自動永続化（リロードでもしっかり残る！）
  useEffect(() => {
    if (raidLogs && raidLogs.length > 0) {
      try {
        localStorage.setItem(getLogsKey(), JSON.stringify(raidLogs));
      } catch (e) {}
    }
  }, [raidLogs]);

  // クールタイムタイマー
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => Math.max(0, prev - 1)), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 🏆 ダメージ貢献ランキング管理
  const [rankingList, setRankingList] = useState(() => initialProgress.current.rankingList);
  const myDamage = rankingList.find(r => r.isMe)?.damage || 0;

  // ハンドルネーム変更時に自分のランキング表示名も即時反映
  useEffect(() => {
    if (!hn) return;
    setRankingList(prev => prev.map(r => r.isMe ? { ...r, name: hn } : r));
  }, [hn]);

  // ☁️ ユーザーログイン時・端末切替時にクラウドから最新のレイド進捗を同期
  useEffect(() => {
    if (!user) return;
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

    // 🔄 クラウド側でレイド進捗のリセットフラグが立っている場合、端末の古いローカルデータも綺麗に初期化
    const resetFlag = user.user_metadata?.raid_reset_flag;
    const localResetFlag = localStorage.getItem('minique_raid_last_reset_flag');
    const cloudProgress = user.user_metadata?.raid_progress_v1;
    const isOutdatedCloud = cloudProgress && (
      cloudProgress.resetVersion !== RAID_RESET_VERSION ||
      cloudProgress.myDamage === 78907 ||
      cloudProgress.bossHp === 0
    );

    if ((resetFlag && String(resetFlag) !== localResetFlag) || isOutdatedCloud) {
      try {
        localStorage.removeItem(getTodayKey());
        localStorage.removeItem(getRankingKey());
        localStorage.removeItem(getFaintKey());
        localStorage.removeItem(getLogsKey());
        localStorage.removeItem(getAttackedKey());
        localStorage.removeItem(`minique_raid_heals_${currentBoss.id}_${todayStr}`);
        localStorage.removeItem(`minique_raid_participation_${todayStr}`);
        if (resetFlag) localStorage.setItem('minique_raid_last_reset_flag', String(resetFlag));
      } catch (e) {}

      const freshRanking = [
        { id: 'npc_1', name: 'ベテラン広場民 🛡️', damage: 8500, isMe: false },
        { id: 'npc_2', name: '深夜の調査兵 🔦', damage: 5200, isMe: false },
        { id: 'npc_3', name: 'らびたん親衛隊 🐰', damage: 3400, isMe: false },
        { id: 'npc_4', name: '週末パトロール隊長 🚓', damage: 1800, isMe: false },
        { id: 'me', name: hn || 'あなた', damage: 0, isMe: true }
      ];

      setBossHp(currentBoss.maxHp);
      setRankingList(freshRanking);
      setHealsLeft(3);
      setHasClaimedParticipation(false);
      setRaidLogs([
        `⚔️ 【${currentBoss.title}】 ${currentBoss.name} が広場に出現中！`,
        `📡 10秒更新のリアルタイム通信で広場のみんなと共闘中！`
      ]);

      if (isOutdatedCloud && supabase) {
        supabase.auth.updateUser({
          data: {
            raid_progress_v1: null,
            raid_participation_claimed_date: null
          }
        }).catch(console.warn);
      }
      return;
    }

    const hasLocallyAttacked = (() => {
      try { return localStorage.getItem(getAttackedKey()) === 'true'; } catch (e) { return false; }
    })();

    if (
      cloudProgress &&
      cloudProgress.resetVersion === RAID_RESET_VERSION &&
      cloudProgress.date === todayStr &&
      cloudProgress.bossId === currentBoss.id
    ) {
      let shouldUpdateCloud = false;
      const currentMyDmg = hasLocallyAttacked ? (rankingList.find(r => r.isMe)?.damage || 0) : 0;
      const cloudMyDmg = typeof cloudProgress.myDamage === 'number' ? cloudProgress.myDamage : 0;
      const bestMyDmg = Math.max(currentMyDmg, cloudMyDmg);
      if (currentMyDmg > cloudMyDmg) shouldUpdateCloud = true;

      const currentHp = hasLocallyAttacked ? bossHp : currentBoss.maxHp;
      const cloudHp = typeof cloudProgress.bossHp === 'number' ? cloudProgress.bossHp : currentBoss.maxHp;
      const bestHp = Math.min(currentHp, cloudHp);
      if (currentHp < cloudHp) shouldUpdateCloud = true;

      const cloudHeals = typeof cloudProgress.healsLeft === 'number' ? cloudProgress.healsLeft : 3;
      const bestHeals = hasLocallyAttacked ? Math.min(healsLeft, cloudHeals) : cloudHeals;
      if (hasLocallyAttacked && healsLeft < cloudHeals) shouldUpdateCloud = true;

      setBossHp(bestHp);
      try {
        if (bestMyDmg > 0) localStorage.setItem(getAttackedKey(), 'true');
        localStorage.setItem(getTodayKey(), String(bestHp));
      } catch (e) {}

      const cleanedRanking = rankingList.filter(r => r.isMe || r.name !== (hn || 'あなた'));
      const updatedRanking = cleanedRanking.map(r => r.isMe ? { ...r, damage: bestMyDmg, name: hn || 'あなた' } : r).sort((a, b) => b.damage - a.damage);
      setRankingList(updatedRanking);
      try { localStorage.setItem(getRankingKey(), JSON.stringify(updatedRanking)); } catch (e) {}

      setHealsLeft(bestHeals);
      try { localStorage.setItem(`minique_raid_heals_${currentBoss.id}_${todayStr}`, String(bestHeals)); } catch (e) {}

      if (shouldUpdateCloud && supabase) {
        supabase.auth.updateUser({
          data: {
            raid_progress_v1: {
              resetVersion: RAID_RESET_VERSION,
              date: todayStr,
              bossId: currentBoss.id,
              myDamage: bestMyDmg,
              bossHp: bestHp,
              healsLeft: bestHeals,
              rankingList: updatedRanking
            }
          }
        }).catch(console.warn);
      }
    } else {
      // 端末ローカルで実際に自分が攻撃済みで、クラウドがまだ空の場合のみバックアップ！
      const currentMyDmg = hasLocallyAttacked ? (rankingList.find(r => r.isMe)?.damage || 0) : 0;
      if (hasLocallyAttacked && currentMyDmg > 0) {
        if (supabase) {
          supabase.auth.updateUser({
            data: {
              raid_progress_v1: {
                resetVersion: RAID_RESET_VERSION,
                date: todayStr,
                bossId: currentBoss.id,
                myDamage: currentMyDmg,
                bossHp: bossHp,
                healsLeft: healsLeft,
                rankingList: rankingList
              }
            }
          }).catch(console.warn);
        }
      }
    }
  }, [user, currentBoss.id]);

  // 🎁 レイド参加賞（1回攻撃で毎日ガチャチケ3枚＆800EXP）の受取管理（クラウド同期）
  const getParticipationClaimed = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    if (user?.user_metadata?.raid_participation_claimed_date === todayStr) {
      try { localStorage.setItem(`minique_raid_participation_${todayStr}`, 'true'); } catch (e) {}
      return true;
    }
    try {
      return localStorage.getItem(`minique_raid_participation_${todayStr}`) === 'true';
    } catch (e) {
      return false;
    }
  };

  const [hasClaimedParticipation, setHasClaimedParticipation] = useState(() => getParticipationClaimed());

  useEffect(() => {
    setHasClaimedParticipation(getParticipationClaimed());
  }, [user]);

  const handleClaimParticipation = () => {
    if (hasClaimedParticipation || myDamage <= 0) return;
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    try {
      localStorage.setItem(`minique_raid_participation_${todayStr}`, 'true');
    } catch (e) {}
    setHasClaimedParticipation(true);

    if (user && supabase) {
      supabase.auth.updateUser({
        data: {
          raid_participation_claimed_date: todayStr
        }
      }).catch(err => console.warn('Cloud sync error for raid participation:', err));
    }

    const PARTICIPATION_TICKETS = 3;
    const PARTICIPATION_EXP = 200;

    if (addTickets) addTickets(PARTICIPATION_TICKETS);
    if (addExp) addExp(PARTICIPATION_EXP);

    setRaidLogs(prev => [
      `🎁 【参加賞受取！】 レイドボス参戦報酬として ガチャチケ 3枚 ＆ ${PARTICIPATION_EXP} EXP を獲得した！✨`,
      ...prev
    ].slice(0, 15));
  };

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
        // 🔑 同一ログインユーザーID（別端末）からの送信のみ「自分自身(isMe)」としてマージする！
        // （「匿名広場民」や「あなた」などの名前一致でマージすると、他人の攻撃が自分のダメージに混入してしまうのを防ぐ）
        const isFromMe = Boolean(user?.id && payload.senderUserId && payload.senderUserId === user.id);

        let baseList = [...prevList];

        if (isFromMe) {
          baseList = baseList.map(item => {
            if (item.isMe) {
              const newDmg = Math.max(item.damage, payload.totalDamage || (item.damage + allyDmg));
              return { ...item, damage: newDmg };
            }
            return item;
          });
        } else {
          // 他のプレイヤーからの送信
          let found = false;
          baseList = baseList.map(item => {
            if (item.name === allyName && !item.isMe) {
              found = true;
              return { ...item, damage: item.damage + allyDmg };
            }
            return item;
          });

          if (!found) {
            baseList.push({
              id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: allyName,
              damage: payload.totalDamage || allyDmg,
              isMe: false
            });
          }
        }

        baseList.sort((a, b) => b.damage - a.damage);
        try { localStorage.setItem(getRankingKey(), JSON.stringify(baseList)); } catch (e) {}
        return baseList;
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
                senderUserId: user?.id || null,
                senderName: hn || '匿名広場民',
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
  }, [currentBoss.id, hn, myDamage, user?.id]);

  // 🧪 回復薬を使う（HP回復 または 気絶からの即座復帰）
  const handleHeal = () => {
    if (healsLeft <= 0 || bossHp <= 0) return;

    const nextHeals = healsLeft - 1;
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    try {
      localStorage.setItem(`minique_raid_heals_${currentBoss.id}_${todayStr}`, String(nextHeals));
    } catch (e) {}

    const saveHealCloud = (newH) => {
      if (user && supabase) {
        supabase.auth.updateUser({
          data: {
            raid_progress_v1: {
              resetVersion: RAID_RESET_VERSION,
              date: todayStr,
              bossId: currentBoss.id,
              myDamage: myDamage,
              bossHp: bossHp,
              healsLeft: newH,
              rankingList: rankingList
            }
          }
        }).catch(console.warn);
      }
    };

    if (faintSeconds > 0) {
      try { localStorage.removeItem(getFaintKey()); } catch (e) {}
      setFaintSeconds(0);
      setPlayerHp(pMaxHp);
      setHealsLeft(nextHeals);
      saveHealCloud(nextHeals);
      setRaidLogs(logs => [
        `🧪 秘伝の回復薬をグイッと飲んで気絶から即座に復活した！！ (残り${nextHeals}回)`,
        ...logs
      ].slice(0, 20));
      return;
    }

    if (playerHp >= pMaxHp) return;

    const healAmt = Math.round(pMaxHp * 0.5);
    const newHp = Math.min(pMaxHp, playerHp + healAmt);
    setPlayerHp(newHp);
    setHealsLeft(nextHeals);
    saveHealCloud(nextHeals);
    setRaidLogs(logs => [
      `🧪 回復薬を使用した！ HPが ${healAmt} 回復した！ (残り${nextHeals}回)`,
      ...logs
    ].slice(0, 20));
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
    try {
      localStorage.setItem(getAttackedKey(), 'true');
      localStorage.setItem(getRankingKey(), JSON.stringify(updatedRanking));
    } catch (e) {}

    // ☁️ クラウド（Supabase user_metadata）へ即時バックアップ（PC/スマホ双方向反映）
    if (user && supabase) {
      const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
      const currentMyDmg = updatedRanking.find(r => r.isMe)?.damage || 0;
      supabase.auth.updateUser({
        data: {
          raid_progress_v1: {
            resetVersion: RAID_RESET_VERSION,
            date: todayStr,
            bossId: currentBoss.id,
            myDamage: currentMyDmg,
            bossHp: nextHp,
            healsLeft: healsLeft,
            rankingList: updatedRanking,
            raidLogs: [logMsg, ...raidLogs].slice(0, 15)
          }
        }
      }).catch(err => console.warn('Raid cloud sync error:', err));
    }

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
            ].slice(0, 20));
          } else {
            setRaidLogs(prev => [
              `💥 『${currentBoss.name}』の『${randomSkill}』！ あなたは ${mitigatedDmg} のダメージを受けた！`,
              logMsg,
              ...prev
            ].slice(0, 20));
          }
          return nextPlayerHp;
        });
      }, 400);
    } else {
      const victoryMsg = `🎉🎉 【討伐成功！！】 広場のみんなで 『${currentBoss.name}』 を打ち倒した！！ 🎉🎉`;
      setRaidLogs(prev => [victoryMsg, logMsg, ...prev].slice(0, 20));
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

      {/* 📢 【レイド専用】リアルタイム実況ログ（最新15件をしっかり永続保存＆スクロール可能） */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.55)',
        borderRadius: '8px',
        padding: '8px 10px',
        marginBottom: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'left'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontSize: '0.68rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '3px' }}>
          <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>📢 レイド戦闘ログ</span>
          <span>直近 {Math.min(raidLogs.length, 15)} 件</span>
        </div>
        <div style={{
          maxHeight: '135px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}>
          {raidLogs.slice(0, 15).map((log, idx) => {
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
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '5px'
                }}
              >
                {isLatest && (
                  <span style={{
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    color: '#ffffff',
                    fontSize: '0.58rem',
                    fontWeight: '900',
                    padding: '0px 4px',
                    borderRadius: '3px',
                    letterSpacing: '0.3px',
                    marginRight: '2px',
                    flexShrink: 0,
                    lineHeight: 1.3,
                    boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)'
                  }}>
                    New!
                  </span>
                )}
                <span>{log}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎁 本日のレイド参加賞バナー */}
      <div style={{
        marginBottom: '8px',
        padding: '8px 10px',
        borderRadius: '8px',
        background: hasClaimedParticipation
          ? 'rgba(34, 197, 94, 0.12)'
          : myDamage > 0
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.18) 100%)'
            : 'rgba(255, 255, 255, 0.04)',
        border: hasClaimedParticipation
          ? '1px solid rgba(34, 197, 94, 0.3)'
          : myDamage > 0
            ? '1px solid rgba(245, 158, 11, 0.45)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        <div style={{ textAlign: 'left', minWidth: 0 }}>
          <div style={{
            fontSize: '0.74rem',
            fontWeight: 'bold',
            color: hasClaimedParticipation ? '#86efac' : myDamage > 0 ? '#fde047' : '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{hasClaimedParticipation ? '✅' : '🎁'}</span>
            <span>本日の参戦ボーナス (参加賞)</span>
          </div>
          <div style={{ fontSize: '0.67rem', color: '#cbd5e1', marginTop: '2px' }}>
            {hasClaimedParticipation
              ? '本日受取済み (討伐成功時はさらに12枚！)'
              : myDamage > 0
                ? '🎫 チケット3枚 ＋ ⭐ 200 EXP が届いています！'
                : '1回攻撃すると、🎫 チケット3枚＋⭐ 200 EXP 獲得！'}
          </div>
        </div>

        {hasClaimedParticipation ? (
          <span style={{
            fontSize: '0.7rem',
            color: '#86efac',
            fontWeight: 'bold',
            background: 'rgba(34, 197, 94, 0.2)',
            padding: '3px 8px',
            borderRadius: '6px',
            flexShrink: 0
          }}>
            受取済
          </span>
        ) : (
          <button
            onClick={handleClaimParticipation}
            disabled={myDamage <= 0}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: myDamage > 0
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : '#475569',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.74rem',
              cursor: myDamage > 0 ? 'pointer' : 'not-allowed',
              boxShadow: myDamage > 0 ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            {myDamage > 0 ? '🎁 受け取る' : '未参戦'}
          </button>
        )}
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
