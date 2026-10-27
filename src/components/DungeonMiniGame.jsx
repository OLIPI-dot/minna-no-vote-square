import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { ENEMIES, scaleEnemy, rollEnemy } from '../enemies';
import DUNGEON_ENEMIES from '../data/dungeon_enemies.json';
import { ITEMS, getRarityColor, getRarityTextStyle, getRarityBadgeStyle, RARITY_CONFIG } from '../items';

const RANDOM_EFFECT_MSGS = {
  regen: [
    "{item}の力で謎のエネルギーが湧き上がってきた！",
    "{item}のおかげでマイナスイオン的な何かが傷を癒やしていく！"
  ],
  virus: [
    "敵は{item}の強烈な成分に当てられて苦しんでいる！",
    "{item}から放たれた謎のウイルスが敵の精神と肉体を蝕む！"
  ],
  lifesteal: [
    "{item}が敵の生命力を吸い取った！",
    "えげつない吸血攻撃！{item}が敵のHPを吸収した！"
  ],
  double_attack: [
    "{item}の軽快な動きで、怒涛の連続攻撃が発生！",
    "限界を超えたF5連打！{item}での連撃が炸裂した！"
  ],
  mental_damage: [
    "{item}のヤバすぎるオーラに、敵のメンタルが削られた！",
    "敵は{item}を見て深いトラウマを思い出し、行動不能になった！"
  ],
  cringe: [
    "{item}のあまりの痛さに、敵はドン引きして動けなくなった...",
    "敵は{item}を見て「関わっちゃダメな奴だ」と察して固まっている！"
  ],
  reflect: [
    "{item}の謎の力で、敵の攻撃を見事に跳ね返した！",
    "痛烈なカウンター！{item}がダメージを倍返しにした！"
  ],
  burn: [
    "{item}の力で大炎上が発生！！相手は火だるまだ！",
    "{item}による激しいレスバ！相手のメンタルが燃え盛る！"
  ],
  kusorep: [
    "{item}の強烈なクソリプが敵の攻撃軌道を狂わせた！",
    "あまりに的外れな{item}のせいで、敵の攻撃の威力が霧散した！"
  ],
  lock_account: [
    "{item}の強固な非公開設定により、攻撃の大部分をシャットアウトした！",
    "フォロワー限定公開の結界が発動！{item}がダメージを大幅に遮断した！"
  ],
  privilege: [
    "{item}の圧倒的権力により、あらゆる危害が免除された！",
    "上級国民のバリア！{item}の特権が攻撃を無力化した！"
  ],
  mom_block: [
    "「ご飯よー！」{item}のせいで家庭の空気が流れ、敵は恥ずかしさで戦意喪失した！"
  ],
  hires: [
    "{item}の超ハイレゾ音質により、敵の攻撃の風切り音を完全察知して回避した！"
  ],
  buyout: [
    "{item}の潤沢な資金力により、敵を買収することに成功した！"
  ],
  money_slap: [
    "{item}で相手の顔面を思い切りビンタした！",
    "{item}の圧倒的な財力で敵を殴りつけた！",
    "「これで黙りな！」{item}による札束の暴力が炸裂！"
  ],
  partner_cheer: [
    "{item}が熱烈に応援している！ (会心率+20%)",
    "{item}の熱いエールが背中を押す！ (会心率+20%)",
    "{item}が全力で声援を送っている！ (会心率+20%)"
  ],
  partner_heal: [
    "{item}が優しく癒やしてくれた！",
    "{item}の看病で元気が湧いてきた！"
  ],
  partner_sponsor: [
    "{item}が手厚いサポートをしてくれた！"
  ],
  partner_kusorep: [
    "{item}が絶妙なクソリプで敵の注意を引いた！"
  ],
  partner_stare: [
    "{item}がじっと見守っている..."
  ],
  partner_hack: [
    "{item}が敵の弱点をハッキングした！"
  ],
  partner_expose: [
    "{item}が敵の過去ログを暴露した！"
  ],
  partner_law: [
    "{item}が規約を持ち出して異議を唱えた！"
  ],
  partner_debate: [
    "{item}が圧倒的な正論で敵を論破した！"
  ]
};

const getEffectMsg = (effectType, item) => {
  if (!item) return '';
  if (item.effectMsg) return item.effectMsg;
  const list = RANDOM_EFFECT_MSGS[effectType];
  if (!list) return `【${item.name}】の力が発動した！`;
  return list[Math.floor(Math.random() * list.length)].replace('{item}', `【${item.name}】`);
};

const DungeonMiniGame = ({
  userLevel = 1,
  userExp = 0,
  levelInfo,
  addExp,
  equipment,
  setEquipment,
  addTickets,
  gachaTickets,
  inventory,
  setInventory,
  encounteredEnemies = [],
  setEncounteredEnemies,
  user,
  hn = ''
}) => {
  // 📢 UR以上のドロップを広場のタイムラインで公表する
  const announceRareDrop = async (item, fromName) => {
    if (!item || (item.rarity !== 'UR' && item.rarity !== 'LR')) return;
    const rawName = (hn || '').split('◆')[0].trim();
    const playerName = rawName && rawName !== '匿名広場民' ? rawName : '名無しの広場民';
    const { error } = await supabase.from('timeline_posts').insert([{
      name: '🎰 ドロップ速報',
      avatar: item.rarity === 'LR' ? '🌈' : '✨',
      content: `【ドロップ速報】${playerName}さんが 地下の${fromName ? `【${fromName}】` : '宝箱'}から [${item.rarity}] ${item.name} を手に入れました！🎉`
    }]);
    if (error) console.error('Drop announce error:', error);
  };
  // ダンジョン全体の状態: 'lobby' | 'exploring' | 'battling' | 'escaped' | 'lost'
  const [dungeonState, setDungeonState] = useState('lobby');
  const [floor, setFloor] = useState(1);
  const [hasStairs, setHasStairs] = useState(false); // 階段を発見したか
  const [floorSearches, setFloorSearches] = useState(0); // その階での探索回数

  // 戦闘関連ステート
  const [enemy, setEnemy] = useState(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [dungeonLog, setDungeonLog] = useState([]); // 探索全体のログ
  const [collectedExp, setCollectedExp] = useState(0);
  const [collectedTickets, setCollectedTickets] = useState(0);
  const [collectedItems, setCollectedItems] = useState([]);
  const [defeatedMonsters, setDefeatedMonsters] = useState([]); // その探索で倒した敵の記録
  const [healCount, setHealCount] = useState(0);

  // 最高到達階層（クラウド ＆ localStorage同期）
  const [bestFloor, setBestFloor] = useState(() => {
    const cloudBest = user?.user_metadata?.dungeon_best_floor;
    if (typeof cloudBest === 'number' && cloudBest > 1) {
      return cloudBest;
    }
    try {
      return parseInt(localStorage.getItem('minique_dungeon_best') || '1', 10);
    } catch {
      return 1;
    }
  });

  // プレイヤー基本ステータス（StatusModal / Patrolと完全同一）
  const equipSlots = ['weapon', 'armor', 'accessory', 'partner'];
  const baseHp = (userLevel * 10) + 100;
  const equipHp = equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.hp || 0), 0);
  const pMaxHp = baseHp + equipHp;
  const pAtk = (userLevel * 5) + 10 + equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.atk || 0), 0);
  const pDef = (userLevel * 2) + equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.def || 0), 0);

  const updateBestFloor = (newFloor) => {
    if (newFloor > bestFloor) {
      setBestFloor(newFloor);
      try {
        localStorage.setItem('minique_dungeon_best', String(newFloor));
      } catch (e) {
        console.error(e);
      }
      if (user && supabase) {
        supabase.auth.updateUser({
          data: { dungeon_best_floor: newFloor }
        }).catch(console.error);
      }
    }
  };

  // 🗝️ 地下パトロール挑戦回数管理（1日基本5回、クラウド同期）
  const getTodayStr = () => new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const BASE_DAILY_ATTEMPTS = 5;
  const MAX_DUNGEON_KEYS = 10;

  const getDungeonKeys = () => {
    let localKeys = 0;
    try {
      const val = localStorage.getItem('minique_dungeon_keys');
      if (val !== null) localKeys = parseInt(val, 10) || 0;
    } catch (e) {}

    let cloudKeys = null;
    if (typeof user?.user_metadata?.dungeon_keys === 'number') {
      cloudKeys = user.user_metadata.dungeon_keys;
    }
    const effective = cloudKeys !== null ? Math.max(localKeys, cloudKeys) : localKeys;
    return Math.min(MAX_DUNGEON_KEYS, Math.max(0, effective));
  };

  const [dungeonKeys, setDungeonKeys] = useState(() => getDungeonKeys());

  const getDungeonAttempts = () => {
    const todayStr = getTodayStr();
    let localRem = BASE_DAILY_ATTEMPTS;
    try {
      const data = JSON.parse(localStorage.getItem('daily_dungeon_attempts_v1') || '{}');
      if (data.date === todayStr && typeof data.remaining === 'number') {
        localRem = data.remaining;
      }
    } catch (e) {}

    let cloudRem = null;
    if (user?.user_metadata?.daily_dungeon_date === todayStr) {
      if (typeof user.user_metadata.daily_dungeon_remaining === 'number') {
        cloudRem = user.user_metadata.daily_dungeon_remaining;
      }
    }

    // どちらか一方のみある場合はそれを採用、両方ある場合は消費が進んでいる方（小さい方）を基本採用
    const effectiveRem = cloudRem !== null ? Math.min(localRem, cloudRem) : localRem;
    try {
      localStorage.setItem('daily_dungeon_attempts_v1', JSON.stringify({ date: todayStr, remaining: effectiveRem }));
    } catch(e) {}
    return effectiveRem;
  };

  const [remainingAttempts, setRemainingAttempts] = useState(() => getDungeonAttempts());

  // 📜 本日の探索記録（冒険履歴 - クラウド ＆ ローカル双方向同期）
  const sortDungeonHistoryDesc = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      if (a.time && b.time) return b.time.localeCompare(a.time);
      return 0;
    });
  };

  const getDungeonHistory = () => {
    const todayStr = getTodayStr();
    let localHistory = [];
    try {
      const data = JSON.parse(localStorage.getItem('daily_dungeon_history_v1') || '{}');
      if (data.date === todayStr && Array.isArray(data.history)) {
        localHistory = data.history;
      }
    } catch (e) {
      console.error(e);
    }

    // ☁️ クラウドに保存された履歴があれば優先・統合
    const cloudData = user?.user_metadata?.daily_dungeon_history_v1;
    if (cloudData && cloudData.date === todayStr && Array.isArray(cloudData.history)) {
      const combined = [...cloudData.history];
      localHistory.forEach(p => {
        if (!combined.some(c => c.time === p.time && c.floor === p.floor)) {
          combined.push(p);
        }
      });
      // 🌟 必ず新しい時間順（降順）にソートして最新5件を抽出！
      const sorted = sortDungeonHistoryDesc(combined).slice(0, 5);
      try {
        localStorage.setItem('daily_dungeon_history_v1', JSON.stringify({
          date: todayStr,
          history: sorted
        }));
      } catch (e) {}
      return sorted;
    }

    return sortDungeonHistoryDesc(localHistory).slice(0, 5);
  };

  const [dungeonHistory, setDungeonHistory] = useState(() => getDungeonHistory());

  const addDungeonHistoryRecord = (record) => {
    const todayStr = getTodayStr();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newRecord = { ...record, time: timeStr, timestamp: Date.now() };

    setDungeonHistory(prev => {
      const updated = sortDungeonHistoryDesc([newRecord, ...prev]).slice(0, 5);
      const payload = {
        date: todayStr,
        history: updated
      };
      try {
        localStorage.setItem('daily_dungeon_history_v1', JSON.stringify(payload));
      } catch (e) {
        console.error(e);
      }

      // ☁️ クラウド（Supabase user_metadata）へ即時バックアップ！
      if (user && supabase) {
        supabase.auth.updateUser({
          data: {
            daily_dungeon_history_v1: payload
          }
        }).catch(err => console.warn('Cloud sync error for dungeon history:', err));
      }

      return updated;
    });
  };

  // ロビーに戻った時やユーザー情報更新時に最新の残り回数・所持鍵・履歴を同期
  useEffect(() => {
    if (dungeonState === 'lobby') {
      setRemainingAttempts(getDungeonAttempts());
      setDungeonKeys(getDungeonKeys());
      setDungeonHistory(getDungeonHistory());
      if (user?.user_metadata?.dungeon_best_floor) {
        setBestFloor(prev => Math.max(prev, user.user_metadata.dungeon_best_floor));
      }
    }
  }, [dungeonState, user]);

  // ローカルに記録があってクラウドにない場合、自動でクラウドへ同期
  useEffect(() => {
    if (!user || !supabase) return;
    const todayStr = getTodayStr();
    const cloudData = user.user_metadata?.daily_dungeon_history_v1;
    try {
      const saved = localStorage.getItem('daily_dungeon_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr && Array.isArray(parsed.history) && parsed.history.length > 0) {
          if (!cloudData || cloudData.date !== todayStr || (cloudData.history?.length || 0) < parsed.history.length) {
            supabase.auth.updateUser({
              data: {
                daily_dungeon_history_v1: parsed
              }
            }).catch(console.warn);
          }
        }
      }
    } catch (e) {}
  }, [user]);

  // 🗝️ ストック地下の鍵の消費・保存
  const saveDungeonKeys = (newKeys) => {
    const clamped = Math.min(MAX_DUNGEON_KEYS, Math.max(0, newKeys));
    setDungeonKeys(clamped);
    try {
      localStorage.setItem('minique_dungeon_keys', String(clamped));
    } catch (e) {
      console.error(e);
    }
    if (user) {
      if (user.user_metadata) user.user_metadata.dungeon_keys = clamped;
      if (supabase) {
        supabase.auth.updateUser({
          data: { dungeon_keys: clamped }
        }).catch(console.error);
      }
    }
  };

  const saveRemainingAttempts = (newRemaining) => {
    const todayStr = getTodayStr();
    setRemainingAttempts(newRemaining);
    try {
      localStorage.setItem('daily_dungeon_attempts_v1', JSON.stringify({
        date: todayStr,
        remaining: newRemaining
      }));
    } catch (e) {
      console.error(e);
    }
    // ☁️ クラウドに即時同期
    if (user) {
      if (user.user_metadata) {
        user.user_metadata.daily_dungeon_date = todayStr;
        user.user_metadata.daily_dungeon_remaining = newRemaining;
      }
      if (supabase) {
        supabase.auth.updateUser({
          data: {
            daily_dungeon_date: todayStr,
            daily_dungeon_remaining: newRemaining
          }
        }).catch(console.error);
      }
    }
  };

  // 階層に応じた敵の抽選（10階ごと専用ネームド大ボス、通常階は限定敵＋通常プール）
  const generateDungeonEnemy = (currentFloor, forceBoss = false) => {
    const isBossFloor = currentFloor % 10 === 0;
    const isMidBossFloor = currentFloor % 5 === 0 && !isBossFloor;
    const effectiveLevel = Math.max(1, userLevel + Math.floor((currentFloor - 1) * 1.2));
    
    // 👑 10階ごとの専用ネームドボス判定
    if (forceBoss || isBossFloor) {
      const bossFloorTier = Math.min(50, Math.floor(currentFloor / 10) * 10);
      const namedBossId = `boss_${bossFloorTier}`;
      const namedBoss = DUNGEON_ENEMIES.find(e => e.id === namedBossId) || DUNGEON_ENEMIES[0];
      const scaledBoss = scaleEnemy(namedBoss, effectiveLevel);

      // 深層補正
      if (currentFloor > 50) {
        const loopBonus = 1 + (currentFloor - 50) * 0.04;
        scaledBoss.hp = Math.round(scaledBoss.hp * loopBonus);
        scaledBoss.atk = Math.round(scaledBoss.atk * (1 + (currentFloor - 50) * 0.025));
      }
      return scaledBoss;
    }

    // 中ボスフロア（B5F, B15F, B25F...）
    if (isMidBossFloor) {
      const elitePool = [
        ...DUNGEON_ENEMIES.filter(e => e.type === 'dungeon_elite'),
        ...ENEMIES.filter(e => e.type === 'elite' && e.id !== 'el4' && e.id !== 'el4_2')
      ];
      const selected = elitePool[Math.floor(Math.random() * elitePool.length)];
      return scaleEnemy(selected, effectiveLevel);
    }

    // 🐰 地下らびたん六大進化枠（約7%の遭遇率で階層に応じた姿で出現！）
    if (Math.random() < 0.07) {
      let rabbitId = 'd_lost_rabbit';
      if (currentFloor >= 50) rabbitId = 'd_myth_rabbit'; // 伝説の地底兎
      else if (currentFloor >= 40) rabbitId = 'd_dark_rabbit'; // 悪に堕ちたらびたん
      else if (currentFloor >= 30) rabbitId = 'd_living_rabbit'; // 地下定住らびたん
      else if (currentFloor >= 20) rabbitId = 'd_muscle_rabbit'; // ムキムキらびたん
      else if (currentFloor >= 10) rabbitId = 'd_gem_rabbit'; // 宝石らびたん
      else rabbitId = 'd_lost_rabbit'; // 迷子らびたん

      const rabbit = DUNGEON_ENEMIES.find(e => e.id === rabbitId);
      if (rabbit) return scaleEnemy(rabbit, effectiveLevel);
    }

    // 通常フロア: 35%でダンジョン限定敵、65%で通常敵
    if (Math.random() < 0.35) {
      const dungeonExclusives = DUNGEON_ENEMIES.filter(e => e.type === 'dungeon_normal' || e.type === 'dungeon_elite');
      const selected = dungeonExclusives[Math.floor(Math.random() * dungeonExclusives.length)];
      return scaleEnemy(selected, effectiveLevel);
    }

    // 通常敵プール
    const rand = Math.random();
    let pool = [];
    if (rand < 0.20) {
      pool = ENEMIES.filter(e => e.type === 'elite' && e.id !== 'el4' && e.id !== 'el4_2');
    } else {
      pool = ENEMIES.filter(e => e.type === 'normal');
    }
    if (pool.length === 0) pool = ENEMIES;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    return scaleEnemy(selected, effectiveLevel);
  };

  // ダンジョン入場（B1Fからスタート）
  const enterDungeon = () => {
    if (remainingAttempts > 0) {
      saveRemainingAttempts(remainingAttempts - 1);
    } else if (dungeonKeys > 0) {
      saveDungeonKeys(dungeonKeys - 1);
    } else {
      return;
    }
    setFloor(1);
    setCollectedExp(0);
    setCollectedTickets(0);
    setCollectedItems([]);
    setDefeatedMonsters([]);
    setPlayerHp(pMaxHp);
    setHealCount(0);
    initFloor(1, pMaxHp);
  };

  // フロア初期化
  const initFloor = (targetFloor, currentHp) => {
    setFloor(targetFloor);
    setPlayerHp(currentHp);
    setFloorSearches(0);
    updateBestFloor(targetFloor);

    const isBossFloor = targetFloor % 10 === 0;

    if (isBossFloor) {
      // 10階ごとの大ボスフロア: 即座にボスと遭遇！
      const bossEnemy = generateDungeonEnemy(targetFloor, true);
      setEnemy(bossEnemy);
      setEnemyHp(bossEnemy.hp);
      setHasStairs(false); // ボスを倒すと階段が出現

      if (setEncounteredEnemies && !encounteredEnemies.includes(bossEnemy.id)) {
        setEncounteredEnemies(prev => [...prev, bossEnemy.id]);
      }

      setBattleLog([
        `🚨🚨 【警告: B${targetFloor}F 最深部】 🚨🚨`,
        `禍々しい気配が部屋を満たす...！`,
        `👑 【${bossEnemy.name} (Lv.${bossEnemy.level})】 が待ち構えている！！`
      ]);
      setDungeonLog(prev => [`🚨 B${targetFloor}F: 階層の主 【${bossEnemy.name}】 と交戦開始！`, ...prev]);
      setDungeonState('battling');
    } else {
      // 通常階: トルネコ風探索モードへ
      setHasStairs(false);
      setEnemy(null);
      setDungeonLog([`🏰 B${targetFloor}F に到達した。部屋を探索して下り階段を探そう！`]);
      setDungeonState('exploring');
    }
  };

  const MAX_FLOOR_SEARCHES = 4; // 1フロア最大4回まで探索可能（乱獲防止）

  // 🔍 部屋を探索する（ランダムイベント）
  const handleSearchRoom = () => {
    if (dungeonState !== 'exploring' || floorSearches >= MAX_FLOOR_SEARCHES) return;

    const newSearchCount = floorSearches + 1;
    setFloorSearches(newSearchCount);

    // 4回目（最終探索）でも階段が見つかっていない場合は確定で階段を発見する安心セーフティ！
    if (!hasStairs && newSearchCount >= MAX_FLOOR_SEARCHES) {
      setHasStairs(true);
      setDungeonLog(prev => [
        `🪜 【下り階段を発見！】 部屋の最深部に下層へ続く階段を見つけた！このフロアの探索は完了だ！`,
        ...prev
      ]);
      return;
    }

    // 探索回数が増えるほど階段が見つかりやすくなる補正
    const stairsBonus = newSearchCount * 0.20;
    const rand = Math.random();

    // 1. 階段発見判定（まだ見つかっていない場合）
    if (!hasStairs && rand < (0.30 + stairsBonus)) {
      setHasStairs(true);
      setDungeonLog(prev => [
        `🪜 【下り階段を発見！】 部屋の隅に下層へ続く階段を見つけた！いつでもB${floor + 1}Fへ降りられるぞ！`,
        ...prev
      ]);
      return;
    }

    // 2. 宝箱発見判定 (25%)
    if (rand < 0.50) {
      // 12%の確率でトルネコ伝統の「ミミック罠」が発動！
      if (Math.random() < 0.12) {
        const mimicRaw = DUNGEON_ENEMIES.find(e => e.id === 'd_mimic') || DUNGEON_ENEMIES[0];
        const effectiveLevel = Math.max(1, userLevel + Math.floor((floor - 1) * 1.2));
        const mimicEnemy = scaleEnemy(mimicRaw, effectiveLevel);
        setEnemy(mimicEnemy);
        setEnemyHp(mimicEnemy.hp);
        if (setEncounteredEnemies && !encounteredEnemies.includes(mimicEnemy.id)) {
          setEncounteredEnemies(prev => [...prev, mimicEnemy.id]);
        }
        setBattleLog([
          `⚠️⚠️ 【ミミック出現！！】 ⚠️⚠️`,
          `宝箱を開けようとしたら、牙を剥いた 【${mimicEnemy.name}】 だった！！`
        ]);
        setDungeonLog(prev => [
          `⚠️ 宝箱は 【${mimicEnemy.name}】 だった！戦闘開始！`,
          ...prev
        ]);
        setDungeonState('battling');
        return;
      }

      // アイテムまたはチケットまたは回復
      const itemRoll = Math.random();
      if (itemRoll < 0.40 && ITEMS.length > 0) {
        // アイテム獲得
        let rarityFilter = ['N', 'R'];
        if (floor >= 15) rarityFilter = ['R', 'SR', 'UR'];
        else if (floor >= 5) rarityFilter = ['N', 'R', 'SR'];

        const pool = ITEMS.filter(i => rarityFilter.includes(i.rarity));
        const dropped = pool[Math.floor(Math.random() * pool.length)] || ITEMS[0];
        setCollectedItems(prev => [...prev, dropped]);
        if (setInventory) setInventory(prev => [...prev, dropped]);
        announceRareDrop(dropped, null);
        setDungeonLog(prev => [
          `🎁 【宝箱発見！】 箱を開けると 【${dropped.name} (${dropped.rarity})】 が入っていた！`,
          ...prev
        ]);
      } else if (itemRoll < 0.75) {
        // ガチャチケ獲得
        setCollectedTickets(prev => prev + 1);
        setDungeonLog(prev => [
          `🎫 【ガチャチケ発見！】 古びた壺の中からガチャチケットを1枚見つけた！`,
          ...prev
        ]);
      } else {
        // 回復薬の補充
        setHealCount(prev => Math.max(0, prev - 1));
        setDungeonLog(prev => [
          `🧪 【回復薬を発見！】 探索中に傷薬を拾った！（回復薬の使用回数+1）`,
          ...prev
        ]);
      }
      return;
    }

    // 3. 癒やしの泉 (15%)
    if (rand < 0.65) {
      const healAmt = Math.floor(pMaxHp * 0.35);
      const newHp = Math.min(pMaxHp, playerHp + healAmt);
      setPlayerHp(newHp);
      setDungeonLog(prev => [
        `⛲ 【癒やしの泉を発見！】 透き通った泉の水を飲んだ。HPが ${healAmt} 回復した！`,
        ...prev
      ]);
      return;
    }

    // 4. 敵と遭遇！ (残り35%) -> バトル開始！
    const newEnemy = generateDungeonEnemy(floor, false);
    setEnemy(newEnemy);
    setEnemyHp(newEnemy.hp);

    if (setEncounteredEnemies && !encounteredEnemies.includes(newEnemy.id)) {
      setEncounteredEnemies(prev => [...prev, newEnemy.id]);
    }

    setBattleLog([
      `⚔️ 【敵出現！】 部屋の奥から 【Lv.${newEnemy.level} ${newEnemy.name}】 が飛び出してきた！`
    ]);
    setDungeonLog(prev => [
      `⚔️ 【Lv.${newEnemy.level} ${newEnemy.name}】 と遭遇！戦闘開始！`,
      ...prev
    ]);
    setDungeonState('battling');
  };

  // ⬇️ 下り階段を降りて次のフロアへ進む
  const handleDescend = () => {
    if (!hasStairs) return;
    const nextFloor = floor + 1;
    // 階層突破ボーナス: HPを少し回復（最大HPの25%）
    const recoveryAmt = Math.floor(pMaxHp * 0.25);
    const recoveredHp = Math.min(pMaxHp, playerHp + recoveryAmt);
    initFloor(nextFloor, recoveredHp);
  };

  // 🚪 地上へ帰還する（戦利品確定）
  const handleEscape = () => {
    // 探索を1回も行わずに即帰還した場合は、挑戦回数を消費しない安心仕様
    const isInstantReturn = floor === 1 && floorSearches === 0 && collectedExp === 0 && collectedItems.length === 0;
    if (isInstantReturn) {
      saveRemainingAttempts(Math.min(BASE_DAILY_ATTEMPTS, remainingAttempts + 1));
      addDungeonHistoryRecord({
        floor: 1,
        result: 'canceled',
        exp: 0,
        tickets: 0,
        items: []
      });
    } else {
      if (collectedExp > 0 && addExp) {
        addExp(collectedExp);
      }
      if (collectedTickets > 0 && addTickets) {
        addTickets(collectedTickets);
      }
      addDungeonHistoryRecord({
        floor,
        level: userLevel,
        result: 'escaped',
        exp: collectedExp,
        tickets: collectedTickets,
        items: collectedItems,
        monsters: defeatedMonsters
      });
    }
    setDungeonState('escaped');
    updateBestFloor(floor);
  };

  // ⚔️ バトル攻撃処理（地上パトロールと同一の全特殊効果を完全対応！）
  const handleAttack = () => {
    if (dungeonState !== 'battling' || !enemy) return;

    let newLogs = [...battleLog];
    let currentEnemyHp = enemyHp;
    let currentPlayerHp = playerHp;

    const getEffectSources = (eff) => {
      const sources = [];
      ['weapon', 'armor', 'accessory', 'partner'].forEach(slot => {
        const item = equipment?.[slot];
        if (item) {
          const matchedItem = ITEMS.find(i => (item.id && i.id === String(item.id).split('_')[0]) || i.name === item.name);
          const itemEff = matchedItem?.effect || item.effect;
          const itemRarity = matchedItem?.rarity || item.rarity || 'N';
          if (itemEff === eff) sources.push({ ...item, rarity: itemRarity });
        }
      });
      return sources;
    };

    const getEffectSource = (eff) => {
      const sources = getEffectSources(eff);
      return sources.length > 0 ? sources[0] : null;
    };

    const getEffectCount = (eff) => getEffectSources(eff).length;
    const getEffectChance = (eff, baseRate, maxCap = 0.50) => Math.min(maxCap, baseRate * getEffectCount(eff));

    // レアリティごとのレート・効果量マップから値を取得
    const getRarityRate = (item, rates, defaultRate = 0.10) => {
      if (!item) return 0;
      return rates[item.rarity] ?? defaultRate;
    };

    // 指定エフェクトを持つ全装備のレート合算（重複加算 & 上限キャップ付き）
    const getEffectRarityTotal = (eff, rates, defaultRate = 0.10, maxCap = 0.60) => {
      const sources = getEffectSources(eff);
      if (sources.length === 0) return 0;
      const total = sources.reduce((sum, item) => sum + getRarityRate(item, rates, defaultRate), 0);
      return Math.min(maxCap, total);
    };

    const getStackLabel = (eff, label) => {
      const count = getEffectCount(eff);
      return count > 1 ? `【${label}×${count}】` : `【${label}】`;
    };

    // 💼 【買収: buyout】ターン開始時10%で即勝利
    const buyoutItem = getEffectSource('buyout');
    if (buyoutItem && Math.random() < getEffectChance('buyout', 0.10, 0.30)) {
      newLogs.push(`💼 ${getStackLabel('buyout', '買収')} ${getEffectMsg('buyout', buyoutItem)}`);
      newLogs.push(`🎉 （買収完了） 【${enemy.name}】 は大金を手にして帰っていった...`);
      setEnemyHp(0);
      setPlayerHp(currentPlayerHp);
      setBattleLog(newLogs);
      handleBattleVictory(newLogs, currentPlayerHp);
      return;
    }

    // ✨ 【自動回復: regen】（N:3%, R:5%, SR:10%, UR:15%）
    const regenItem = getEffectSource('regen');
    if (regenItem) {
      const healPct = getEffectRarityTotal('regen', { N: 0.03, R: 0.05, SR: 0.10, UR: 0.15 }, 0.05, 0.30);
      const healAmount = Math.max(1, Math.floor(pMaxHp * healPct));
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + healAmount);
      newLogs.push(`✨ ${getStackLabel('regen', '回復')} ${getEffectMsg('regen', regenItem)} (HP +${healAmount})`);
    }

    // 🐈 【捨て猫: partner_heal】少量の回復
    const partnerHeal = getEffectSource('partner_heal');
    if (partnerHeal) {
      const healAmount = 20;
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + healAmount);
      newLogs.push(`🐈 【癒やし】 ${getEffectMsg('partner_heal', partnerHeal)} (HP +${healAmount})`);
    }

    // 👳 【石油王: partner_sponsor】ランダムで回復か攻撃
    const sponsorItem = getEffectSource('partner_sponsor');
    if (sponsorItem && Math.random() < 0.25) {
      if (Math.random() < 0.5) {
        const healAmount = Math.floor(pMaxHp * 0.5);
        currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + healAmount);
        newLogs.push(`💴 【資金援助】 ${getEffectMsg('partner_sponsor', sponsorItem)} (HPが大回復した！)`);
      } else {
        const dmg = Math.floor(enemy.hp * 0.25);
        currentEnemyHp = Math.max(0, currentEnemyHp - dmg);
        newLogs.push(`💴 【物理援助】 ${getEffectMsg('partner_sponsor', sponsorItem)} (札束の暴力で ${dmg} のダメージ！)`);
      }
    }

    // 💻 【ハック/特定: partner_hack / partner_expose】 30%で敵の防御力を0にして攻撃
    const hackItem = getEffectSource('partner_hack') || getEffectSource('partner_expose');
    let effectiveEnemyDef = enemy.def;
    if (hackItem && Math.random() < 0.30) {
      effectiveEnemyDef = 0;
      newLogs.push(`💻 【解析】 ${getEffectMsg(getEffectSource('partner_hack') ? 'partner_hack' : 'partner_expose', hackItem)} (敵の防御力が0になった！)`);
    }

    // 💥 【誤爆: gobaku】 予測不能のハプニング（N:5%, R:10%, SR:15%, UR:20%）
    const gobakuItem = getEffectSource('gobaku');
    const gobakuChance = getEffectRarityTotal('gobaku', { N: 0.05, R: 0.10, SR: 0.15, UR: 0.20 }, 0.10, 0.30);
    if (gobakuItem && Math.random() < gobakuChance) {
      const roll = Math.random();
      if (roll < 0.60) {
        const gDmg = Math.max(10, Math.floor(enemy.hp * 0.15));
        currentEnemyHp = Math.max(0, currentEnemyHp - gDmg);
        newLogs.push(`💥 ${getStackLabel('gobaku', '誤爆')} 送る相手を間違えた！ 「これあいつの悪口じゃん…」と敵に ${gDmg} の大ダメージ！`);
        if (currentEnemyHp === 0) {
          handleBattleVictory(newLogs, currentPlayerHp);
          return;
        }
      } else if (roll < 0.85) {
        const selfDmg = Math.max(3, Math.floor(pMaxHp * 0.08));
        currentPlayerHp = Math.max(1, currentPlayerHp - selfDmg);
        newLogs.push(`💥 ${getStackLabel('gobaku', '誤爆')} 全体チャットに誤爆した！ あまりの恥ずかしさで悶絶し ${selfDmg} のダメージ！`);
      } else {
        const gHeal = Math.max(5, Math.floor(pMaxHp * 0.10));
        currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + gHeal);
        newLogs.push(`🎁 ${getStackLabel('gobaku', '誤爆')} ドリンク無料クーポンを誤爆した！ あなたのHPが ${gHeal} 回復した！`);
      }
    }

    // 会心率計算（レアリティ別ボーナス合算・上限キャップ付き）
    const critBonus = getEffectRarityTotal('crit_up', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.50);
    let basePCrit = 0.10 + critBonus;
    const cheerItem = getEffectSource('partner_cheer');
    if (cheerItem) {
      basePCrit += 0.20;
      newLogs.push(`📣 【応援】 ${getEffectMsg('partner_cheer', cheerItem)}`);
    }
    const cursedItem = getEffectSource('cursed_power');
    if (cursedItem) basePCrit = 0.50;

    // 🤞 【領域展開: domain_expansion】 必中＆確定会心の結界（R:8%, SR:15%, UR:25%）
    const domainItem = getEffectSource('domain_expansion');
    const domainChance = getEffectRarityTotal('domain_expansion', { R: 0.08, SR: 0.15, UR: 0.25 }, 0.12, 0.40);
    let isDomainActive = false;
    if (domainItem && Math.random() < domainChance) {
      isDomainActive = true;
      newLogs.push(`🤞 ${getStackLabel('domain_expansion', '領域展開')} 「領域展開――！」 周囲に不可避の結界が構築された！`);
      newLogs.push(`✨ （術式必中効果） あなたの攻撃は必中かつ確定会心の一撃となる！`);
    }

    const isCrit = isDomainActive || (Math.random() < Math.min(0.70, basePCrit));

    // 攻撃計算
    let baseDmg = Math.max(5, pAtk - Math.floor(effectiveEnemyDef * 0.6));
    const variance = 1.0 + (Math.random() * 0.3 - 0.15);
    let dmgToEnemy = Math.floor(baseDmg * variance * (isCrit ? 1.8 : 1.0));

    // 諸刃の剣・残業
    const doubleEdgedItem = getEffectSource('double_edged');
    if (doubleEdgedItem) {
      dmgToEnemy *= 2;
      const recoil = Math.max(1, Math.floor(pMaxHp * 0.15));
      currentPlayerHp = Math.max(0, currentPlayerHp - recoil);
      newLogs.push(`💥 【諸刃の剣】 ダメージ2倍！ しかし反動で自身も ${recoil} のダメージ！`);
    }
    const overworkItem = getEffectSource('overwork');
    if (overworkItem) {
      dmgToEnemy *= 3;
      const recoil = Math.max(1, Math.floor(pMaxHp * 0.25));
      currentPlayerHp = Math.max(0, currentPlayerHp - recoil);
      newLogs.push(`💼 【残業】 限界突破のダメージ3倍！ しかし反動で自身も ${recoil} のダメージ！`);
    }

    // 🌀 【現実改変: rewrite_reality】 15%で敵HP半減
    const rewriteItem = getEffectSource('rewrite_reality');
    if (rewriteItem && Math.random() < 0.15) {
      const halfHpDmg = Math.floor(currentEnemyHp * 0.5);
      dmgToEnemy += halfHpDmg;
      newLogs.push(`🌀 【現実改変】 ${getEffectMsg('rewrite_reality', rewriteItem)} (HPを半分消滅させた！)`);
    }

    // 💴 【札束ビンタ: money_slap】
    const moneySlapItem = getEffectSource('money_slap');
    if (moneySlapItem) {
      const rarityBonus = {
        LR: { min: 100, max: 250 },
        UR: { min: 60, max: 160 },
        SR: { min: 35, max: 95 },
        R:  { min: 20, max: 60 },
        N:  { min: 10, max: 35 }
      }[moneySlapItem.rarity] || { min: 30, max: 100 };
      const extraDmg = Math.floor(Math.random() * (rarityBonus.max - rarityBonus.min + 1)) + rarityBonus.min;
      dmgToEnemy += extraDmg;
      newLogs.push(`💸 【札束ビンタ】 ${getEffectMsg('money_slap', moneySlapItem)} (+${extraDmg} 追加ダメージ！)`);
    }

    // 🥕 【黄金部位撃ち: golden_carrot】 らびたんの特大ゴールドニンジンが当たる部位でダメージ劇的変化！
    const carrotItem = getEffectSource('golden_carrot');
    let isCarrotStun = false;
    if (carrotItem) {
      const roll = Math.random();
      let partName = '';
      let carrotDmg = 0;
      let partLog = '';
      if (roll < 0.15) {
        partName = '足の小指';
        carrotDmg = Math.floor(pAtk * 0.6) + Math.floor(Math.random() * 41) + 60;
        partLog = `🥕 【部位ヒット：${partName}】 【${carrotItem.name}】が敵の足の小指にコツンと当たった！ 地味に悶絶して +${carrotDmg} ダメージ！`;
      } else if (roll < 0.35) {
        partName = '弁慶の泣き所（スネ）';
        carrotDmg = Math.floor(pAtk * 1.0) + Math.floor(Math.random() * 51) + 100;
        partLog = `🥕 【部位ヒット：${partName}】 【${carrotItem.name}】が敵のスネにゴツンと直撃！ 涙目の +${carrotDmg} ダメージ！`;
      } else if (roll < 0.60) {
        partName = 'どてっ腹';
        carrotDmg = Math.floor(pAtk * 1.4) + Math.floor(Math.random() * 71) + 150;
        partLog = `🥕💥 【部位ヒット：${partName}】 【${carrotItem.name}】が敵の横っ腹にめり込んだ！ 重い一撃で +${carrotDmg} 大ダメージ！`;
      } else if (roll < 0.85) {
        partName = '顔面ど真ん中';
        carrotDmg = Math.floor(pAtk * 2.0) + Math.floor(Math.random() * 101) + 220;
        if (Math.random() < 0.35) isCarrotStun = true;
        partLog = `🥕💥 【部位ヒット：${partName}】 純金の【${carrotItem.name}】が敵の顔面にモロ直撃！！ 鼻血ブーの +${carrotDmg} 特大ダメージ！`;
      } else {
        partName = '脳天・急所';
        carrotDmg = Math.floor(pAtk * 3.2) + Math.floor(Math.random() * 181) + 380;
        isCarrotStun = true;
        partLog = `🥕🌟 【部位ヒット：${partName}クリティカル！！】 黄金に輝く【${carrotItem.name}】が敵の脳天ど真ん中に隕石のごとく直撃！！ 魂が抜ける +${carrotDmg} 超絶メガダメージ！！`;
      }
      dmgToEnemy += carrotDmg;
      newLogs.push(partLog);
    }

    if (dmgToEnemy < 1) dmgToEnemy = 1;
    currentEnemyHp = Math.max(0, currentEnemyHp - dmgToEnemy);

    newLogs.push(isCrit 
      ? `💥 会心の一撃！！！ あなたの猛攻で ${dmgToEnemy} の大ダメージ！` 
      : `⚔️ あなたの攻撃！ 敵に ${dmgToEnemy} のダメージ！`);

    // 🚫 【BAN / ブロック: ban / block】（N:1%, R:2%, SR:5%, UR:8% 最大15%）
    const banItem = getEffectSource('ban') || getEffectSource('block');
    const banChance = getEffectRarityTotal('ban', { N: 0.01, R: 0.02, SR: 0.05, UR: 0.08 }, 0.02, 0.15)
      + getEffectRarityTotal('block', { N: 0.01, R: 0.02, SR: 0.05, UR: 0.08 }, 0.02, 0.15);
    if (currentEnemyHp > 0 && banItem && Math.random() < Math.min(0.20, banChance)) {
      currentEnemyHp = 0;
      newLogs.push(`🚫 【BAN】 ${getEffectMsg(getEffectSource('ban') ? 'ban' : 'block', banItem)} (敵のアカウントを完全凍結した！)`);
    }

    // 🩸 【吸血: lifesteal】（N:10%/15%, R:15%/25%, SR:25%/40%, UR:35%/50%）
    const lifestealItem = getEffectSource('lifesteal');
    const lifestealChance = getEffectRarityTotal('lifesteal', { N: 0.10, R: 0.15, SR: 0.25, UR: 0.35 }, 0.15, 0.60);
    if (currentEnemyHp > 0 && lifestealItem && Math.random() < lifestealChance) {
      const drainRate = getEffectRarityTotal('lifesteal', { N: 0.15, R: 0.25, SR: 0.40, UR: 0.50 }, 0.25, 0.60);
      const drain = Math.max(1, Math.floor(dmgToEnemy * drainRate));
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + drain);
      newLogs.push(`🩸 ${getStackLabel('lifesteal', '吸収')} HPを ${drain} 吸収した！`);
    }

    // ⚔️ 【連撃: double_attack】（N:10%/40%, R:15%/60%, SR:30%/80%, UR:40%/100%）
    const doubleItem = getEffectSource('double_attack');
    const doubleChance = getEffectRarityTotal('double_attack', { N: 0.10, R: 0.15, SR: 0.30, UR: 0.40 }, 0.15, 0.60);
    if (currentEnemyHp > 0 && doubleItem && Math.random() < doubleChance) {
      const doubleDmgRate = getEffectRarityTotal('double_attack', { N: 0.40, R: 0.60, SR: 0.80, UR: 1.00 }, 0.60, 1.00);
      const secondDmg = Math.max(1, Math.floor(dmgToEnemy * doubleDmgRate));
      currentEnemyHp = Math.max(0, currentEnemyHp - secondDmg);
      newLogs.push(`⚔️ ${getStackLabel('double_attack', '連撃')} 追撃で ${secondDmg} のダメージ！`);
    }

    // 💥 【拡散爆発: viral_hit】
    const viralItem = getEffectSource('viral_hit');
    if (currentEnemyHp > 0 && viralItem && Math.random() < 0.20) {
      const burstDmg = Math.max(1, Math.floor(dmgToEnemy * 0.5));
      currentEnemyHp = Math.max(0, currentEnemyHp - burstDmg);
      newLogs.push(`🚀 【拡散爆発】 ${getEffectMsg('viral_hit', viralItem)} (+${burstDmg} ダメージ！)`);
    }

    // 敵撃破チェック
    if (currentEnemyHp === 0) {
      handleBattleVictory(newLogs, currentPlayerHp);
      return;
    }

    // スタン判定 (golden_carrot / mental_damage / cringe)
    let isEnemyStunned = false;
    if (isCarrotStun) {
      isEnemyStunned = true;
      newLogs.push(`💫 【脳震盪】 特大ゴールドニンジンが急所に直撃した衝撃で、敵は目を回して行動不能になった！`);
    }
    const mentalItem = getEffectSource('mental_damage');
    const mentalChance = getEffectRarityTotal('mental_damage', { N: 0.05, R: 0.08, SR: 0.15, UR: 0.20 }, 0.08, 0.40);
    if (mentalItem && Math.random() < mentalChance) {
      isEnemyStunned = true;
      newLogs.push(`🧠 【精神攻撃】 ${getEffectMsg('mental_damage', mentalItem)} (敵はショックで行動不能！)`);
    }
    const cringeItem = getEffectSource('cringe');
    const cringeChance = getEffectRarityTotal('cringe', { N: 0.03, R: 0.05, SR: 0.10, UR: 0.15 }, 0.05, 0.25);
    if (!isEnemyStunned && cringeItem && Math.random() < cringeChance) {
      isEnemyStunned = true;
      newLogs.push(`😬 【ドン引き】 ${getEffectMsg('cringe', cringeItem)} (敵はドン引きして動けない！)`);
    }

    // 🍜 【飯テロ: meshitero】（N:5%, R:10%, SR:20%, UR:25%）
    const meshiteroItem = getEffectSource('meshitero');
    const meshiteroChance = getEffectRarityTotal('meshitero', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
    if (!isEnemyStunned && meshiteroItem && Math.random() < meshiteroChance) {
      isEnemyStunned = true;
      newLogs.push(`🍜 ${getStackLabel('meshitero', '飯テロ')} 深夜の特製背脂ニンニクマシマシ画像を投下！ 敵はお腹を押さえて動けなくなった！`);
    }

    // 💬 【既読スルー: kidoku_ignore】 敵攻撃を完全無視＆敵モヤモヤ自傷（N:5%, R:10%, SR:20%, UR:25%）
    let isKidokuSkipped = false;
    const kidokuItem = getEffectSource('kidoku_ignore');
    const kidokuChance = getEffectRarityTotal('kidoku_ignore', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
    if (!isEnemyStunned && kidokuItem && Math.random() < kidokuChance) {
      isKidokuSkipped = true;
      const moyamoyaDmg = Math.max(5, Math.floor(enemy.hp * 0.08));
      currentEnemyHp = Math.max(0, currentEnemyHp - moyamoyaDmg);
      newLogs.push(`💬 ${getStackLabel('kidoku_ignore', '既読スルー')} 敵の攻撃を既読のまま放置した！`);
      newLogs.push(`🌀 敵は「返信まだかな…」とモヤモヤして自傷し、${moyamoyaDmg} のダメージを受けた！`);
      if (currentEnemyHp === 0) {
        handleBattleVictory(newLogs, currentPlayerHp);
        return;
      }
    }

    // 敵の反撃ターン
    if (isEnemyStunned) {
      newLogs.push(`💤 【${enemy.name}】 は動けない！`);
    } else if (isKidokuSkipped) {
      // 既読スルーでスキップ済み
    } else {
      const enemySkills = enemy.skills || [];
      const usedSkill = (enemySkills.length > 0 && Math.random() < 0.30)
        ? enemySkills[Math.floor(Math.random() * enemySkills.length)]
        : null;

      if (usedSkill) {
        newLogs.push(`⚡ 【${enemy.name}】 の 『${usedSkill.name}』！`);
        if (usedSkill.msg) newLogs.push(`💬 ${usedSkill.msg}`);
      }

      if (usedSkill?.type === 'idle') {
        newLogs.push(`...しかし 何も起こらなかった！`);
      } else if (usedSkill?.type === 'heal') {
        const healAmt = Math.max(10, Math.floor(enemy.hp * (usedSkill.rate || 0.25)));
        currentEnemyHp = Math.min(enemy.hp, currentEnemyHp + healAmt);
        newLogs.push(`✨ 【${enemy.name}】 のHPが ${healAmt} 回復した！`);
      } else {
        const skillMult = usedSkill?.multiplier || 1.0;
        let dmgToPlayer = Math.max(1, Math.floor((enemy.atk - pDef) * (1.0 + (Math.random() * 0.4 - 0.2)) * skillMult));
        const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2 * skillMult));
        if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;

        // 回避判定 (stealth: N5%/R10%/SR20%, dodge_up: N5%/R10%/SR20%, giga_death: N5%/R10%/SR20%, hires: 35%)
        const stealthItem = getEffectSource('stealth');
        const dodgeBonus = getEffectRarityTotal('dodge_up', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.50);
        const gigaBonus = getEffectRarityTotal('giga_death', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
        const gigaItem = getEffectSource('giga_death');
        const hiresItem = getEffectSource('hires');
        let isDodged = false;

        let totalDodgeChance = dodgeBonus + gigaBonus;
        if (stealthItem) {
          totalDodgeChance += getRarityRate(stealthItem, { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10);
        }

        if (totalDodgeChance > 0 && Math.random() < Math.min(0.60, totalDodgeChance)) {
          isDodged = true;
          if (gigaItem && Math.random() < 0.60) {
            newLogs.push(`📶 【通信制限】 敵はギガ死（128kbps）でカクついて攻撃が間に合わなかった！`);
          } else {
            newLogs.push(stealthItem 
              ? `🥷 【ステルス】 匿名性の陰に隠れて攻撃を回避した！`
              : `💨 【回避】 華麗なステップで敵の攻撃をかわした！`);
          }
        } else if (hiresItem && Math.random() < 0.35) {
          isDodged = true;
          newLogs.push(`🎧 【ハイレゾ】 ${getEffectMsg('hires', hiresItem)}`);
        }

        if (isDodged) {
          dmgToPlayer = 0;
        } else {
          // 👀 【手刀見切り: sharp_eye】 「おれでなきゃ見逃しちゃうね」 カウンター反撃（N:5%, R:10%, SR:20%, UR:25%）
          const sharpEyeItem = getEffectSource('sharp_eye');
          const sharpEyeChance = getEffectRarityTotal('sharp_eye', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
          if (sharpEyeItem && Math.random() < sharpEyeChance) {
            const counterDmg = Math.max(15, Math.floor(pAtk * 1.5));
            currentEnemyHp = Math.max(0, currentEnemyHp - counterDmg);
            newLogs.push(`👀 ${getStackLabel('sharp_eye', '手刀見切り')} 「ふっ…おれでなきゃ見逃しちゃうね」`);
            newLogs.push(`💥 敵の攻撃を冷静に見切り、ノーモーションの手刀で ${counterDmg} のカウンターダメージ！`);
            dmgToPlayer = 0;
            if (currentEnemyHp === 0) {
              newLogs.push(`🎉 敵は見切りの速さに絶望して倒れた... 【${enemy.name}】 を撃退した！`);
              setEnemyHp(0);
              setPlayerHp(currentPlayerHp);
              setBattleLog(newLogs);
              handleBattleVictory(newLogs, currentPlayerHp);
              return;
            }
          }

          // 👵 【オカンの盾: mom_block】 痛恨時50%で敵即死
          const momItem = getEffectSource('mom_block');
          if (momItem && Math.random() < 0.15) {
            newLogs.push(`👵 【オカン乱入】 ${getEffectMsg('mom_block', momItem)}`);
            newLogs.push(`💀 敵は恥ずかしさのあまり顔を真っ赤にして逃げ出した！！`);
            setEnemyHp(0);
            setPlayerHp(currentPlayerHp);
            setBattleLog(newLogs);
            handleBattleVictory(newLogs, currentPlayerHp);
            return;
          }

          // 📜 【クソリプ防御: kusorep】 被弾時（N:5%, R:10%, SR:20%, UR:30%）
          const kusorepItem = getEffectSource('kusorep');
          const kusorepChance = getEffectRarityTotal('kusorep', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.30 }, 0.10, 0.50);
          const privilegeItem = getEffectSource('privilege');
          const lockItem = getEffectSource('lock_account');
          const lawItem = getEffectSource('partner_law');

          if (kusorepItem && Math.random() < kusorepChance) {
            dmgToPlayer = 1;
            newLogs.push(`📜 ${getStackLabel('kusorep', 'クソリプ')} ${getEffectMsg('kusorep', kusorepItem)} (ダメージが1になった！)`);
          } else if (privilegeItem && Math.random() < getEffectChance('privilege', 0.25, 0.50)) {
            dmgToPlayer = 0;
            newLogs.push(`👑 ${getStackLabel('privilege', '特権')} ${getEffectMsg('privilege', privilegeItem)} (ダメージを完全無効化！)`);
          } else {
            // 🔒 【鍵垢: lock_account】 ダメージ軽減（N:5%, R:10%, SR:15%, UR:20%）
            if (lockItem) {
              const lockCut = getEffectRarityTotal('lock_account', { N: 0.05, R: 0.10, SR: 0.15, UR: 0.20 }, 0.10, 0.30);
              dmgToPlayer = Math.max(1, Math.floor(dmgToPlayer * (1.0 - lockCut)));
              newLogs.push(`🔒 【鍵垢】 ${getEffectMsg('lock_account', lockItem)} (ダメージ${Math.round(lockCut * 100)}%軽減)`);
            } else if (lawItem && Math.random() < 0.50) {
              dmgToPlayer = Math.max(1, Math.floor(dmgToPlayer * 0.50));
              newLogs.push(`👨‍⚖️ 【異議あり】 ${getEffectMsg('partner_law', lawItem)} (ダメージ半減)`);
            }

            currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
            newLogs.push(usedSkill 
              ? `💥 『${usedSkill.name}』 が直撃！ ${dmgToPlayer} のダメージを受けた！`
              : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);

            // ドレイン技
            if (usedSkill?.type === 'drain' && dmgToPlayer > 0) {
              const drainAmt = Math.min(dmgToPlayer, enemy.hp - currentEnemyHp);
              if (drainAmt > 0) {
                currentEnemyHp += drainAmt;
                newLogs.push(`🩸 【${enemy.name}】 は活力を吸い取って ${drainAmt} 回復した！`);
              }
            }
          }

          // 🪞 【反射: reflect】
          const reflectItem = getEffectSource('reflect');
          if (currentPlayerHp > 0 && reflectItem && Math.random() < getEffectChance('reflect', 0.30, 0.60)) {
            const refDmg = Math.floor(dmgToPlayer * 1.5);
            currentEnemyHp = Math.max(0, currentEnemyHp - refDmg);
            newLogs.push(`🪞 ${getStackLabel('reflect', '反射')} ${getEffectMsg('reflect', reflectItem)} 敵に ${refDmg} の大ダメージ！`);
          }
        }
      }
    }

    // プレイヤー敗北チェック
    if (currentPlayerHp === 0) {
      newLogs.push(`💀 目の前が真っ暗になった... 力尽きて地上へ担ぎ込まれた。`);
      setPlayerHp(0);
      setEnemyHp(currentEnemyHp);
      setBattleLog(newLogs);
      addDungeonHistoryRecord({
        floor,
        level: userLevel,
        result: 'lost',
        exp: 0,
        tickets: 0,
        items: collectedItems,
        monsters: defeatedMonsters
      });
      setDungeonState('lost');
      return;
    }

    setEnemyHp(currentEnemyHp);
    setPlayerHp(currentPlayerHp);
    setBattleLog(newLogs);
  };

  // 🧪 回復薬使用
  const handleHeal = () => {
    if (healCount >= 3 || playerHp >= pMaxHp) return;
    const healAmt = Math.floor(pMaxHp * 0.40);
    const newHp = Math.min(pMaxHp, playerHp + healAmt);
    setPlayerHp(newHp);
    setHealCount(prev => prev + 1);
    const msg = `🧪 回復薬を使用した！ HPが ${healAmt} 回復した！（残り ${2 - healCount} 回）`;
    if (dungeonState === 'battling') {
      setBattleLog(prev => [...prev, msg]);
    } else {
      setDungeonLog(prev => [msg, ...prev]);
    }
  };

  // 敵撃破後の勝利処理
  const handleBattleVictory = (logs, finalHp) => {
    const isBossFloor = floor % 10 === 0;
    const baseExp = enemy.type === 'rare' ? 220 : enemy.type === 'elite' ? 110 : 50;
    const earnedExp = baseExp + (floor * 10);
    setCollectedExp(prev => prev + earnedExp);

    // 討伐モンスター記録に追加
    if (enemy) {
      setDefeatedMonsters(prev => {
        const existing = prev.find(m => m.id === enemy.id);
        if (existing) {
          return prev.map(m => m.id === enemy.id ? { ...m, count: (m.count || 1) + 1 } : m);
        }
        return [...prev, {
          id: enemy.id,
          name: enemy.name,
          icon: enemy.icon || '👾',
          type: enemy.type || 'normal',
          isBoss: isBossFloor,
          count: 1
        }];
      });
    }

    logs.push(`🎉 【${enemy.name}】 を撃破した！ (EXP +${earnedExp})`);

    // ボスフロア撃破時の特別ボーナス（階段出現＆チケット2枚）
    if (isBossFloor) {
      setHasStairs(true);
      setCollectedTickets(prev => prev + 2);
      logs.push(`🏆 【大ボス撃破！】 ガチャチケットを 2 枚獲得！`);
      logs.push(`🪜 最深部に下り階段が出現した！`);
      setDungeonLog(prev => [
        `🏆 B${floor}F の主 【${enemy.name}】 を討伐！ 下り階段が出現した！`,
        ...prev
      ]);
    } else {
      // 🐰 地下らびたん六大進化の保護＆撃破ボーナス！
      if (enemy.id === 'd_lost_rabbit') {
        setCollectedTickets(prev => prev + 1);
        logs.push(`🐰💧 「地上へ帰れるの？！ありがとうー！！」とお礼にガチャチケットを置いていった！`);
        setDungeonLog(prev => [`🐰💧 迷子のらびたんを地上へ救出した！（チケット+1）`, ...prev]);
      } else if (enemy.id === 'd_gem_rabbit') {
        const gemItem = ITEMS.find(i => i.id === 'ac_rabi_gem');
        if (gemItem && Math.random() < 0.10) {
          setCollectedItems(prev => [...prev, gemItem]);
          if (setInventory) setInventory(prev => [...prev, gemItem]);
          logs.push(`🐰💎 「わー！見つかっちゃった！」と宝石を落として逃げていった！`);
          logs.push(`🎁✨ 落とし物の 【らびたんの掘り出した宝石 (SR)】 を手に入れた！`);
          setDungeonLog(prev => [`🐰💎 宝石らびたんを発見！貴重な宝石を回収した！`, ...prev]);
        } else {
          logs.push(`🐰💎 「わー！見つかっちゃった！」と猛ダッシュで逃げていった！`);
          setDungeonLog(prev => [`🐰💎 宝石らびたんが逃走した！`, ...prev]);
        }
      } else if (enemy.id === 'd_muscle_rabbit') {
        const protein = ITEMS.find(i => i.id === 'ar_protein_drink');
        if (protein && Math.random() < 0.08) {
          setCollectedItems(prev => [...prev, protein]);
          if (setInventory) setInventory(prev => [...prev, protein]);
          logs.push(`🐰💪 「ナイスバルク…！いい筋トレになったぜ…！」と爽やかに去っていった！`);
          logs.push(`🎁✨ ムキムキらびたんから 【にんじん味の特濃プロテイン (SR)】 を譲り受けた！`);
          setDungeonLog(prev => [`🐰💪 ムキムキらびたんと肉体を語り合い、プロテインを獲得！`, ...prev]);
        } else {
          logs.push(`🐰💪 「いい筋トレになったぜ…！またパンプアップしようぜ！」と爽やかに去っていった！`);
          setDungeonLog(prev => [`🐰💪 ムキムキらびたんと汗を流した！`, ...prev]);
        }
      } else if (enemy.id === 'd_living_rabbit') {
        const blanket = ITEMS.find(i => i.id === 'ar_kotatsu_blanket');
        if (blanket && Math.random() < 0.08) {
          setCollectedItems(prev => [...prev, blanket]);
          if (setInventory) setInventory(prev => [...prev, blanket]);
          logs.push(`🐰🛋️ 「たまには人と話すのも悪くないねぇ…これあげるよ」`);
          logs.push(`🎁✨ 定住らびたんから 【地下ぐらしのぬくぬく毛布 (SR)】 をもらった！`);
          setDungeonLog(prev => [`🐰🛋️ 定住らびたんのコタツでお茶を飲み、毛布をもらった！`, ...prev]);
        } else {
          logs.push(`🐰🛋️ 「ふぅ…お茶がうまいねぇ。気をつけて進みなよ〜」とお見送りしてくれた。`);
          setDungeonLog(prev => [`🐰🛋️ 定住らびたんとコタツで一服した！`, ...prev]);
        }
      } else if (enemy.id === 'd_dark_rabbit') {
        const darkCarrot = ITEMS.find(i => i.id === 'w_dark_carrot');
        if (darkCarrot && Math.random() < 0.05) {
          setCollectedItems(prev => [...prev, darkCarrot]);
          if (setInventory) setInventory(prev => [...prev, darkCarrot]);
          announceRareDrop(darkCarrot, enemy.name);
          logs.push(`🐰👿 「浄化される…！温かい光を…ありがとう…！」と元の白い姿に戻って光の中へ消えていった！`);
          logs.push(`🎁✨ 奇跡の激レアドロップ！！ 闇が結晶化した 【漆黒の呪われしにんじん (UR)】 を手に入れた！`);
          setDungeonLog(prev => [`🐰👿 悪に堕ちたらびたんを救済し、URにんじんを獲得！`, ...prev]);
        } else {
          logs.push(`🐰👿 「浄化される…！温かい光を…ありがとう…！」と元の白い姿に戻って光の中へ消えていった！`);
          setDungeonLog(prev => [`🐰👿 悪に堕ちたらびたんの魂を救済した！`, ...prev]);
        }
      } else if (enemy.id === 'd_myth_rabbit') {
        const crown = ITEMS.find(i => i.id === 'ac_ancient_crown');
        if (crown && Math.random() < 0.03) {
          setCollectedItems(prev => [...prev, crown]);
          if (setInventory) setInventory(prev => [...prev, crown]);
          announceRareDrop(crown, enemy.name);
          logs.push(`🐰👑 「見事だ、地上の旅人よ。この大地の加護をそなたに託そう…」`);
          logs.push(`🏆✨ 神話の超幻ドロップ！！ 【地底王の古代参冠 (LR)】 を授かった！！`);
          setDungeonLog(prev => [`👑 伝説の地底兎から神話の古代冠を授かった！`, ...prev]);
        } else {
          logs.push(`🐰👑 「大地の鼓動をしかと見届けた。地上の平和を頼んだぞ…」と大地の光へ還っていった。`);
          setDungeonLog(prev => [`👑 伝説の地底兎の試練を乗り越えた！`, ...prev]);
        }
      } else if (enemy.specialDropId && Math.random() < 0.35) {
        // 🎧 専用特別ドロップ判定（93万円のハイレゾおじさん等）
        const specialItem = ITEMS.find(i => i.id === enemy.specialDropId);
        if (specialItem) {
          setCollectedItems(prev => [...prev, specialItem]);
          if (setInventory) setInventory(prev => [...prev, specialItem]);
          announceRareDrop(specialItem, enemy.name);
          logs.push(`🎁✨ 奇跡の激レアドロップ！！`);
          logs.push(`🎧 【${enemy.name}】 は首から下げていた 【${specialItem.name} (${specialItem.rarity})】 を落としていった！！`);
        }
      } else if (Math.random() < 0.30 && ITEMS.length > 0) {
        // 通常敵ドロップ判定 (30%)
        let rarityFilter = ['N', 'R'];
        if (floor >= 15) rarityFilter = ['R', 'SR', 'UR'];
        else if (floor >= 5) rarityFilter = ['N', 'R', 'SR'];

        const pool = ITEMS.filter(i => rarityFilter.includes(i.rarity));
        const dropped = pool[Math.floor(Math.random() * pool.length)] || ITEMS[0];
        setCollectedItems(prev => [...prev, dropped]);
        if (setInventory) setInventory(prev => [...prev, dropped]);
        announceRareDrop(dropped, enemy.name);
        logs.push(`🎁 敵が 【${dropped.name} (${dropped.rarity})】 を落とした！`);
      }
      setDungeonLog(prev => [
        `⚔️ 【${enemy.name}】 を撃破した！ (EXP +${earnedExp})`,
        ...prev
      ]);
    }

    setEnemyHp(0);
    setPlayerHp(finalHp);
    setBattleLog(logs);
    // 戦闘終了し、フロア探索画面へ復帰
    setTimeout(() => {
      setDungeonState('exploring');
    }, 1200);
  };

  return (
    <div style={{
      background: floor % 10 === 0 
        ? 'linear-gradient(180deg, #450a0a 0%, #18181b 100%)' 
        : 'linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)',
      borderRadius: '12px',
      padding: '16px',
      color: '#f8fafc',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      border: floor % 10 === 0 ? '1px solid #ef4444' : '1px solid #312e81',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.3s ease'
    }}>
      {/* ダンジョンヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>{floor % 10 === 0 ? '👑' : '🔦'}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: floor % 10 === 0 ? '#fca5a5' : '#c7d2fe' }}>
              {floor % 10 === 0 ? '地下パトロール・BOSS階層' : '地下パトロール'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              最高記録: <strong style={{ color: '#fbbf24' }}>B{bestFloor}F</strong>
            </div>
          </div>
        </div>
        {dungeonState !== 'lobby' && (
          <div style={{
            background: floor % 10 === 0 ? '#dc2626' : '#4338ca',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '0.85rem'
          }}>
            B{floor}F
          </div>
        )}
      </div>

      {/* 1. ロビー画面（地下パトロール入口） */}
      {dungeonState === 'lobby' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 8px', gap: '14px' }}>
          <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 0 12px rgba(129, 140, 248, 0.5))' }}>
            🔦🚪
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f1f5f9', marginBottom: '4px' }}>
              広場の地下を巡回する「地下パトロール」
            </div>
            {/* 本日の残り挑戦回数＆ストック鍵バッジ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              margin: '6px 0 10px 0'
            }}>
              {/* 無料枠 */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                background: remainingAttempts > 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                border: remainingAttempts > 0 ? '1px solid #6366f1' : '1px solid #475569',
                color: remainingAttempts > 0 ? '#a5b4fc' : '#94a3b8'
              }}>
                <span>📅 無料枠:</span>
                <strong>残り {remainingAttempts} 回</strong>
              </div>

              {/* ストック鍵 */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.78rem',
                fontWeight: 'bold',
                background: dungeonKeys > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                border: dungeonKeys > 0 ? '1px solid #f59e0b' : '1px solid #475569',
                color: dungeonKeys > 0 ? '#fde047' : '#94a3b8'
              }}>
                <span>🗝️ 所持鍵:</span>
                <strong>{dungeonKeys} / {MAX_DUNGEON_KEYS} 個</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
              部屋を探索して**下り階段 🪜**を見つけよう！<br />
              宝箱や泉を探すか、さらに深く潜るかはあなた次第。<br />
              <strong style={{ color: '#f87171' }}>10フロアごとには巨大なBOSSが待ち構える！</strong>
            </div>

            <div style={{
              marginTop: '10px',
              padding: '6px 10px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: '#fcd34d',
              lineHeight: 1.4,
              maxWidth: '280px',
              margin: '10px auto 0 auto'
            }}>
              ⚠️ <strong>脱出ルール（装備あんしん保護🛡️）</strong><br />
              地下で力尽きると獲得EXPやチケットを落としてしまいます（※拾った装備・アイテムは100%守られます！）。
              EXPやチケットを安全に持ち帰るなら「🚪 地上へ帰還」しよう！
            </div>
          </div>

          <button
            onClick={enterDungeon}
            disabled={remainingAttempts <= 0 && dungeonKeys <= 0}
            style={{
              width: '100%',
              maxWidth: '280px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: (remainingAttempts > 0 || dungeonKeys > 0)
                ? remainingAttempts > 0
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : '#334155',
              color: (remainingAttempts > 0 || dungeonKeys > 0) ? 'white' : '#94a3b8',
              fontWeight: 'bold',
              fontSize: '0.92rem',
              cursor: (remainingAttempts > 0 || dungeonKeys > 0) ? 'pointer' : 'not-allowed',
              boxShadow: (remainingAttempts > 0 || dungeonKeys > 0)
                ? remainingAttempts > 0
                  ? '0 4px 12px rgba(79, 70, 229, 0.4)'
                  : '0 4px 12px rgba(245, 158, 11, 0.4)'
                : 'none'
            }}
          >
            {remainingAttempts > 0 
              ? `🔦 地下パトロールへ出発（無料枠: 残り${remainingAttempts}回）` 
              : dungeonKeys > 0
                ? `🗝️ 地下の鍵を使って出発（所持: 残り${dungeonKeys}個）`
                : '🗝️ 挑戦権終了（地上パトロールで鍵を探そう！）'}
          </button>

          {/* 📜 本日の探索記録（冒険履歴） */}
          <div style={{
            width: '100%',
            maxWidth: '300px',
            marginTop: '14px',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '10px 12px',
            textAlign: 'left',
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 'bold',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '4px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>📜</span>
                <span>パトロール記録</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {dungeonHistory.length > 0 ? `本日 直近${dungeonHistory.length}回` : '本日 未記録'}
              </span>
            </div>

            {dungeonHistory.length === 0 ? (
              <div style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                textAlign: 'center',
                padding: '10px 4px',
                lineHeight: 1.5,
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '6px'
              }}>
                まだ本日のパトロール記録がありません。<br />
                地下へ出発するとここに記録が残ります🔦
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                maxHeight: '220px',
                overflowY: 'auto',
                paddingRight: '3px'
              }}>
                {sortDungeonHistoryDesc(dungeonHistory).map((h, idx) => {
                  const monsterCount = h.monsters ? h.monsters.reduce((sum, m) => sum + (m.count || 1), 0) : 0;
                  return (
                    <div key={idx} style={{
                      fontSize: '0.73rem',
                      lineHeight: 1.45,
                      padding: '7px 9px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}>
                      {/* 1行目: [時間] 到達階 (Lv)　結末 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.7rem' }}>[{h.time}]</span>
                          <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                            B{h.floor}F 到達 {h.level ? <span style={{ color: '#fbbf24', fontSize: '0.68rem', fontWeight: 'bold' }}>(Lv.{h.level})</span> : ''}
                          </span>
                        </div>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '0.72rem',
                          color: h.result === 'escaped' ? '#34d399' : h.result === 'lost' ? '#f87171' : '#94a3b8'
                        }}>
                          {h.result === 'escaped' ? '無事帰還 🎉' : h.result === 'lost' ? '力尽きた 💀' : '即時帰還'}
                        </span>
                      </div>

                      {/* 2行目: ⭐ EXP +◯　🎫 チケット ◯枚 */}
                      {(h.exp > 0 || h.tickets > 0) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem' }}>
                          {h.exp > 0 && <span style={{ color: '#fbbf24' }}>⭐ EXP <strong>+{h.exp}</strong></span>}
                          {h.tickets > 0 && <span style={{ color: '#34d399' }}>🎫 チケット <strong>{h.tickets}枚</strong></span>}
                        </div>
                      )}

                      {/* 3行目: ⚔️ 討伐(◯体): モンスター一覧 */}
                      {h.monsters && h.monsters.length > 0 && (
                        <div style={{ fontSize: '0.68rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                          <span style={{ color: '#f87171', fontWeight: 'bold' }}>⚔️ 討伐({monsterCount}体): </span>
                          {h.monsters.map((m, mIdx) => (
                            <span key={mIdx}>
                              {m.icon || '👾'} {m.name}{m.count > 1 ? `×${m.count}` : ''}{mIdx < h.monsters.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 4行目: 🎁 戦利品: [レア度] アイテム名 */}
                      {h.items && h.items.length > 0 && (
                        <div style={{ fontSize: '0.68rem', marginTop: '1px', display: 'flex', alignItems: 'flex-start', gap: '4px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#93c5fd', fontWeight: 'bold', flexShrink: 0 }}>🎁 戦利品:</span>
                          <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '3px' }}>
                            {h.items.map((it, itemIdx) => {
                              const isHighRarity = ['SR', 'UR', 'LR'].includes(it.rarity);
                              const rarityCfg = RARITY_CONFIG[it.rarity] || RARITY_CONFIG.N;
                              return (
                                <span 
                                  key={itemIdx} 
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '1px 5px',
                                    borderRadius: '5px',
                                    background: isHighRarity ? 'rgba(0,0,0,0.5)' : 'rgba(255, 255, 255, 0.05)',
                                    border: isHighRarity ? `1px solid ${rarityCfg.darkColor}` : '1px solid rgba(255, 255, 255, 0.1)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    boxShadow: isHighRarity ? rarityCfg.boxGlow : 'none'
                                  }}
                                >
                                  {rarityCfg.sparkle && <span>{rarityCfg.sparkle}</span>}
                                  <span style={getRarityTextStyle(it.rarity, true)}>
                                    [{it.rarity}] {it.name}
                                  </span>
                                </span>
                              );
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. トルネコ風探索中画面 */}
      {dungeonState === 'exploring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* フロアステータスバナー */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>現在地</div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#38bdf8' }}>地下 {floor} 階 (B{floor}F)</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>下り階段</div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: hasStairs ? '#34d399' : '#f87171' }}>
                {hasStairs ? '🪜 発見済み！' : '❓ 未発見'}
              </div>
            </div>
          </div>

          {/* 🎒 探索リュック（生還時に確定する戦利品） */}
          <div style={{
            background: 'rgba(79, 70, 229, 0.15)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.74rem',
            color: '#c7d2fe'
          }}>
            <span>🎒 持ち帰り待機中:</span>
            <span style={{ fontWeight: 'bold', color: '#fcd34d' }}>
              EXP +{collectedExp} / 🎫 {collectedTickets}枚 <span style={{ color: '#34d399', fontSize: '0.7rem' }}>（🛡️ 装備 {collectedItems.length}個 保護済）</span>
            </span>
          </div>

          {/* プレイヤーHP & 戦闘力表示 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#94a3b8' }}>あなたのHP:</span>
              <span style={{ fontWeight: 'bold', color: playerHp < pMaxHp * 0.3 ? '#f87171' : '#34d399' }}>
                {playerHp} / {pMaxHp}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', gap: '8px' }}>
              <span>⚔️ <strong style={{ color: '#fed7aa' }}>{pAtk}</strong></span>
              <span>🛡️ <strong style={{ color: '#bfdbfe' }}>{pDef}</strong></span>
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, (playerHp / pMaxHp) * 100))}%`,
              height: '100%',
              background: playerHp < pMaxHp * 0.3 ? '#ef4444' : '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* 探索ログ表示 */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            borderRadius: '6px',
            padding: '8px 12px',
            minHeight: '75px',
            maxHeight: '110px',
            overflowY: 'auto',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            color: '#e2e8f0'
          }}>
            {dungeonLog.slice(0, 5).map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>

          {/* 探索アクションボタン群 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            {/* 部屋を探索する */}
            <button
              onClick={handleSearchRoom}
              disabled={floorSearches >= MAX_FLOOR_SEARCHES}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: floorSearches >= MAX_FLOOR_SEARCHES
                  ? '#334155'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: floorSearches >= MAX_FLOOR_SEARCHES ? '#94a3b8' : 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: floorSearches >= MAX_FLOOR_SEARCHES ? 'not-allowed' : 'pointer',
                boxShadow: floorSearches >= MAX_FLOOR_SEARCHES ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              {floorSearches >= MAX_FLOOR_SEARCHES
                ? '💨 この階の探索は完了！（下り階段を降りよう）'
                : `🔍 部屋を探索する（残り ${MAX_FLOOR_SEARCHES - floorSearches} 回）`}
            </button>

            {/* 下り階段を降りる (階段発見時のみ活性化) */}
            <button
              onClick={handleDescend}
              disabled={!hasStairs}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '8px',
                border: 'none',
                background: hasStairs 
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                  : 'rgba(255,255,255,0.08)',
                color: hasStairs ? 'white' : '#64748b',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: hasStairs ? 'pointer' : 'not-allowed',
                boxShadow: hasStairs ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              {hasStairs ? `⬇️ 下り階段を降りる（B${floor + 1}Fへ・HP+25%回復）` : '🔒 下り階段がまだ見つかっていません'}
            </button>

            {/* サブ操作（回復薬＆地上帰還） */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleHeal}
                disabled={healCount >= 3 || playerHp >= pMaxHp}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: healCount >= 3 || playerHp >= pMaxHp ? '#334155' : '#059669',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  cursor: healCount >= 3 || playerHp >= pMaxHp ? 'not-allowed' : 'pointer'
                }}
              >
                🧪 回復薬 ({3 - healCount})
              </button>
              <button
                onClick={handleEscape}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#e2e8f0',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                🚪 地上へ帰還（戦利品確定）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 戦闘中画面 */}
      {dungeonState === 'battling' && enemy && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 🎒 持ち帰り待機中の戦利品バナー */}
          <div style={{
            background: 'rgba(79, 70, 229, 0.15)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: '6px',
            padding: '5px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: '#c7d2fe'
          }}>
            <span>🎒 持ち帰り待機中:</span>
            <span style={{ fontWeight: 'bold', color: '#fcd34d' }}>
              EXP +{collectedExp} / 🎫 {collectedTickets}枚 <span style={{ color: '#34d399', fontSize: '0.68rem' }}>（🛡️ 装備 {collectedItems.length}個 保護済）</span>
            </span>
          </div>
          {/* ボス警告バナー（10階ごと） */}
          {floor % 10 === 0 && (
            <div style={{
              background: '#dc2626',
              color: 'white',
              textAlign: 'center',
              padding: '6px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              letterSpacing: '1px',
              animation: 'pulse 1.5s infinite'
            }}>
              🚨 WARNING !! 階層の主が立ちはだかる！ 🚨
            </div>
          )}

          {/* 敵ステータスカード */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.6rem' }}>{enemy.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#f8fafc' }}>{enemy.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Lv.{enemy.level} / DEF {enemy.def}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 'bold', color: '#f87171' }}>
                HP {enemyHp} / {enemy.hp}
              </div>
            </div>

            {/* 敵HPゲージ */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.max(0, Math.min(100, (enemyHp / enemy.hp) * 100))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* プレイヤーHP & 戦闘力表示 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#94a3b8' }}>あなたのHP:</span>
              <span style={{ fontWeight: 'bold', color: playerHp < pMaxHp * 0.3 ? '#f87171' : '#34d399' }}>
                {playerHp} / {pMaxHp}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', gap: '8px' }}>
              <span>⚔️ <strong style={{ color: '#fed7aa' }}>{pAtk}</strong></span>
              <span>🛡️ <strong style={{ color: '#bfdbfe' }}>{pDef}</strong></span>
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.4)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${Math.max(0, Math.min(100, (playerHp / pMaxHp) * 100))}%`,
              height: '100%',
              background: playerHp < pMaxHp * 0.3 ? '#ef4444' : '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* 戦闘ログ */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '6px',
            padding: '8px 12px',
            minHeight: '80px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontSize: '0.75rem',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            color: '#e2e8f0'
          }}>
            {battleLog.slice(-5).map((log, idx) => (
              <div key={idx}>{log}</div>
            ))}
          </div>

          {/* 操作ボタン */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAttack}
              style={{
                flex: 2,
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ⚔️ 攻撃する
            </button>
            <button
              onClick={handleHeal}
              disabled={healCount >= 3 || playerHp >= pMaxHp}
              style={{
                flex: 1,
                padding: '10px 4px',
                borderRadius: '6px',
                border: 'none',
                background: healCount >= 3 || playerHp >= pMaxHp ? '#475569' : '#059669',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                cursor: healCount >= 3 || playerHp >= pMaxHp ? 'not-allowed' : 'pointer'
              }}
            >
              🧪 回復 ({3 - healCount})
            </button>
          </div>
        </div>
      )}

      {/* 4. 生還成功画面 */}
      {dungeonState === 'escaped' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 8px', gap: '12px' }}>
          <div style={{ fontSize: '2.5rem' }}>🌅🏰</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fbbf24' }}>地上へ無事生還！</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
              到達階層: <strong style={{ color: '#f8fafc' }}>B{floor}F</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '3px' }}>
              すべての戦利品を安全に持ち帰ることに成功しました！✨
            </div>
          </div>

          <div style={{
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '0.8rem',
            textAlign: 'left',
            lineHeight: 1.6
          }}>
            <div>⭐ 獲得EXP: <strong style={{ color: '#fbbf24' }}>+{collectedExp}</strong></div>
            <div>🎫 獲得チケット: <strong style={{ color: '#34d399' }}>{collectedTickets}枚</strong></div>
            <div>🎁 獲得アイテム: <strong>{collectedItems.length}個</strong></div>

            {collectedItems.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>【持ち帰った戦利品】</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {collectedItems.map((it, idx) => {
                    const rarityCfg = RARITY_CONFIG[it.rarity] || RARITY_CONFIG.N;
                    const isHigh = ['SR', 'UR', 'LR'].includes(it.rarity);
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isHigh ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.05)',
                        border: isHigh ? `1px solid ${rarityCfg.darkColor}` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        boxShadow: isHigh ? rarityCfg.boxGlow : 'none'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{it.icon}</span>
                          <span style={getRarityTextStyle(it.rarity, true)}>
                            {it.name}
                          </span>
                        </span>
                        <span style={getRarityBadgeStyle(it.rarity)}>
                          {rarityCfg.sparkle && <span>{rarityCfg.sparkle}</span>}
                          <span>{it.rarity}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setDungeonState('lobby')}
            style={{
              width: '100%',
              maxWidth: '220px',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: '#4f46e5',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ロビーに戻る
          </button>
        </div>
      )}

      {/* 5. 敗北画面 */}
      {dungeonState === 'lost' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 8px', gap: '12px' }}>
          <div style={{ fontSize: '2.5rem' }}>💀</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#f87171' }}>力尽きてしまった...</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', lineHeight: 1.6 }}>
              B{floor}F で力尽き、地上に担ぎ込まれました。<br />
              <span style={{ color: '#fca5a5' }}>
                今回の探索で集めた EXP (+{collectedExp}) とチケット ({collectedTickets}枚) は落としてしまいました…
              </span><br />
              <strong style={{ color: '#34d399', fontSize: '0.82rem' }}>
                🛡️ ですが、拾った装備・アイテム（{collectedItems.length}個）はすべて無事に持ち帰れました！✨
              </strong>
            </div>

            {collectedItems.length > 0 && (
              <div style={{
                marginTop: '10px',
                textAlign: 'left',
                background: 'rgba(0,0,0,0.3)',
                padding: '10px',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>【保護された装備】</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {collectedItems.map((it, idx) => {
                    const rarityCfg = RARITY_CONFIG[it.rarity] || RARITY_CONFIG.N;
                    const isHigh = ['SR', 'UR', 'LR'].includes(it.rarity);
                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isHigh ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.05)',
                        border: isHigh ? `1px solid ${rarityCfg.darkColor}` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        boxShadow: isHigh ? rarityCfg.boxGlow : 'none'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{it.icon}</span>
                          <span style={getRarityTextStyle(it.rarity, true)}>
                            {it.name}
                          </span>
                        </span>
                        <span style={getRarityBadgeStyle(it.rarity)}>
                          {rarityCfg.sparkle && <span>{rarityCfg.sparkle}</span>}
                          <span>{it.rarity}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setDungeonState('lobby')}
            style={{
              width: '100%',
              maxWidth: '220px',
              padding: '10px',
              borderRadius: '6px',
              border: 'none',
              background: '#475569',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ロビーへ戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default DungeonMiniGame;
