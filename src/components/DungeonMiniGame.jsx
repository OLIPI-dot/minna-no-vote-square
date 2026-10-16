import React, { useState, useEffect, useRef } from 'react';
import { ENEMIES, scaleEnemy, rollEnemy } from '../enemies';
import DUNGEON_ENEMIES from '../data/dungeon_enemies.json';
import { ITEMS } from '../items';

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
  user
}) => {
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
  const [healCount, setHealCount] = useState(0);

  // 最高到達階層（localStorage保存）
  const [bestFloor, setBestFloor] = useState(() => {
    try {
      return parseInt(localStorage.getItem('minique_dungeon_best') || '1', 10);
    } catch {
      return 1;
    }
  });

  // プレイヤー基本ステータス
  const pMaxHp = (userLevel * 20) + 100 + (equipment?.armor?.hp || 0) + (equipment?.accessory?.hp || 0) + (equipment?.partner?.hp || 0);
  const pAtk = (userLevel * 5) + 10 + (equipment?.weapon?.atk || 0) + (equipment?.accessory?.atk || 0) + (equipment?.partner?.atk || 0);
  const pDef = (userLevel * 2) + (equipment?.armor?.def || 0) + (equipment?.partner?.def || 0);

  const updateBestFloor = (newFloor) => {
    if (newFloor > bestFloor) {
      setBestFloor(newFloor);
      try {
        localStorage.setItem('minique_dungeon_best', String(newFloor));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 🗝️ 地下パトロール挑戦回数管理（1日基本3回 ＋ 地上パトロールで鍵ドロップ）
  const getTodayStr = () => new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const BASE_DAILY_ATTEMPTS = 3;

  const getDungeonAttempts = () => {
    const todayStr = getTodayStr();
    try {
      const data = JSON.parse(localStorage.getItem('daily_dungeon_attempts_v1') || '{}');
      if (data.date === todayStr) {
        return typeof data.remaining === 'number' ? data.remaining : BASE_DAILY_ATTEMPTS;
      }
    } catch (e) {
      console.error(e);
    }
    return BASE_DAILY_ATTEMPTS;
  };

  const [remainingAttempts, setRemainingAttempts] = useState(() => getDungeonAttempts());

  // ロビーに戻った時やタブ切り替え時に最新の残り回数を同期
  useEffect(() => {
    if (dungeonState === 'lobby') {
      setRemainingAttempts(getDungeonAttempts());
    }
  }, [dungeonState]);

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
    if (remainingAttempts <= 0) return;
    saveRemainingAttempts(remainingAttempts - 1);
    setFloor(1);
    setCollectedExp(0);
    setCollectedTickets(0);
    setCollectedItems([]);
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

  // 🔍 部屋を探索する（トルネコ風ランダムイベント）
  const handleSearchRoom = () => {
    if (dungeonState !== 'exploring') return;

    const newSearchCount = floorSearches + 1;
    setFloorSearches(newSearchCount);

    // 探索回数が増えるほど階段が見つかりやすくなる補正
    const stairsBonus = newSearchCount * 0.15;
    const rand = Math.random();

    // 1. 階段発見判定（まだ見つかっていない場合）
    if (!hasStairs && rand < (0.25 + stairsBonus)) {
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
    // 🎒 探索リュックのEXP・チケットをプレイヤーデータに正式加算
    if (collectedExp > 0 && addExp) {
      addExp(collectedExp);
    }
    if (collectedTickets > 0 && addTickets) {
      addTickets(collectedTickets);
    }
    setDungeonState('escaped');
    updateBestFloor(floor);
  };

  // ⚔️ バトル攻撃処理
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
          const itemEff = item.effect || ITEMS.find(i => (item.id && i.id === String(item.id).split('_')[0]) || i.name === item.name)?.effect;
          if (itemEff === eff) sources.push(item);
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
    const getStackLabel = (eff, label) => {
      const count = getEffectCount(eff);
      return count > 1 ? `【${label}×${count}】` : `【${label}】`;
    };

    // 自動回復 (regen)
    const regenItem = getEffectSource('regen');
    if (regenItem) {
      const healPct = Math.min(0.30, 0.10 * getEffectCount('regen'));
      const healAmount = Math.max(1, Math.floor(pMaxHp * healPct));
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + healAmount);
      newLogs.push(`✨ ${getStackLabel('regen', '回復')} ${getEffectMsg('regen', regenItem)} (HP +${healAmount})`);
    }

    // 攻撃計算
    const isCrit = Math.random() < (0.15 + (getEffectSource('crit_up') ? 0.20 : 0));
    let baseDmg = Math.max(5, pAtk - Math.floor(enemy.def * 0.6));
    const variance = 1.0 + (Math.random() * 0.3 - 0.15);
    let dmgToEnemy = Math.floor(baseDmg * variance * (isCrit ? 1.8 : 1.0));
    if (dmgToEnemy < 1) dmgToEnemy = 1;

    currentEnemyHp = Math.max(0, currentEnemyHp - dmgToEnemy);
    newLogs.push(isCrit 
      ? `💥 会心の一撃！！！ あなたの猛攻で ${dmgToEnemy} の大ダメージ！` 
      : `⚔️ あなたの攻撃！ 敵に ${dmgToEnemy} のダメージ！`);

    // 吸血 (lifesteal)
    const lifestealItem = getEffectSource('lifesteal');
    if (currentEnemyHp > 0 && lifestealItem && Math.random() < getEffectChance('lifesteal', 0.30, 0.60)) {
      const drain = Math.max(1, Math.floor(dmgToEnemy * 0.35));
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + drain);
      newLogs.push(`🩸 ${getStackLabel('lifesteal', '吸収')} HPを ${drain} 吸収した！`);
    }

    // 連撃 (double_attack)
    const doubleItem = getEffectSource('double_attack');
    if (currentEnemyHp > 0 && doubleItem && Math.random() < getEffectChance('double_attack', 0.30, 0.60)) {
      const secondDmg = Math.max(1, Math.floor(dmgToEnemy * 0.75));
      currentEnemyHp = Math.max(0, currentEnemyHp - secondDmg);
      newLogs.push(`⚔️ ${getStackLabel('double_attack', '連撃')} 追撃で ${secondDmg} のダメージ！`);
    }

    // 敵撃破チェック
    if (currentEnemyHp === 0) {
      handleBattleVictory(newLogs, currentPlayerHp);
      return;
    }

    // 敵の反撃ターン（固有技判定）
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

      // 🎧 ハイレゾ完全回避 (hires) 35%で完全回避
      const hiresItem = getEffectSource('hires');
      let isDodged = false;
      if (hiresItem && Math.random() < 0.35) {
        isDodged = true;
        newLogs.push(`🎧 【ハイレゾ】 ${getEffectMsg('hires', hiresItem)}`);
      }

      if (isDodged) {
        // 完全回避
      } else {
        // クソリプ防御
        const kusorepItem = getEffectSource('kusorep');
        if (kusorepItem && Math.random() < getEffectChance('kusorep', 0.20, 0.50)) {
          dmgToPlayer = 1;
          newLogs.push(`📜 【クソリプ】 クソリプのせいで 1 のダメージしか受けなかった！`);
        }

        currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
        newLogs.push(usedSkill 
          ? `💥 『${usedSkill.name}』 が直撃！ ${dmgToPlayer} のダメージを受けた！`
          : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);
      }
    }

    // プレイヤー敗北チェック
    if (currentPlayerHp === 0) {
      newLogs.push(`💀 目の前が真っ暗になった... 力尽きて地上へ担ぎ込まれた。`);
      setPlayerHp(0);
      setEnemyHp(currentEnemyHp);
      setBattleLog(newLogs);
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
        if (gemItem) {
          setCollectedItems(prev => [...prev, gemItem]);
          if (setInventory) setInventory(prev => [...prev, gemItem]);
        }
        logs.push(`🐰💎 「わー！見つかっちゃった！」と宝石を抱えて逃げていった！`);
        logs.push(`🎁 落とし物の 【らびたんの掘り出した宝石 (SR)】 を手に入れた！`);
        setDungeonLog(prev => [`🐰💎 宝石らびたんを発見！貴重な宝石を回収した！`, ...prev]);
      } else if (enemy.id === 'd_muscle_rabbit') {
        const protein = ITEMS.find(i => i.id === 'ar_protein_drink');
        if (protein) {
          setCollectedItems(prev => [...prev, protein]);
          if (setInventory) setInventory(prev => [...prev, protein]);
        }
        logs.push(`🐰💪 「ナイスバルク…！いい筋トレになったぜ…！」と爽やかに去っていった！`);
        logs.push(`🎁 ムキムキらびたんから 【にんじん味の特濃プロテイン (SR)】 を譲り受けた！`);
        setDungeonLog(prev => [`🐰💪 ムキムキらびたんと肉体を語り合い、プロテインを獲得！`, ...prev]);
      } else if (enemy.id === 'd_living_rabbit') {
        const blanket = ITEMS.find(i => i.id === 'ar_kotatsu_blanket');
        if (blanket) {
          setCollectedItems(prev => [...prev, blanket]);
          if (setInventory) setInventory(prev => [...prev, blanket]);
        }
        logs.push(`🐰🛋️ 「たまには人と話すのも悪くないねぇ…これあげるよ」`);
        logs.push(`🎁 定住らびたんから 【地下ぐらしのぬくぬく毛布 (SR)】 をもらった！`);
        setDungeonLog(prev => [`🐰🛋️ 定住らびたんのコタツでお茶を飲み、毛布をもらった！`, ...prev]);
      } else if (enemy.id === 'd_dark_rabbit') {
        const darkCarrot = ITEMS.find(i => i.id === 'w_dark_carrot');
        if (darkCarrot) {
          setCollectedItems(prev => [...prev, darkCarrot]);
          if (setInventory) setInventory(prev => [...prev, darkCarrot]);
        }
        logs.push(`🐰👿 「浄化される…！温かい光を…ありがとう…！」と元の白い姿に戻って光の中へ消えていった！`);
        logs.push(`🎁 闇が結晶化した 【漆黒の呪われしにんじん (UR)】 を手に入れた！`);
        setDungeonLog(prev => [`🐰👿 悪に堕ちたらびたんの魂を救済した！`, ...prev]);
      } else if (enemy.id === 'd_myth_rabbit') {
        const crown = ITEMS.find(i => i.id === 'ac_ancient_crown');
        if (crown) {
          setCollectedItems(prev => [...prev, crown]);
          if (setInventory) setInventory(prev => [...prev, crown]);
        }
        logs.push(`🐰👑 「見事だ、地上の旅人よ。この大地の加護をそなたに託そう…」`);
        logs.push(`🏆 神話の秘宝 【地底王の古代参冠 (LR)】 を授かった！！`);
        setDungeonLog(prev => [`👑 伝説の地底兎から神話の古代冠を授かった！`, ...prev]);
      } else if (enemy.specialDropId && Math.random() < 0.35) {
        // 🎧 専用特別ドロップ判定（93万円のハイレゾおじさん等）
        const specialItem = ITEMS.find(i => i.id === enemy.specialDropId);
        if (specialItem) {
          setCollectedItems(prev => [...prev, specialItem]);
          if (setInventory) setInventory(prev => [...prev, specialItem]);
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
            {/* 本日の残り挑戦回数バッジ */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              background: remainingAttempts > 0 ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: remainingAttempts > 0 ? '1px solid #6366f1' : '1px solid #ef4444',
              color: remainingAttempts > 0 ? '#a5b4fc' : '#fca5a5',
              margin: '6px 0 10px 0'
            }}>
              🗝️ 本日の挑戦権: <strong>残り {remainingAttempts} 回</strong>
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
            disabled={remainingAttempts <= 0}
            style={{
              width: '100%',
              maxWidth: '260px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: remainingAttempts > 0 
                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' 
                : '#334155',
              color: remainingAttempts > 0 ? 'white' : '#94a3b8',
              fontWeight: 'bold',
              fontSize: '0.92rem',
              cursor: remainingAttempts > 0 ? 'pointer' : 'not-allowed',
              boxShadow: remainingAttempts > 0 ? '0 4px 12px rgba(79, 70, 229, 0.4)' : 'none'
            }}
          >
            {remainingAttempts > 0 
              ? '🔦 地下パトロールへ出発（B1F〜）' 
              : '🗝️ 本日の挑戦権終了（地上パトロールで鍵を探そう！）'}
          </button>
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

          {/* プレイヤーHPゲージ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ color: '#94a3b8' }}>あなたのHP:</span>
            <span style={{ fontWeight: 'bold', color: playerHp < pMaxHp * 0.3 ? '#f87171' : '#34d399' }}>
              {playerHp} / {pMaxHp}
            </span>
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
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              🔍 部屋を探索する（敵・宝箱・階段を探す）
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

          {/* プレイヤーHPゲージ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ color: '#94a3b8' }}>あなたのHP:</span>
            <span style={{ fontWeight: 'bold', color: playerHp < pMaxHp * 0.3 ? '#f87171' : '#34d399' }}>
              {playerHp} / {pMaxHp}
            </span>
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
