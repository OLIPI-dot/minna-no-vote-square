import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from '../supabaseClient';
import { rollEnemy } from '../enemies';
import { ITEMS, getRarityColor, getRarityTextStyle, getRarityBadgeStyle, RARITY_CONFIG, getReqLevel, getItemEffectDescription, syncItemWithMaster } from '../items';

const RANDOM_EFFECT_MSGS = {
  regen: [
    "{item}の力で謎のエネルギーが湧き上がってきた！",
    "{item}のおかげでマイナスイオン的な何かが傷を癒やしていく！",
    "{item}から溢れる得体のしれないオーラで体力が回復した！"
  ],
  virus: [
    "敵は{item}の強烈な成分に当てられて苦しんでいる！",
    "{item}から放たれた謎のウイルスが敵の精神と肉体を蝕む！",
    "敵は{item}の毒素により継続ダメージを受けている！"
  ],
  lifesteal: [
    "{item}が敵の生命力（と財布の中身）を吸い取った！",
    "{item}を通じて、敵から強制的に養分を奪い取った！",
    "えげつない吸血攻撃！{item}が敵のHPを吸収した！"
  ],
  double_attack: [
    "{item}の軽快な動きで、怒涛の連続攻撃が発生！",
    "{item}による容赦ない追撃が敵を襲う！",
    "限界を超えたF5連打！{item}での連撃が炸裂した！"
  ],
  mental_damage: [
    "{item}のヤバすぎるオーラに、敵のメンタルが削られた！",
    "{item}による精神攻撃！敵はショックで動けない！",
    "敵は{item}を見て深いトラウマを思い出し、行動不能になった！"
  ],
  cringe: [
    "{item}のあまりの痛さに、敵はドン引きして動けなくなった...",
    "敵は{item}を見て「あっ、関わっちゃダメな奴だ」と察して固まっている！",
    "{item}が放つ異常な空気に耐えきれず、敵は言葉を失っている..."
  ],
  reflect: [
    "{item}の謎の力で、敵の攻撃を見事に跳ね返した！",
    "{item}の反射結界が発動！受けたダメージがそのまま跳ね返る！",
    "痛烈なカウンター！{item}がダメージを倍返しにした！"
  ],
  burn: [
    "{item}の力で大炎上が発生！！相手は火だるまだ！",
    "相手の過去の失言が{item}によって大拡散！大炎上している！",
    "{item}による激しいレスバ！相手のメンタルが燃え盛る！"
  ],
  double_edged: [
    "{item}の力を解放！しかし自分にも大きな反動が！",
    "炎上特攻！{item}による捨て身の攻撃が炸裂！",
    "{item}をオーバードーズ！限界突破の攻撃だが体が軋む！"
  ],
  cursed_power: [
    "{item}の呪いにより、防御を捨てた狂気の攻撃！",
    "{item}の承認欲求が暴走！リスク度外視のフルスイング！"
  ],
  dance: [
    "{item}のせいで、突然あなたと敵が一緒に踊り出した！",
    "なぜかBGMが変わった！{item}の影響で激しいダンスバトルが始まった！"
  ],
  apology: [
    "{item}のオーラに圧倒され、敵が急に土下座した！",
    "敵は{item}を見て自分が間違っていたと悟り、謝罪を始めた！"
  ],
  kusorep: [
    "{item}による長文クソリプが敵の思考を停止させた！",
    "{item}の「FF外から失礼します」で敵の攻撃の勢いが完全に死んだ！"
  ],
  tax_return: [
    "{item}を見て、敵は「確定申告やってない！」と思い出した！",
    "敵は{item}に領収書が挟まっているのを見て青ざめた！"
  ],
  mom_block: [
    "{item}の力で、敵の背後に『オカン』が召喚された！",
    "「あんた！いつまで起きてんの！」オカンの怒号が響き渡った！"
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
  if (item.effectMsg) return item.effectMsg;
  const list = RANDOM_EFFECT_MSGS[effectType];
  if (!list) return `【${item.name}】の力が発動した！`;
  return list[Math.floor(Math.random() * list.length)].replace('{item}', `【${item.name}】`);
};

const PatrolMiniGame = ({ 
  userLevel, 
  userExp, 
  levelInfo, 
  addExp, 
  equipment, 
  setEquipment, 
  addTickets, 
  gachaTickets, 
  inventory, 
  setInventory, 
  globalOnlineCount, 
  encounteredEnemies = [], 
  setEncounteredEnemies,
  user
}) => {
  const [battleState, setBattleState] = useState('idle'); // idle, battling, won, lost
  const [enemy, setEnemy] = useState(null);
  const [playerHp, setPlayerHp] = useState(0);
  const [enemyHp, setEnemyHp] = useState(0);
  const [battleLog, setBattleLog] = useState([]);
  const [dropItem, setDropItem] = useState(null);
  const [hasFoundKey, setHasFoundKey] = useState(false);
  const [lastEarnedExp, setLastEarnedExp] = useState(0);
  const [healCount, setHealCount] = useState(0); // 何回回復したか
  const [usedSos, setUsedSos] = useState(false); // 救援を呼んだか
  const [sosState, setSosState] = useState('idle'); // idle, voting, completed
  const [sosVotes, setSosVotes] = useState({ A: 0, B: 0, C: 0, D: 0 });
  const [sosTime, setSosTime] = useState(30);
  const [awakenBuff, setAwakenBuff] = useState(false); // 覚醒バフ: 次の攻撃の威力3倍
  const [enemyStatus, setEnemyStatus] = useState(null); // 'virus' など
  const [isHardMode, setIsHardMode] = useState(false);
  const [previewItem, setPreviewItem] = useState(null); // 🔍 タイムラインでタップしたアイテムの詳細表示用
  const timerRef = useRef(null);
  const botIntervalRef = useRef(null);
  const winProcessedRef = useRef(false);

  // 🎁 タイムラインのドロップ文字列からアイテム情報・地下の鍵を抽出
  const parseDropItems = (dropStr, dropData) => {
    if (!dropStr) return [];
    const items = [];

    const hasKey = typeof dropStr === 'string' && dropStr.includes('地下の鍵');
    let mainPart = typeof dropStr === 'string'
      ? dropStr.replace(/\s*\+\s*🗝️.*$/, '').replace(/🗝️\s*地下の鍵/, '').trim()
      : '';

    if (mainPart) {
      const cleanName = mainPart.replace(/\[(N|R|SR|UR|LR)\]\s*/i, '').trim();
      const found = dropData || ITEMS.find(i => i.name === cleanName || cleanName.includes(i.name) || (i.name && i.name.includes(cleanName)));
      if (found) {
        const synced = syncItemWithMaster ? syncItemWithMaster(found) : found;
        items.push({
          label: mainPart,
          item: synced,
          rarity: synced.rarity || 'N'
        });
      } else {
        items.push({
          label: mainPart,
          item: {
            name: cleanName,
            rarity: 'N',
            icon: '🎁',
            type: 'item',
            desc: '広場パトロールで獲得した貴重なアイテム。',
            atk: 0,
            def: 0,
            hp: 0
          },
          rarity: 'N'
        });
      }
    } else if (dropData) {
      const synced = syncItemWithMaster ? syncItemWithMaster(dropData) : dropData;
      items.push({
        label: `[${synced.rarity}] ${synced.name}`,
        item: synced,
        rarity: synced.rarity || 'N'
      });
    }

    if (hasKey) {
      items.push({
        label: '🗝️ 地下の鍵',
        item: {
          name: '地下の鍵',
          icon: '🗝️',
          rarity: 'SPECIAL',
          type: 'special',
          desc: '深層の地下パトロールに挑むための特別な鍵。本日の挑戦回数が +1 回回復し、さらに強力な敵や貴重な宝箱が眠る深層エリアへ潜入できます！',
          effect: '地下パトロール挑戦権 +1',
          effectMsg: '本日の地下パトロール挑戦回数が +1 回増えた！',
          atk: 0,
          def: 0,
          hp: 0
        },
        rarity: 'SPECIAL'
      });
    }

    return items;
  };

  // 1日のパトロール回数制限 (最大20回 - クラウドおよびローカルで同期)
  const getTodayPatrols = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    let localCount = 0;
    try {
      const data = JSON.parse(localStorage.getItem('daily_patrols_v3') || '{}');
      if (data.date === todayStr) localCount = data.count || 0;
    } catch { localCount = 0; }

    // ☁️ ログイン中の場合はクラウド（Supabase）の値をマスターとして優先同期
    if (user && user.user_metadata?.daily_patrol_date_v3 === todayStr) {
      const cloudCount = user.user_metadata?.daily_patrol_count_v3 ?? 0;
      try {
        localStorage.setItem('daily_patrols_v3', JSON.stringify({ date: todayStr, count: cloudCount }));
      } catch (e) {}
      return { date: todayStr, count: cloudCount };
    }

    return { date: todayStr, count: localCount };
  };
  const [patrolsToday, setPatrolsToday] = useState(() => getTodayPatrols().count);
  const MAX_PATROLS = 20; // 1日20回まで（たっぷり冒険！）

  // ユーザーのログイン状態が変化した時にも最新回数を反映
  useEffect(() => {
    const current = getTodayPatrols();
    setPatrolsToday(current.count);
    localStorage.setItem('daily_patrols_v3', JSON.stringify(current));
  }, [user]);

  // 📜 パトロール記録の履歴管理（パトロール専用・クラウド ＆ ローカル双方向同期）
  const sortPatrolHistoryDesc = (list) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      if (a.time && b.time) return b.time.localeCompare(a.time);
      return 0;
    });
  };

  const getPatrolHistory = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    let localHistory = [];
    try {
      const saved = localStorage.getItem('daily_patrol_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr && Array.isArray(parsed.history)) {
          // パトロール専用ログのみを抽出（レイド等と完全分離）
          localHistory = parsed.history.filter(p => !p.type || p.type === 'patrol');
        }
      }
    } catch (e) {}

    // ☁️ クラウドに保存された履歴があれば優先・統合
    const cloudData = user?.user_metadata?.daily_patrol_history_v1;
    if (cloudData && cloudData.date === todayStr && Array.isArray(cloudData.history)) {
      const combined = cloudData.history.filter(p => !p.type || p.type === 'patrol');
      localHistory.forEach(p => {
        if (!combined.some(c => c.time === p.time && c.enemyName === p.enemyName)) {
          combined.push(p);
        }
      });
      // 🌟 必ず新しい時間順（降順）にソートして最新50件を抽出！
      const sorted = sortPatrolHistoryDesc(combined).slice(0, 50);
      try {
        localStorage.setItem('daily_patrol_history_v1', JSON.stringify({
          date: todayStr,
          history: sorted
        }));
      } catch (e) {}
      return sorted;
    }

    return sortPatrolHistoryDesc(localHistory).slice(0, 50);
  };

  const [patrolHistory, setPatrolHistory] = useState(() => getPatrolHistory());

  const addPatrolHistoryRecord = (record) => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newRecord = { ...record, type: 'patrol', time: timeStr, timestamp: Date.now() };

    setPatrolHistory(prev => {
      const filtered = prev.filter(p => !p.type || p.type === 'patrol');
      const updated = sortPatrolHistoryDesc([newRecord, ...filtered]).slice(0, 50);
      const payload = {
        date: todayStr,
        history: updated
      };

      try {
        localStorage.setItem('daily_patrol_history_v1', JSON.stringify(payload));
      } catch (e) {}

      // ☁️ クラウド（Supabase user_metadata）へ即時バックアップ！
      if (user && supabase) {
        supabase.auth.updateUser({
          data: {
            daily_patrol_history_v1: payload
          }
        }).catch(err => console.warn('Cloud sync error for patrol history:', err));
      }

      return updated;
    });
  };

  // ユーザーのログイン情報やロビー待機画面復帰時に最新の履歴を同期
  useEffect(() => {
    setPatrolHistory(getPatrolHistory());
  }, [user, battleState]);

  // ローカルに記録があってクラウドにない場合、自動でクラウドへ同期
  useEffect(() => {
    if (!user || !supabase) return;
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const cloudData = user.user_metadata?.daily_patrol_history_v1;
    try {
      const saved = localStorage.getItem('daily_patrol_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === todayStr && Array.isArray(parsed.history) && parsed.history.length > 0) {
          if (!cloudData || cloudData.date !== todayStr || (cloudData.history?.length || 0) < parsed.history.length) {
            supabase.auth.updateUser({
              data: {
                daily_patrol_history_v1: parsed
              }
            }).catch(console.warn);
          }
        }
      }
    } catch (e) {}
  }, [user]);

  const equipSlots = ['weapon', 'armor', 'accessory', 'partner'];
  const pMaxHp = (userLevel * 10 + 100) + equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.hp || 0), 0);
  const pAtk = (userLevel * 5 + 10) + equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.atk || 0), 0);
  const pDef = (userLevel * 2) + equipSlots.reduce((sum, s) => sum + (equipment?.[s]?.def || 0), 0);

  const startPatrol = (hardMode = false) => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const currentData = getTodayPatrols();
    if (currentData.count >= MAX_PATROLS) {
      setPatrolsToday(currentData.count);
      return;
    }
    
    // 回数消費
    const newCount = currentData.count + 1;
    localStorage.setItem('daily_patrols_v3', JSON.stringify({ date: todayStr, count: newCount }));
    setPatrolsToday(newCount);

    if (user) {
      supabase.auth.updateUser({
        data: {
          daily_patrol_date_v3: todayStr,
          daily_patrol_count_v3: newCount
        }
      });
    }

    // 敵の抽選
    const newEnemy = rollEnemy(userLevel || 1);
    
    if (hardMode) {
      newEnemy.name = `【深層】${newEnemy.name}`;
      newEnemy.level = Math.round((newEnemy.level || userLevel) * 1.3 + 5);
      newEnemy.hp = Math.round(newEnemy.hp * 2.5);
      newEnemy.atk = Math.round(newEnemy.atk * 1.35);
      if (newEnemy.def < 9000) {
        newEnemy.def = Math.round(newEnemy.def * 1.15);
      }
    }
    
    setIsHardMode(hardMode);
    setEnemy(newEnemy);
    setEnemyHp(newEnemy.hp);
    setPlayerHp(pMaxHp); // 修正: 追加
    
    // 図鑑に追加
    if (setEncounteredEnemies && !encounteredEnemies.includes(newEnemy.id)) {
      setEncounteredEnemies(prev => [...prev, newEnemy.id]);
    }
    winProcessedRef.current = false;
    setLastEarnedExp(0);
    setDropItem(null);
    setHasFoundKey(false);
    setHealCount(0);
    setUsedSos(false);
    setSosState('idle');
    setSosVotes({ A: 0, B: 0, C: 0, D: 0 });
    setSosTime(30);
    setAwakenBuff(false);
    setEnemyStatus(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    
    let logs = [`🚓 パトロール中...`, `⚠️ 【Lv.${newEnemy.level || 1} ${newEnemy.name}】 に遭遇した！`];
    if (hardMode) {
      logs.unshift(`🌐 深層ウェブへ接続中... まわりの空気が異常に重い。`);
    }
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

    // 🔍 特定の効果を持っているすべての装備を取得（古いセーブデータ対応 & レアリティ付与）
    const getEffectSources = (eff) => {
      const sources = [];
      ['weapon', 'armor', 'accessory', 'partner'].forEach(slot => {
        const item = equipment?.[slot];
        if (item) {
          const matchedItem = ITEMS.find(i => (item.id && i.id === String(item.id).split('_')[0]) || i.name === item.name);
          const itemEff = item.effect || matchedItem?.effect;
          const itemRarity = item.rarity || matchedItem?.rarity || 'N';
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

    // 確率の重複足し算（上限キャップ付き）
    const getEffectChance = (eff, baseRate, maxCap = 0.50) => {
      const count = getEffectCount(eff);
      if (count === 0) return 0;
      return Math.min(maxCap, baseRate * count);
    };

    // 重複時のログバッジ装飾（例: "【精神攻撃×2】"）
    const getStackLabel = (eff, label) => {
      const count = getEffectCount(eff);
      return count > 1 ? `【${label}×${count}】` : `【${label}】`;
    };

    // 💼 【買収: buyout】ターン開始時10%で即勝利（重複で+10%、最大30%）
    const buyoutItem = getEffectSource('buyout');
    const buyoutChance = getEffectChance('buyout', 0.10, 0.30);
    if (buyoutItem && Math.random() < buyoutChance) {
      newLogs.push(`💼 ${getStackLabel('buyout', '買収')} ${getEffectMsg('buyout', buyoutItem)}`);
      newLogs.push(`🎉 （買収完了） 【${enemy.name}】 は大金を手にして帰っていった...`);
      setEnemyHp(0);
      setPlayerHp(currentPlayerHp);
      setBattleLog(newLogs);
      handleWin(enemy);
      return;
    }

    // ✨ 【自動回復: regen】ターンの開始時に回復（N:3%, R:5%, SR:10%, UR:15%）
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

    // 🦠 【ウイルス: virus】（N:3%, R:5%, SR:10%, UR:15%）
    if (enemyStatus === 'virus') {
      const virusRate = getEffectRarityTotal('virus', { N: 0.03, R: 0.05, SR: 0.10, UR: 0.15 }, 0.05, 0.25) || 0.05;
      const virusDmg = Math.max(3, Math.floor(enemy.hp * virusRate));
      currentEnemyHp = Math.max(0, currentEnemyHp - virusDmg);
      newLogs.push(`🦠 【毒素】 謎のウイルスが敵を蝕む... ${virusDmg} のダメージ！`);
      if (currentEnemyHp === 0) {
        newLogs.push(`🎉 毒により敵は力尽きた... 【${enemy.name}】 を撃退した！`);
        setEnemyHp(0);
        setPlayerHp(currentPlayerHp);
        setBattleLog(newLogs);
        handleWin(enemy);
        return;
      }
    }

    // 🔥 【大炎上: burn】（R:8%, SR:15%, UR:20%）
    if (enemyStatus === 'burn') {
      const burnRate = getEffectRarityTotal('burn', { N: 0.05, R: 0.08, SR: 0.15, UR: 0.20 }, 0.08, 0.30) || 0.08;
      const burnDmg = Math.max(5, Math.floor(enemy.hp * burnRate));
      currentEnemyHp = Math.max(0, currentEnemyHp - burnDmg);
      newLogs.push(`🔥 【大炎上】 敵は炎上して燃え盛っている！ ${burnDmg} のダメージ！`);
      if (currentEnemyHp === 0) {
        newLogs.push(`🎉 炎上により敵は社会的に抹殺された... 【${enemy.name}】 を撃退した！`);
        setEnemyHp(0);
        setPlayerHp(currentPlayerHp);
        setBattleLog(newLogs);
        handleWin(enemy);
        return;
      }
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
          newLogs.push(`🎉 敵は誤爆のショックに耐えきれず消滅した... 【${enemy.name}】 を撃退した！`);
          setEnemyHp(0);
          setPlayerHp(currentPlayerHp);
          setBattleLog(newLogs);
          handleWin(enemy);
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

    // 🎲 お互いの命中率と会心判定（レアリティ別ボーナス合算・上限キャップ付き）
    const critBonus = getEffectRarityTotal('crit_up', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.50);
    let basePCrit = 0.10 + critBonus;
    let pMiss = Math.random() < 0.05; // 5% ミス
    
    // 呪われた力（cursed_power）: 会心率大幅アップだが、ミスしなくなる代わりに防御関係にペナルティ
    const cursedItem = getEffectSource('cursed_power');
    if (cursedItem) {
      basePCrit = 0.50; // 50%で会心
      pMiss = false;    // ミスしない
    }

    // 📣 【お供の応援: partner_cheer】会心率アップ
    const cheerItem = getEffectSource('partner_cheer');
    if (cheerItem) {
      basePCrit += 0.20;
      newLogs.push(`📣 【応援】 ${getEffectMsg('partner_cheer', cheerItem)}`);
    }
    
    // 🤞 【領域展開: domain_expansion】 必中＆確定会心の結界（R:8%, SR:15%, UR:25%）
    const domainItem = getEffectSource('domain_expansion');
    const domainChance = getEffectRarityTotal('domain_expansion', { R: 0.08, SR: 0.15, UR: 0.25 }, 0.12, 0.40);
    let isDomainActive = false;
    if (domainItem && Math.random() < domainChance) {
      isDomainActive = true;
      pMiss = false; // 術式必中
      newLogs.push(`🤞 ${getStackLabel('domain_expansion', '領域展開')} 「領域展開――！」 周囲に不可避の結界が構築された！`);
      newLogs.push(`✨ （術式必中効果） あなたの攻撃は必中かつ確定会心の一撃となる！`);
    }

    const pCrit = isDomainActive || (Math.random() < Math.min(0.70, basePCrit));

    const dodgeBonus = getEffectRarityTotal('dodge_up', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.50);
    const gigaBonus = getEffectRarityTotal('giga_death', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
    let baseEMiss = 0.05 + dodgeBonus + gigaBonus;
    const stealthItem = getEffectSource('stealth');
    if (stealthItem) {
      const stealthBonus = getRarityRate(stealthItem, { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10);
      baseEMiss = Math.min(0.60, baseEMiss + stealthBonus);
    }
    
    const eMiss = Math.random() < baseEMiss; 
    let ePainful = Math.random() < (enemy.type === 'rare' ? 0.15 : 0.05);
    if (cursedItem) ePainful = Math.random() < 0.20; // 呪われていると敵の痛恨率が20%に上昇

    const attentionItem = getEffectSource('attention_seeker');
    if (attentionItem) {
      basePCrit = 0.50;
      ePainful = true; // 注目を集めるので敵の攻撃が必ず痛恨になる
    }

    let isEnemyStunned = false;

    // 📱 【レスバトラー見習い: partner_kusorep】たまにスタンさせる
    const kusorepPartner = getEffectSource('partner_kusorep');
    if (kusorepPartner && Math.random() < 0.15) {
      isEnemyStunned = true;
      newLogs.push(`📱 【クソリプ】 ${getEffectMsg('partner_kusorep', kusorepPartner)} 敵は怒りでフリーズした！`);
    }

    // 🧍 【野次馬: partner_stare】ただ見てるだけ
    const starePartner = getEffectSource('partner_stare');
    if (starePartner && Math.random() < 0.2) {
      newLogs.push(`🧍 【野次馬】 ${getEffectMsg('partner_stare', starePartner)}`);
    }

    let skipPlayerAttack = false;

    // 🕺 【謎の踊り: dance】 15%の確率で発動 (攻撃フェーズスキップ、お互い回復)
    const danceItem = getEffectSource('dance');
    if (currentEnemyHp > 0 && danceItem && Math.random() < 0.15) {
      skipPlayerAttack = true;
      const pHeal = Math.floor(pMaxHp * 0.1);
      const eHeal = Math.floor(enemy.hp * 0.1);
      currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + pHeal);
      currentEnemyHp = Math.min(enemy.hp, currentEnemyHp + eHeal);
      newLogs.push(`🕺 【謎の踊り】 ${getEffectMsg('dance', danceItem)} (お互いのHPが少し回復した)`);
    }

    // 🗡️ プレイヤーの攻撃フェーズ
    if (!skipPlayerAttack) {
      if (pMiss) {
        newLogs.push(`💨 あなたの攻撃... しかし【${enemy.name}】に避けられた！`);
      } else {
      const calcDamage = () => {
        let actualEnemyDef = enemy.def;
        
        // 💻 【ハッカー/特定班】 防御力0化
        const hackItem = getEffectSource('partner_hack') || getEffectSource('partner_expose');
        if (hackItem && Math.random() < 0.3) {
          actualEnemyDef = 0;
          newLogs.push(`💻 【解析】 ${getEffectMsg(getEffectSource('partner_hack') ? 'partner_hack' : 'partner_expose', hackItem)} (敵の防御力が0になった！)`);
        }

        // 🐰 メタル系（DEF 9000以上）は通常1〜2ダメージ！
        if (actualEnemyDef >= 9000) {
          return Math.random() < 0.3 ? 2 : 1;
        }

        // 通常モンスターで攻撃力が防御力に負けている場合（カチカチに弾かれて1〜3ダメ！）
        if (pAtk <= actualEnemyDef) {
          return Math.floor(Math.random() * 3) + 1;
        }

        // 通常計算（攻撃力 - 防御力 ± 乱数20%）
        let dmg = pAtk - actualEnemyDef;
        const variance = 1.0 + (Math.random() * 0.4 - 0.2);
        dmg = Math.floor(dmg * variance);
        return Math.max(1, dmg);
      };

      let dmgToEnemy = calcDamage();
      
      // 諸刃の剣（double_edged）、残業（overwork）、コラボ（partner_collab）
      const doubleEdgedItem = getEffectSource('double_edged');
      const overworkItem = getEffectSource('overwork');
      const collabItem = getEffectSource('partner_collab');
      
      if (doubleEdgedItem || collabItem) {
        dmgToEnemy = Math.floor(dmgToEnemy * 2.0);
      } else if (overworkItem) {
        dmgToEnemy = Math.floor(dmgToEnemy * 3.0); // 3倍
      }
      
      if (pCrit) {
        // ⚡ 会心の一撃！メタル系なら一撃必殺の大ダメージ、通常敵も防御貫通の大打撃！
        if (enemy.def >= 9000) {
          dmgToEnemy = Math.max(50, Math.floor(pAtk * 2.5));
        } else {
          dmgToEnemy = Math.max(Math.floor(pAtk * 2.0), Math.floor(dmgToEnemy * 2.5));
        }
      }

      // 📈 【覚醒バフ】 救援アンケートで獲得したバフ。次に命中する攻撃の威力が3倍になる
      if (awakenBuff) {
        dmgToEnemy = dmgToEnemy * 3;
        setAwakenBuff(false);
        newLogs.push(`📈 【覚醒バフ発動】 みんなの力が剣に宿る！威力3倍の一撃！`);
      }

      // 📝 【現実改変: rewrite_reality】 攻撃時15%で敵のHPを強制半減
      const rewriteItem = getEffectSource('rewrite_reality');
      if (rewriteItem && Math.random() < 0.15) {
        const halfHp = Math.floor(currentEnemyHp / 2);
        dmgToEnemy += halfHp;
        newLogs.push(`📝 【改変】 ${getEffectMsg('rewrite_reality', rewriteItem)}`);
      }

      currentEnemyHp = Math.max(0, currentEnemyHp - dmgToEnemy);
      
      if (doubleEdgedItem || overworkItem || collabItem) {
        const effItem = collabItem || doubleEdgedItem || overworkItem;
        const effType = collabItem ? 'partner_collab' : (doubleEdgedItem ? 'double_edged' : 'overwork');
        newLogs.push(pCrit 
          ? `⚡ 会心の一撃！！！ ${getEffectMsg(effType, effItem)} ${dmgToEnemy} の大ダメージ！` 
          : `💥 ${getEffectMsg(effType, effItem)} ${dmgToEnemy} のダメージ！`);
          
        const recoil = doubleEdgedItem ? Math.floor(pMaxHp * 0.15) : Math.floor(pMaxHp * 0.25);
        currentPlayerHp = Math.max(0, currentPlayerHp - recoil);
        newLogs.push(`🩸 【反動】 ${collabItem ? 'コラボの炎上で' : '捨て身の攻撃で'} あなたも ${recoil} のダメージを受けた！`);
        if (currentPlayerHp === 0) {
            newLogs.push(`💀 目の前が真っ暗になった... 力尽きた。`);
            setPlayerHp(0);
            setEnemyHp(currentEnemyHp);
            setBattleLog(newLogs);
            setBattleState('lost');
            return;
        }
      } else {
        newLogs.push(pCrit 
          ? `⚡ 会心の一撃！！！ ${dmgToEnemy} の大ダメージ！` 
          : `🗡️ あなたの攻撃！ ${dmgToEnemy} のダメージ！`);
      }

      // 💴 【札束ビンタ: money_slap】 20%で確定スタン付与（重複で+20%、最大50%）
      const moneySlapItem = getEffectSource('money_slap');
      const moneySlapChance = getEffectChance('money_slap', 0.20, 0.50);
      if (currentEnemyHp > 0 && moneySlapItem && Math.random() < moneySlapChance) {
        isEnemyStunned = true;
        newLogs.push(`💴 ${getStackLabel('money_slap', '札束')} ${getEffectMsg('money_slap', moneySlapItem)}`);
      }

      // 🩸 【吸血: lifesteal】（N:10%/15%, R:15%/25%, SR:25%/40%, UR:35%/50%）
      const lifestealItem = getEffectSource('lifesteal');
      const lifestealChance = getEffectRarityTotal('lifesteal', { N: 0.10, R: 0.15, SR: 0.25, UR: 0.35 }, 0.15, 0.60);
      if (currentEnemyHp > 0 && lifestealItem && Math.random() < lifestealChance) {
        const drainRate = getEffectRarityTotal('lifesteal', { N: 0.15, R: 0.25, SR: 0.40, UR: 0.50 }, 0.25, 0.60);
        const drain = Math.max(1, Math.floor(dmgToEnemy * drainRate));
        currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + drain);
        newLogs.push(`🩸 ${getStackLabel('lifesteal', '吸収')} ${getEffectMsg('lifesteal', lifestealItem)} (HP +${drain})`);
      }

      // ⚔️ 【二刀流: double_attack】（N:10%/40%, R:15%/60%, SR:30%/80%, UR:40%/100%）
      const doubleItem = getEffectSource('double_attack');
      const doubleChance = getEffectRarityTotal('double_attack', { N: 0.10, R: 0.15, SR: 0.30, UR: 0.40 }, 0.15, 0.60);
      if (currentEnemyHp > 0 && doubleItem && Math.random() < doubleChance) {
        const doubleDmgRate = getEffectRarityTotal('double_attack', { N: 0.40, R: 0.60, SR: 0.80, UR: 1.00 }, 0.60, 1.00);
        let secondDmg = Math.max(1, Math.floor(calcDamage() * doubleDmgRate));
        currentEnemyHp = Math.max(0, currentEnemyHp - secondDmg);
        newLogs.push(`⚔️ ${getStackLabel('double_attack', '連撃')} ${getEffectMsg('double_attack', doubleItem)} ${secondDmg} の追加ダメージ！`);
      }

      // 🚀 【バズ: viral_hit】 20%の確率で大量の追撃（重複で+20%、最大60%）
      const viralItem = getEffectSource('viral_hit');
      const viralChance = getEffectChance('viral_hit', 0.20, 0.60);
      if (currentEnemyHp > 0 && viralItem && Math.random() < viralChance) {
        let multiDmg = Math.floor(calcDamage() * 1.5); 
        currentEnemyHp = Math.max(0, currentEnemyHp - multiDmg);
        newLogs.push(`🚀 ${getStackLabel('viral_hit', '炎上')} ${getEffectMsg('viral_hit', viralItem)} ${multiDmg} の追加ダメージ！`);
      }

      // 🔨 【BAN: ban】または【ブロック: block】（N:1%, R:2%, SR:5%, UR:8% 最大15%）
      const banItem = getEffectSource('ban') || getEffectSource('block');
      const banChance = getEffectRarityTotal('ban', { N: 0.01, R: 0.02, SR: 0.05, UR: 0.08 }, 0.02, 0.15)
        + getEffectRarityTotal('block', { N: 0.01, R: 0.02, SR: 0.05, UR: 0.08 }, 0.02, 0.15);
      if (currentEnemyHp > 0 && banItem && Math.random() < Math.min(0.20, banChance)) {
        const isBan = getEffectSource('ban');
        newLogs.push(`🚫 【追放】 ${getEffectMsg(isBan ? 'ban' : 'block', banItem)}`);
        currentEnemyHp = 0;
      }

      // 💀 【精神崩壊: mental_damage】（N:5%, R:8%, SR:15%, UR:20%）
      const mentalItem = getEffectSource('mental_damage');
      const mentalChance = getEffectRarityTotal('mental_damage', { N: 0.05, R: 0.08, SR: 0.15, UR: 0.20 }, 0.08, 0.40);
      if (currentEnemyHp > 0 && mentalItem && Math.random() < mentalChance) {
        isEnemyStunned = true;
        newLogs.push(`💀 ${getStackLabel('mental_damage', '混乱')} ${getEffectMsg('mental_damage', mentalItem)}`);
      }

      // 🦠 【ウイルス付与: virus】（N:10%, R:15%, SR:25%, UR:35%）
      const virusItem = getEffectSource('virus');
      const virusChance = getEffectRarityTotal('virus', { N: 0.10, R: 0.15, SR: 0.25, UR: 0.35 }, 0.15, 0.60);
      if (currentEnemyHp > 0 && virusItem && enemyStatus !== 'virus') {
        if (Math.random() < virusChance) {
          setEnemyStatus('virus');
          newLogs.push(`💉 ${getStackLabel('virus', '感染源')} ${getEffectMsg('virus', virusItem)}`);
        }
      }

      // 🔥 【大炎上付与: burn】（N:10%, R:15%, SR:25%, UR:35%）
      const burnItem = getEffectSource('burn');
      const burnChance = getEffectRarityTotal('burn', { N: 0.10, R: 0.15, SR: 0.25, UR: 0.35 }, 0.15, 0.60);
      if (currentEnemyHp > 0 && burnItem && enemyStatus !== 'burn') {
        if (Math.random() < burnChance) {
          setEnemyStatus('burn');
          newLogs.push(`🔥 ${getStackLabel('burn', '発火')} ${getEffectMsg('burn', burnItem)}`);
        }
      }

      // 😰 【ドン引き: cringe】（N:3%, R:5%, SR:10%, UR:15%）
      const cringeItem = getEffectSource('cringe');
      const cringeChance = getEffectRarityTotal('cringe', { N: 0.03, R: 0.05, SR: 0.10, UR: 0.15 }, 0.05, 0.25);
      if (currentEnemyHp > 0 && cringeItem && Math.random() < cringeChance) {
        isEnemyStunned = true;
        newLogs.push(`😰 ${getStackLabel('cringe', 'ドン引き')} ${getEffectMsg('cringe', cringeItem)}`);
      }

      // 🍜 【飯テロ: meshitero】（N:5%, R:10%, SR:20%, UR:25%）
      const meshiteroItem = getEffectSource('meshitero');
      const meshiteroChance = getEffectRarityTotal('meshitero', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
      if (currentEnemyHp > 0 && meshiteroItem && Math.random() < meshiteroChance) {
        isEnemyStunned = true;
        newLogs.push(`🍜 ${getStackLabel('meshitero', '飯テロ')} 深夜の特製背脂ニンニクマシマシ画像を投下！ 敵はお腹を押さえて動けなくなった！`);
      }
      } // elseの閉じを追加
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
    let skipEnemyAttack = false;

    // 🙇 【突然の謝罪: apology】 敵攻撃前に20%で発動（重複で+15%、最大45%）
    const apologyItem = getEffectSource('apology');
    const apologyChance = getEffectChance('apology', 0.20, 0.45);
    if (apologyItem && Math.random() < apologyChance) {
      skipEnemyAttack = true;
      const selfDmg = Math.floor(enemy.hp * 0.15);
      currentEnemyHp = Math.max(0, currentEnemyHp - selfDmg);
      newLogs.push(`🙇 ${getStackLabel('apology', '謝罪')} ${getEffectMsg('apology', apologyItem)}`);
      newLogs.push(`🩸 敵はあまりの申し訳なさに自傷し、${selfDmg} のダメージを受けた！`);
      
      if (currentEnemyHp === 0) {
        newLogs.push(`🎉 敵は謝罪しながら消滅した... 【${enemy.name}】 を撃退した！`);
        setEnemyHp(0);
        setPlayerHp(currentPlayerHp);
        setBattleLog(newLogs);
        handleWin(enemy);
        return;
      }
    }

    // 🧾 【突然の確定申告: tax_return】 敵攻撃前に10%で発動（重複で+10%、最大25%）
    const taxItem = getEffectSource('tax_return');
    const taxChance = getEffectChance('tax_return', 0.10, 0.25);
    if (!skipEnemyAttack && taxItem && Math.random() < taxChance) {
      newLogs.push(`🧾 ${getStackLabel('tax_return', '確定申告')} ${getEffectMsg('tax_return', taxItem)}`);
      newLogs.push(`💨 敵は税務署へと全力で走り去っていった... (不戦勝)`);
      setEnemyHp(0);
      setPlayerHp(currentPlayerHp);
      setBattleLog(newLogs);
      handleWin(enemy);
      return;
    }

    // 🚨 【通報: report】 敵攻撃前に15%で発動し、スタンさせる（重複で+15%、最大45%）
    const reportItem = getEffectSource('report');
    const reportChance = getEffectChance('report', 0.15, 0.45);
    if (!skipEnemyAttack && reportItem && Math.random() < reportChance) {
      isEnemyStunned = true;
      newLogs.push(`🚨 ${getStackLabel('report', '通報')} ${getEffectMsg('report', reportItem)}`);
    }

    // 💬 【既読スルー: kidoku_ignore】 敵攻撃を完全無視＆敵モヤモヤ自傷（N:5%, R:10%, SR:20%, UR:25%）
    const kidokuItem = getEffectSource('kidoku_ignore');
    const kidokuChance = getEffectRarityTotal('kidoku_ignore', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
    if (!skipEnemyAttack && kidokuItem && Math.random() < kidokuChance) {
      skipEnemyAttack = true;
      const moyamoyaDmg = Math.max(5, Math.floor(enemy.hp * 0.08));
      currentEnemyHp = Math.max(0, currentEnemyHp - moyamoyaDmg);
      newLogs.push(`💬 ${getStackLabel('kidoku_ignore', '既読スルー')} 敵の攻撃を既読のまま放置した！`);
      newLogs.push(`🌀 敵は「返信まだかな…」とモヤモヤして自傷し、${moyamoyaDmg} のダメージを受けた！`);
      if (currentEnemyHp === 0) {
        newLogs.push(`🎉 敵は既読無視の絶望に耐えきれず消滅した... 【${enemy.name}】 を撃退した！`);
        setEnemyHp(0);
        setPlayerHp(currentPlayerHp);
        setBattleLog(newLogs);
        handleWin(enemy);
        return;
      }
    }

    if (isEnemyStunned) {
      newLogs.push(`... 【${enemy.name}】 は虚空を見つめている。`);
    } else if (skipEnemyAttack) {
      // 謝罪等でスキップ済み
    } else if (eMiss) {
      const gigaItem = getEffectSource('giga_death');
      if (gigaItem && Math.random() < 0.60) {
        newLogs.push(`📶 【通信制限】 敵はギガ死（128kbps）でカクついて攻撃が間に合わなかった！`);
      } else {
        newLogs.push(`💨 敵の反撃... しかしあなたはヒョイッと避けた！`);
      }
    } else {
      // ⚡ 敵の固有スキル判定（所持していれば約30%の確率で発動）
      const enemySkills = enemy.skills || [];
      const usedSkill = (enemySkills.length > 0 && Math.random() < 0.30)
        ? enemySkills[Math.floor(Math.random() * enemySkills.length)]
        : null;

      if (usedSkill) {
        newLogs.push(`⚡ 【${enemy.name}】 の 『${usedSkill.name}』！`);
        if (usedSkill.msg) {
          newLogs.push(`💬 ${usedSkill.msg}`);
        }
      }

      if (usedSkill?.type === 'idle') {
        newLogs.push(`...しかし 何も起こらなかった！`);
      } else if (usedSkill?.type === 'heal') {
        const healAmt = Math.max(10, Math.floor(enemy.hp * (usedSkill.rate || 0.25)));
        currentEnemyHp = Math.min(enemy.hp, currentEnemyHp + healAmt);
        newLogs.push(`✨ 【${enemy.name}】 のHPが ${healAmt} 回復した！`);
      } else {
        const skillMult = usedSkill?.multiplier || 1.0;
        let dmgToPlayer = enemy.atk - pDef;
        const variance = 1.0 + (Math.random() * 0.4 - 0.2);
        dmgToPlayer = Math.floor(dmgToPlayer * variance * skillMult);
        const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2 * skillMult));
        if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;
        
        // 🎧 【ハイレゾ完全回避: hires】 35%で敵の攻撃を完全察知・回避
        const hiresItem = getEffectSource('hires');
        if (hiresItem && Math.random() < 0.35) {
          newLogs.push(`🎧 【ハイレゾ】 ${getEffectMsg('hires', hiresItem)}`);
          dmgToPlayer = 0;
        }

        // 👀 【手刀見切り: sharp_eye】 「おれでなきゃ見逃しちゃうね」 カウンター反撃（N:5%, R:10%, SR:20%, UR:25%）
        const sharpEyeItem = getEffectSource('sharp_eye');
        const sharpEyeChance = getEffectRarityTotal('sharp_eye', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.25 }, 0.10, 0.40);
        if (dmgToPlayer > 0 && sharpEyeItem && Math.random() < sharpEyeChance) {
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
            handleWin(enemy);
            return;
          }
        }

        // 👵 【お母さん乱入: mom_block】 痛恨の一撃時、50%の確率で発動
        const momItem = getEffectSource('mom_block');
        if (ePainful && momItem && Math.random() < 0.5) {
          newLogs.push(`🩸 痛恨の一撃が来る......！！！！`);
          newLogs.push(`👵 【オカン乱入】 ${getEffectMsg('mom_block', momItem)}`);
          newLogs.push(`💀 敵は恥ずかしさのあまり顔を真っ赤にして即死した！！`);
          setEnemyHp(0);
          setPlayerHp(currentPlayerHp);
          setBattleLog(newLogs);
          handleWin(enemy);
          return;
        }
        
        // 📜 【クソリプ防御: kusorep】 被弾時発動（N:5%, R:10%, SR:20%, UR:30%）
        const kusorepItem = getEffectSource('kusorep');
        const kusorepChance = getEffectRarityTotal('kusorep', { N: 0.05, R: 0.10, SR: 0.20, UR: 0.30 }, 0.10, 0.50);
        const privilegeItem = getEffectSource('privilege');
        const privilegeChance = getEffectChance('privilege', 0.25, 0.50);
        const lockItem = getEffectSource('lock_account');
        const lawItem = getEffectSource('partner_law');
        
        if (kusorepItem && Math.random() < kusorepChance) {
          dmgToPlayer = 1;
          newLogs.push(`📜 ${getStackLabel('kusorep', 'クソリプ')} ${getEffectMsg('kusorep', kusorepItem)}`);
          newLogs.push(`💥 敵の攻撃！ しかし クソリプのせいで 1 のダメージしか受けなかった！`);
        } else if (privilegeItem && Math.random() < privilegeChance) {
          dmgToPlayer = 0;
          newLogs.push(`👑 ${getStackLabel('privilege', '特権')} ${getEffectMsg('privilege', privilegeItem)}`);
          newLogs.push(`💥 敵の攻撃！ しかし ダメージは完全に無効化された！`);
        } else {
          if (ePainful) dmgToPlayer = Math.floor(dmgToPlayer * 2.5);
          
          if (lockItem) {
            const lockCut = getEffectRarityTotal('lock_account', { N: 0.05, R: 0.10, SR: 0.15, UR: 0.20 }, 0.10, 0.30);
            dmgToPlayer = Math.max(1, Math.floor(dmgToPlayer * (1.0 - lockCut)));
            newLogs.push(`🔒 【鍵垢】 ${getEffectMsg('lock_account', lockItem)} (ダメージ${Math.round(lockCut * 100)}%軽減)`);
          } else if (lawItem && Math.random() < 0.5) {
            dmgToPlayer = Math.floor(dmgToPlayer * 0.5); // 50%カット
            newLogs.push(`👨‍⚖️ 【異議あり】 ${getEffectMsg('partner_law', lawItem)} (ダメージ半減)`);
          }
          
          currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
          if (usedSkill) {
            newLogs.push(ePainful 
              ? `🩸 痛恨のスキル撃！！ 『${usedSkill.name}』 の猛撃で ${dmgToPlayer} の大ダメージを受けた！` 
              : `💥 『${usedSkill.name}』 が直撃！ ${dmgToPlayer} のダメージを受けた！`);
          } else {
            newLogs.push(ePainful 
              ? `🩸 痛恨の一撃！！！ 敵の猛攻で ${dmgToPlayer} の大ダメージを受けた！` 
              : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);
          }

          // 🩸 ドレイン技の場合の吸収回復
          if (usedSkill?.type === 'drain' && dmgToPlayer > 0) {
            const drainAmt = Math.min(dmgToPlayer, enemy.hp - currentEnemyHp);
            if (drainAmt > 0) {
              currentEnemyHp += drainAmt;
              newLogs.push(`🩸 【${enemy.name}】 は活力を吸い取って ${drainAmt} 回復した！`);
            }
          }
        }
          
        // 🪞 【ダメージ反射: reflect】 30%で発動（重複で+15%、最大60%）
        const reflectItem = getEffectSource('reflect');
        const reflectChance = getEffectChance('reflect', 0.30, 0.60);
        if (currentPlayerHp > 0 && reflectItem && Math.random() < reflectChance) {
          const refDmg = Math.floor(dmgToPlayer * 1.5);
          currentEnemyHp = Math.max(0, currentEnemyHp - refDmg);
          newLogs.push(`🪞 ${getStackLabel('reflect', '反射')} ${getEffectMsg('reflect', reflectItem)} 敵に ${refDmg} の大ダメージ！`);
        }
      }
    }

    // 🧔 【論破王: partner_debate】 敵ターン終了時に追撃
    const debateItem = getEffectSource('partner_debate');
    if (currentEnemyHp > 0 && debateItem) {
      const debateDmg = Math.max(10, Math.floor(enemy.hp * 0.15));
      currentEnemyHp = Math.max(0, currentEnemyHp - debateDmg);
      newLogs.push(`🧔 【論破】 ${getEffectMsg('partner_debate', debateItem)} (精神ダメージ ${debateDmg}！)`);
    }

    // 反射や追撃で敵が死んだかチェック
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
      addPatrolHistoryRecord({
        enemyName: enemy?.name || '未知の敵',
        enemyIcon: enemy?.icon || '👾',
        enemyType: enemy?.type,
        level: enemy?.level || userLevel,
        isHardMode,
        result: 'lost',
        exp: 0,
        tickets: 0,
        dropItem: null
      });
      return;
    }

    setEnemyHp(currentEnemyHp);
    setPlayerHp(currentPlayerHp);
    setBattleLog(newLogs);
  };

  const handleHeal = () => {
    if (battleState !== 'battling') return;

    if (playerHp >= pMaxHp) {
      setBattleLog(prev => [...prev, `💡 HPはすでに満タンです！`]);
      return;
    }
    
    if (healCount > 0) {
      if (gachaTickets < 1) return;
      addTickets(-1); // 2回目以降はガチャチケ消費
    }
    
    setHealCount(prev => prev + 1);
    
    const healAmount = Math.max(20, Math.floor(pMaxHp * 0.4)); // 40%しっかり回復！
    const newHp = Math.min(pMaxHp, playerHp + healAmount);
    
    let newLogs = [...battleLog, healCount === 0 
      ? `💊 応急手当！ HPが ${healAmount} 回復した！（即時発動・ターン消費なし✨）` 
      : `🎫 チケット消費！ HPが ${healAmount} 回復した！（即時発動✨）`];
    
    setPlayerHp(newHp);
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
          if (timerRef.current) clearInterval(timerRef.current);
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
    if (sosState === 'completed') return;
    
    setSosState('completed');
    
    // 開票集計
    let maxVotes = -1;
    let winner = 'A';
    Object.entries(sosVotes).forEach(([key, val]) => {
      if (val > maxVotes) { maxVotes = val; winner = key; }
    });

    let currentEnemyHp = enemyHp;
    let currentPlayerHp = playerHp;
    let isWin = false;
    let effectMsg = '';

    // ⚖️ バランス調整: 「パネルをめくれば勝てる」を防ぐため、効果は最大HPの30〜50%ダメージ程度に抑える
    const panelDamage = (ratio) => Math.max(0, currentEnemyHp - Math.floor(enemy.hp * ratio));

    if (winner === 'A') {
      // 究極魔法アルテマ（最大HPの50%）
      effectMsg = `💥 ✨ 究極魔法アルテマ！ 敵のHPを大きく（50%）削り取った！`;
      currentEnemyHp = panelDamage(0.5);
      if (currentEnemyHp === 0) isWin = true;
    } else if (winner === 'B') {
      // みんなの鉄槌（最大HPの35%）
      effectMsg = `🔨 ✨ みんなの鉄槌！敵のHPを35%削り取った！`;
      currentEnemyHp = panelDamage(0.35);
      if (currentEnemyHp === 0) isWin = true;
    } else if (winner === 'C') {
      // みんなの加護（最大HPの30%）
      effectMsg = `🎁 ✨ みんなの加護！敵のHPを30%削った！`;
      currentEnemyHp = panelDamage(0.3);
      if (currentEnemyHp === 0) isWin = true;
    } else if (winner === 'D') {
      // 覚醒バフ（次の攻撃が3倍）
      effectMsg = `📈 ✨ 覚醒バフ！次の攻撃の威力が3倍になる！`;
      setAwakenBuff(true);
    }
    
    setEnemyHp(currentEnemyHp);
    
    setBattleLog(prevLogs => [
      ...prevLogs,
      `🗳️ 投票終了！一番票を集めたのはパネル【${winner}】だ！`,
      effectMsg
    ]);
    
    if (isWin) {
      handleWin(enemy);
    } else if (winner === 'D') {
      // 覚醒バフは「力をためる」ターン。敵はこのターン動けない
      setBattleLog(prevLogs => [...prevLogs, `⏳ 力がみなぎっている…！敵は圧倒されて動けない。次の攻撃を放て！`]);
    } else {
      // 敵の反撃
      let dmgToPlayer = enemy.atk - pDef;
      const variance = 1.0 + (Math.random() * 0.4 - 0.2);
      dmgToPlayer = Math.floor(dmgToPlayer * variance);
      const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2));
      if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;
      
      currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
      setBattleLog(prevLogs => [...prevLogs, `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`]);
      setPlayerHp(currentPlayerHp);
      
      if (currentPlayerHp === 0) {
        setBattleLog(prevLogs => [...prevLogs, `💀 目の前が真っ暗になった... 敵に逃げられた。`]);
        setBattleState('lost');
        addPatrolHistoryRecord({
          enemyName: enemy?.name || '未知の敵',
          enemyIcon: enemy?.icon || '👾',
          enemyType: enemy?.type,
          level: enemy?.level || userLevel,
          isHardMode,
          result: 'lost',
          exp: 0,
          tickets: 0,
          dropItem: null
        });
      }
    }
  };

  // sosTimeが0になったら開票する
  useEffect(() => {
    if (sosState === 'voting' && sosTime === 0) {
      resolveSos();
    }
  }, [sosTime, sosState]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, []);

  const handleWin = (defeatedEnemy) => {
    if (winProcessedRef.current) return;
    winProcessedRef.current = true;
    setBattleState('won');
    
    // 敵のステータスからEXPを算出（じっくり成長する本格RPGバランス）
    let baseDef = defeatedEnemy.def;
    let bonusExp = 0;
    // メタル系（迷子のらびたん、はぐれらびたん等）は超高防御(9999)を計算から除外してボーナスEXPを付与
    if (defeatedEnemy.def >= 9000) {
      baseDef = 10;
      bonusExp = defeatedEnemy.id === 'el4_2' ? 1200 : 400;
    }
    // ノーマル敵で50〜80 EXP、エリートで120〜160 EXP、レアで250〜350 EXP程度
    let baseExp = Math.floor(defeatedEnemy.hp / 18 + defeatedEnemy.atk * 0.25 + baseDef * 0.2);
    let earnedExp = Math.max(10, baseExp) + bonusExp;
    
    // 激怒個体だった場合は1.5倍
    if (defeatedEnemy.isEnraged) earnedExp = Math.round(earnedExp * 1.5);
    // ハードモードなら1.5倍
    if (isHardMode) earnedExp = Math.round(earnedExp * 1.5);
    
    setLastEarnedExp(earnedExp);
    addExp(earnedExp);
    
    let logs = [`✨ ${earnedExp} EXP を獲得した！`];
    if (levelInfo?.next && (userExp + earnedExp) >= levelInfo.next) {
      logs.push(`🎊 ✨ LEVEL UP！！ Lv.${userLevel} → Lv.${userLevel + 1} に上がった！`);
      logs.push(`💪 最大HP +10 / 攻撃力 +5 / 防御力 +2 UP！`);
    }
    setBattleLog(prev => [...prev, ...logs]);

    let earnedTickets = 0;
    if (defeatedEnemy.id === 'el4_2') {
      earnedTickets = isHardMode ? 5 : 3; // はぐれらびたんは特大ガチャチケ3〜5枚！
    } else if (defeatedEnemy.id === 'el4') {
      earnedTickets = isHardMode ? 3 : 1; // 迷子のらびたんはガチャチケ1〜3枚！
    } else if (defeatedEnemy.type === 'rare') {
      earnedTickets = isHardMode ? 10 : 3; // 深層レアなら10枚！
    } else if (defeatedEnemy.type === 'elite') {
      earnedTickets = isHardMode ? 3 : 1; // 深層エリートなら3枚
    } else if (isHardMode) {
      earnedTickets = 1; // 深層ならノーマル敵でもガチャチケが落ちる
    }
    if (earnedTickets > 0) {
      addTickets(earnedTickets);
    }
    
    // 伝説のUSAGI「らび -sin -」特別撃破判定！
    if (defeatedEnemy.id === 'e_rabi_sin' || defeatedEnemy.name.includes('らび -sin -')) {
      const sinTickets = isHardMode ? 30 : 20;
      addTickets(sinTickets);
      earnedTickets += sinTickets;
      // 「らび -sin -」自身、または他の神話級LRアイテムを確定ドロップ！
      const rabiSinPartner = ITEMS.find(i => i.id === 'p_rabi_sin');
      const drop = (rabiSinPartner && Math.random() < 0.6) ? rabiSinPartner : rollGachaSpecific('LR');
      if (drop) {
        setDropItem(drop);
        triggerDropCelebration('LR');
        setBattleLog(prev => [
          ...prev, 
          `🌈 ✨ 奇跡降臨！！！！伝説のUSAGI【らび -sin -】から最高峰の【虹箱（LR確定）】がドロップした！！！！`
        ]);
      }
      addPatrolHistoryRecord({
        enemyName: defeatedEnemy.name,
        enemyIcon: defeatedEnemy.icon || '👾',
        enemyType: defeatedEnemy.type,
        level: defeatedEnemy.level || userLevel,
        isHardMode,
        result: 'won',
        exp: earnedExp,
        tickets: earnedTickets,
        dropItem: drop ? `[${drop.rarity}] ${drop.name}` : null,
        dropItemData: drop || null
      });
      return;
    }

    // レアエネミーなら赤箱ドロップ判定
    let drop = null;
    if (defeatedEnemy.type === 'rare') {
      const rand = Math.random();
      // 激甘ドロップ: LR 2%, UR 20%, それ以外はR以上確定など
      if (rand < 0.02) drop = rollGachaSpecific('LR');
      else if (rand < 0.22) drop = rollGachaSpecific('UR');
      else if (rand < 0.50) drop = rollGachaSpecific('SR');
      
      if (drop) {
        setDropItem(drop);
        triggerDropCelebration(drop.rarity);
        setBattleLog(prev => [...prev, `🎁 激レアな【赤箱】をドロップした！！！`]);
      } else {
        setBattleLog(prev => [...prev, `💨 しかし何もドロップしなかった...`]);
      }
    }

    // 🗝️ 地下の鍵ドロップ判定（約5%のレア確率で、本日の地下パトロール挑戦権+1！）
    let foundKey = false;
    if (Math.random() < 0.05) {
      try {
        const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
        const dungeonData = JSON.parse(localStorage.getItem('daily_dungeon_attempts_v1') || '{}');
        const currentRemaining = dungeonData.date === todayStr ? (typeof dungeonData.remaining === 'number' ? dungeonData.remaining : 5) : 5;
        const newRemaining = currentRemaining + 1;
        localStorage.setItem('daily_dungeon_attempts_v1', JSON.stringify({
          date: todayStr,
          remaining: newRemaining
        }));
        if (user && supabase) {
          supabase.auth.updateUser({
            data: {
              daily_dungeon_date: todayStr,
              daily_dungeon_remaining: newRemaining
            }
          }).catch(console.error);
        }
        foundKey = true;
        setHasFoundKey(true);
        if (!drop) triggerDropCelebration(null, true);
        setBattleLog(prev => [
          ...prev, 
          `🗝️ 【地下の鍵】を発見！本日の「地下パトロール」挑戦回数が +1 回増えた！（本日残り ${newRemaining} 回）`
        ]);
      } catch (e) {
        console.error(e);
      }
    }

    let finalDropLabel = null;
    if (drop) {
      finalDropLabel = `[${drop.rarity}] ${drop.name}`;
      if (foundKey) finalDropLabel += ' + 🗝️地下の鍵';
    } else if (foundKey) {
      finalDropLabel = '🗝️ 地下の鍵';
    }

    addPatrolHistoryRecord({
      enemyName: defeatedEnemy.name,
      enemyIcon: defeatedEnemy.icon || '👾',
      enemyType: defeatedEnemy.type,
      level: defeatedEnemy.level || userLevel,
      isHardMode,
      result: 'won',
      exp: earnedExp,
      tickets: earnedTickets,
      dropItem: finalDropLabel,
      dropItemData: drop || null
    });
  };

  // 🎉 レアリティに応じたドロップ祝福紙吹雪
  const triggerDropCelebration = (rarity, isKey = false) => {
    if (rarity === 'LR') {
      confetti({
        particleCount: 260,
        spread: 95,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ffd700'],
        zIndex: 999999
      });
    } else if (rarity === 'UR') {
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ec4899', '#c084fc'],
        zIndex: 999999
      });
    } else if (rarity === 'SR') {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#fef08a'],
        zIndex: 999999
      });
    } else if (isKey) {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#0284c7', '#fbbf24'],
        zIndex: 999999
      });
    }
  };

  const rollGachaSpecific = (rarity) => {
    const pool = ITEMS.filter(i => i.rarity === rarity);
    if(pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const takeDropItem = (equipImmediately = true) => {
    if (dropItem) {
      if (equipImmediately) {
        const oldItem = equipment[dropItem.type];
        setEquipment(prev => ({
          ...prev,
          [dropItem.type]: dropItem
        }));
        if (oldItem && setInventory) setInventory(prev => [...prev, oldItem]);
      } else {
        if (setInventory) setInventory(prev => [...prev, dropItem]);
      }
    }
    setDropItem(null);
    setEnemy(null);
    setBattleState('idle');
  };

  // 📜 戦闘ログ表示 (5行程度がしっかり見え、スクロールも可能)
  const renderBattleLog = () => (
    <div style={{ 
      fontSize: '0.73rem', 
      color: '#475569', 
      background: '#f8fafc', 
      border: '1px solid #cbd5e1',
      padding: '6px 8px', 
      borderRadius: '6px', 
      height: '115px', 
      overflowY: 'auto', 
      marginBottom: '8px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '3px' 
    }}>
      {[...battleLog].reverse().map((log, i) => {
        // 🎊 レベルアップの特別華やか装飾バナー
        if (log.includes('LEVEL UP')) {
          return (
            <div key={i} style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
              border: '1.5px solid #f59e0b',
              borderRadius: '6px',
              padding: '5px 8px',
              margin: '3px 0',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <span style={{ fontSize: '0.95rem' }}>🎊</span>
              <span style={{
                background: 'linear-gradient(90deg, #d97706, #b45309)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '900',
                fontSize: '0.8rem',
                letterSpacing: '0.5px'
              }}>
                {log.replace(/^[🎊✨\s]+/, '')}
              </span>
              <span style={{ fontSize: '0.95rem' }}>✨</span>
            </div>
          );
        }

        // 💪 ステータスアップの特別華やか装飾バナー
        if (log.includes('最大HP +') || log.includes('HP +') || log.includes('ステータスUP')) {
          return (
            <div key={i} style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)',
              border: '1px solid #6ee7b7',
              borderRadius: '6px',
              padding: '4px 8px',
              margin: '2px 0',
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              <span style={{ fontSize: '0.9rem' }}>💪</span>
              <span style={{
                color: '#047857',
                fontWeight: '900',
                fontSize: '0.76rem',
                letterSpacing: '0.3px'
              }}>
                {log.replace(/^[💪\s]+/, '')}
              </span>
              <span style={{ fontSize: '0.85rem' }}>⚡</span>
            </div>
          );
        }

        let logStyle = { animation: 'fadeIn 0.2s', borderBottom: i !== battleLog.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: '3px', lineHeight: 1.35 };
        
        if (log.includes('撃退した') || log.includes('不戦勝')) {
          logStyle.color = '#ef4444';
          logStyle.fontWeight = '900';
        } else if (log.includes('会心')) {
          logStyle.color = '#2563eb';
          logStyle.fontWeight = '900';
        } else if (log.includes('痛恨')) {
          logStyle.color = '#991b1b';
          logStyle.fontWeight = '900';
        } else if (log.includes('あなたの攻撃') || log.includes('ダメージ！')) {
          logStyle.color = '#2563eb';
          logStyle.fontWeight = 'bold';
        } else if (log.includes('敵の反撃') || log.includes('ダメージを受けた') || log.includes('毒素') || log.includes('炎上') || log.includes('反動')) {
          logStyle.color = '#dc2626';
        } else if (log.includes('回復') || log.includes('応急手当') || log.includes('吸収')) {
          logStyle.color = '#16a34a';
          logStyle.fontWeight = 'bold';
        } else if (log.includes('救援') || log.includes('投票') || log.includes('EXP を獲得')) {
          logStyle.color = '#d97706';
          logStyle.fontWeight = 'bold';
        } else if (log.includes('赤箱') || log.includes('ドロップ')) {
          logStyle.color = '#ec4899';
          logStyle.fontWeight = '900';
        } else if (log.includes('目の前が真っ暗')) {
          logStyle.color = '#475569';
          logStyle.fontWeight = 'bold';
        }

        return (
          <div key={i} style={logStyle}>{log}</div>
        );
      })}
    </div>
  );

  return (
    <div style={{ marginTop: '12px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #cbd5e1', padding: '12px 14px', color: '#334155' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', whiteSpace: 'nowrap' }}>
          🚓 広場パトロール
        </h4>
        <span style={{ fontSize: '0.72rem', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          通常戦闘
        </span>
      </div>

      {battleState === 'idle' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              広場を見回りして、迷惑なユーザーを撃退しよう！
            </span>
            <span style={{ 
              fontSize: '0.72rem', 
              fontWeight: 'bold', 
              color: patrolsToday >= MAX_PATROLS ? '#ef4444' : '#2563eb', 
              background: patrolsToday >= MAX_PATROLS ? '#fef2f2' : '#eff6ff', 
              border: `1px solid ${patrolsToday >= MAX_PATROLS ? '#fecaca' : '#bfdbfe'}`,
              padding: '2px 8px', 
              borderRadius: '10px',
              whiteSpace: 'nowrap'
            }}>
              本日残り {Math.max(0, MAX_PATROLS - patrolsToday)}/{MAX_PATROLS}回
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => startPatrol(false)}
              disabled={patrolsToday >= MAX_PATROLS}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none',
                background: patrolsToday >= MAX_PATROLS ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                color: patrolsToday >= MAX_PATROLS ? '#94a3b8' : 'white',
                fontWeight: 'bold', fontSize: '0.82rem', cursor: patrolsToday >= MAX_PATROLS ? 'not-allowed' : 'pointer',
                boxShadow: patrolsToday >= MAX_PATROLS ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
              }}
            >
              {patrolsToday >= MAX_PATROLS ? '✅ 本日終了' : `出発する (通常)`}
            </button>
            <button 
              onClick={() => startPatrol(true)}
              disabled={patrolsToday >= MAX_PATROLS}
              style={{
                flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none',
                background: patrolsToday >= MAX_PATROLS ? '#e2e8f0' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                color: patrolsToday >= MAX_PATROLS ? '#94a3b8' : 'white',
                fontWeight: 'bold', fontSize: '0.82rem', cursor: patrolsToday >= MAX_PATROLS ? 'not-allowed' : 'pointer',
                boxShadow: patrolsToday >= MAX_PATROLS ? 'none' : '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
              }}
            >
              {patrolsToday >= MAX_PATROLS ? '✅ 本日終了' : `深層へ (ハード)`}
            </button>
          </div>
          {patrolsToday >= MAX_PATROLS && (
            <div style={{ marginTop: '8px', fontSize: '0.73rem', color: '#64748b', textAlign: 'center', background: '#f1f5f9', padding: '6px', borderRadius: '6px' }}>
              ☕ 本日のパトロールはお疲れ様でした！日付が変わるとまた出撃できます🐰
            </div>
          )}

          {/* 📜 本日のパトロール記録（直近5回） */}
          <div style={{
            marginTop: '10px',
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            padding: '10px 12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: '4px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 'bold', color: '#1e293b' }}>
                <span>📜</span>
                <span>冒険タイムライン</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                {patrolHistory.length > 0 ? `本日 直近${patrolHistory.length}件` : '本日 未記録'}
              </span>
            </div>

            {patrolHistory.length === 0 ? (
              <div style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                textAlign: 'center',
                padding: '12px 4px',
                lineHeight: 1.5,
                background: '#f8fafc',
                borderRadius: '6px'
              }}>
                まだ本日の冒険記録がありません。<br />
                広場を見回りに出発するとここに記録が残ります🌸
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '6px', 
                maxHeight: '620px', 
                overflowY: 'auto', 
                paddingRight: '3px',
                scrollbarWidth: 'thin'
              }}>
                {sortPatrolHistoryDesc(patrolHistory).map((h, idx) => {
                  // 🏷️ エネミーのレアリティ判定（神話級 / メタル / 激レア / エリート / 通常）
                  const getEnemyBadge = () => {
                    if (h.enemyId === 'e_rabi_sin' || (h.enemyName && h.enemyName.includes('らび -sin -'))) {
                      return { label: '神話級', bg: 'linear-gradient(135deg, #f43f5e, #a855f7)', color: '#fff', border: '#ec4899' };
                    }
                    if (h.enemyId === 'el4' || h.enemyId === 'el4_2' || (h.enemyName && h.enemyName.includes('らびたん'))) {
                      return { label: 'メタル', bg: '#0284c7', color: '#fff', border: '#0369a1' };
                    }
                    if (h.enemyType === 'rare' || (h.enemyName && h.enemyName.includes('激レア'))) {
                      return { label: '激レア', bg: '#f59e0b', color: '#fff', border: '#d97706' };
                    }
                    if (h.enemyType === 'elite' || (h.enemyName && (h.enemyName.includes('エリート') || h.enemyName.includes('魔性の姫')))) {
                      return { label: 'エリート', bg: '#8b5cf6', color: '#fff', border: '#7c3aed' };
                    }
                    return { label: '通常', bg: '#e2e8f0', color: '#475569', border: '#cbd5e1' };
                  };
                  const badge = getEnemyBadge();

                  return (
                    <div key={idx} style={{
                      fontSize: '0.74rem',
                      lineHeight: 1.4,
                      padding: '7px 9px',
                      borderRadius: '8px',
                      background: idx === 0 ? '#f0fdf4' : '#f8fafc',
                      border: idx === 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxShadow: idx === 0 ? '0 1px 3px rgba(16, 185, 129, 0.12)' : 'none'
                    }}>
                      {/* 1行目: [時間] ＆ 結末バッジ（左右両端にすっきり配置） */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {idx === 0 && (
                            <span style={{
                              background: 'linear-gradient(135deg, #ef4444, #f97316)',
                              color: '#ffffff',
                              fontSize: '0.62rem',
                              fontWeight: '900',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              letterSpacing: '0.5px',
                              boxShadow: '0 1px 3px rgba(239, 68, 68, 0.35)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              lineHeight: 1.2
                            }}>
                              New!
                            </span>
                          )}
                          <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.7rem' }}>[{h.time}]</span>
                          {h.isHardMode && (
                            <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>深層</span>
                          )}
                        </div>
                        <span style={{
                          fontWeight: 'bold',
                          fontSize: '0.72rem',
                          padding: '1px 7px',
                          borderRadius: '10px',
                          background: h.result === 'won' ? '#dcfce7' : '#fee2e2',
                          color: h.result === 'won' ? '#15803d' : '#b91c1c',
                          border: `1px solid ${h.result === 'won' ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          {h.result === 'won' ? '撃退 🎉' : '逃げられた 💀'}
                        </span>
                      </div>

                      {/* 2行目: 敵アイコン ＋ レアリティバッジ ＋ 敵フルネーム (Lv.◯) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', flexShrink: 0, lineHeight: 1 }}>{h.enemyIcon || '👾'}</span>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: '900',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          flexShrink: 0,
                          lineHeight: 1.2
                        }}>
                          {badge.label}
                        </span>
                        <span style={{ fontWeight: '900', color: '#1e293b', fontSize: '0.82rem', wordBreak: 'break-word' }}>
                          {h.enemyName}
                        </span>
                        {h.level && (
                          <span style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 'bold' }}>(Lv.{h.level})</span>
                        )}
                      </div>

                    {/* 3行目: ⭐ EXP +◯　🎫 チケット ◯枚 */}
                    {(h.exp > 0 || h.tickets > 0) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', background: '#f1f5f9', padding: '3px 7px', borderRadius: '4px', width: 'fit-content' }}>
                        {h.exp > 0 && <span style={{ color: '#d97706', fontWeight: 'bold' }}>⭐ EXP +{h.exp}</span>}
                        {h.tickets > 0 && <span style={{ color: '#2563eb', fontWeight: 'bold' }}>🎫 チケット {h.tickets}枚</span>}
                      </div>
                    )}

                    {/* 4行目: 🎁 戦利品（ドロップ品がある場合・タップで詳細が開く！） */}
                    {h.dropItem && (
                      <div style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ color: '#ec4899', fontWeight: 'bold', flexShrink: 0 }}>🎁 獲得:</span>
                        {parseDropItems(h.dropItem, h.dropItemData).map((d, dIdx) => {
                          const isKey = d.rarity === 'SPECIAL';
                          return (
                            <button
                              key={dIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewItem(d.item);
                              }}
                              title="タップで詳細を見る"
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isKey ? '#fef3c7' : '#fdf2f8',
                                border: `1px solid ${isKey ? '#fde68a' : '#fbcfe8'}`,
                                color: isKey ? '#b45309' : '#db2777',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
                              }}
                            >
                              <span>{d.label}</span>
                              <span style={{ fontSize: '0.62rem', opacity: 0.75 }}>🔍</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        </>
      )}

      {battleState === 'battling' && enemy && (
        <div style={{ animation: 'fadeIn 0.2s' }}>
          {/* コンパクト戦闘ステータス */}
          <div style={{ 
            background: enemy.isEnraged ? '#fff1f2' : enemy.type === 'rare' ? '#fffbeb' : enemy.type === 'elite' ? '#f8fafc' : 'white', 
            border: `1.5px solid ${enemy.isEnraged ? '#f87171' : enemy.type === 'rare' ? '#f59e0b' : enemy.type === 'elite' ? '#3b82f6' : '#e2e8f0'}`, 
            borderRadius: '8px', 
            padding: '8px 10px', 
            marginBottom: '8px',
            boxShadow: enemy.isEnraged ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none'
          }}>
            {/* 敵情報行 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px 4px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 6px', minWidth: 0, flex: '1 1 auto' }}>
                <span style={{ fontSize: '1.2rem', lineHeight: 1, animation: (enemy.isEnraged || enemy.type === 'rare') ? 'pulse 1.5s infinite' : 'none' }}>{enemy.icon}</span>
                <span style={{ 
                  fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold',
                  background: enemy.isEnraged 
                    ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' 
                    : enemy.type === 'rare' ? '#f59e0b' : enemy.type === 'elite' ? '#3b82f6' : '#94a3b8',
                  color: 'white', flexShrink: 0,
                  boxShadow: enemy.isEnraged ? '0 0 6px rgba(239, 68, 68, 0.4)' : 'none'
                }}>
                  {enemy.isEnraged ? '💢 激怒種' : enemy.type === 'rare' ? 'RARE' : enemy.type === 'elite' ? 'ELITE' : 'NORMAL'}
                </span>
                <span style={{ 
                  fontWeight: '900', fontSize: '0.85rem', minWidth: 0, overflowWrap: 'anywhere', wordBreak: 'keep-all',
                  color: enemy.isEnraged ? '#b91c1c' : enemy.type === 'rare' ? '#b45309' : enemy.type === 'elite' ? '#1d4ed8' : '#1e293b',
                  textShadow: enemy.isEnraged ? '0 0 4px rgba(239, 68, 68, 0.25)' : 'none'
                }}>
                  {enemy.name}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {enemy.isEnraged ? (
                  <span style={{ color: '#dc2626', fontWeight: '900', background: '#fee2e2', padding: '1px 5px', borderRadius: '4px', fontSize: '0.68rem', border: '1px solid #fecaca' }}>
                    Lv.変異⚡
                  </span>
                ) : (
                  <span style={{ color: '#64748b', fontWeight: 'bold' }}>Lv.{enemy.level || 1}</span>
                )}
              </div>
            </div>

            {/* 敵HPバー & 数値 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ flex: 1, background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(0, (enemyHp / enemy.hp) * 100)}%`, height: '100%', background: '#ef4444', transition: 'width 0.3s' }}></div>
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#ef4444', flexShrink: 0 }}>
                {enemyHp} / {enemy.hp}
              </div>
            </div>

            {/* プレイヤー情報行 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', color: '#334155', marginBottom: '3px' }}>
              <span>あなた HP: <strong style={{ color: '#059669' }}>{playerHp} / {pMaxHp}</strong></span>
              <span style={{ color: '#64748b' }}>🗡️ {pAtk} / 🛡️ {pDef}</span>
            </div>

            {/* プレイヤーHPバー */}
            <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, (playerHp / pMaxHp) * 100)}%`, height: '100%', background: '#10b981', transition: 'width 0.3s' }}></div>
            </div>
          </div>

          {/* 戦闘ログ */}
          {renderBattleLog()}

          {/* アクションボタン */}
          {sosState !== 'voting' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={handleAttack}
                  style={{ 
                    flex: '1.4', padding: '9px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                    color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', 
                    fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)' 
                  }}
                >
                  {awakenBuff ? '📈 攻撃する！（威力3倍）' : '🗡️ 攻撃する！'}
                </button>
                <button 
                  onClick={handleHeal}
                  disabled={healCount > 0 && gachaTickets < 1}
                  style={{ 
                    flex: '1', padding: '9px', 
                    background: (healCount > 0 && gachaTickets < 1) ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', 
                    cursor: (healCount > 0 && gachaTickets < 1) ? 'not-allowed' : 'pointer', 
                    fontSize: '0.75rem', boxShadow: (healCount > 0 && gachaTickets < 1) ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.3)' 
                  }}
                  title="ターン消費なしで即時回復！(1回目は無料、2回目以降はチケ1枚)"
                >
                  💊 回復 ({healCount === 0 ? '無料' : 'チケ1枚'})
                </button>
              </div>
              <button 
                onClick={handleSos}
                disabled={usedSos}
                style={{ 
                  width: '100%', padding: '6px', background: usedSos ? '#e2e8f0' : '#f59e0b', 
                  color: usedSos ? '#94a3b8' : 'white', border: 'none', borderRadius: '6px', 
                  fontWeight: 'bold', cursor: usedSos ? 'not-allowed' : 'pointer', fontSize: '0.72rem' 
                }}
              >
                📢 救援アンケートを呼ぶ (1回のみ)
              </button>
            </div>
          ) : (
            /* 救援アンケート投票画面 */
            <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: '8px', padding: '8px', animation: 'fadeIn 0.2s' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#b45309', fontSize: '0.75rem', marginBottom: '6px' }}>
                📢 投票受付中！ (残り {sosTime} 秒)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                {['A', 'B', 'C', 'D'].map(key => {
                  const total = Math.max(1, sosVotes.A + sosVotes.B + sosVotes.C + sosVotes.D);
                  const percent = Math.floor((sosVotes[key] / total) * 100);
                  return (
                    <div key={key} style={{ background: 'white', border: '1px solid #d1d5db', borderRadius: '5px', padding: '4px 6px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${percent}%`, background: '#fef08a', zIndex: 1, transition: 'width 0.3s' }}></div>
                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold' }}>
                        <span>パネル {key}<span style={{ fontSize: '0.62rem', fontWeight: 'normal', color: '#92400e', marginLeft: '4px' }}>{{ A: 'アルテマ', B: '鉄槌', C: '加護', D: '覚醒バフ' }[key]}</span></span>
                        <span>{sosVotes[key]}票</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                onClick={resolveSos}
                style={{ width: '100%', padding: '6px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }}
              >
                待てない！今すぐ開票！
              </button>
            </div>
          )}
        </div>
      )}

      {/* 勝利画面UI (ログも残して戦況がしっかり読める) */}
      {battleState === 'won' && (
        <div style={{ animation: 'fadeIn 0.2s' }}>
          {/* 🌟 レアアイテム（SR / UR / LR）特別ドロップバナー */}
          {dropItem && ['SR', 'UR', 'LR'].includes(dropItem.rarity) && (
            <div style={{
              background: dropItem.rarity === 'LR'
                ? 'linear-gradient(90deg, #ff007a, #9d00ff, #00d4ff, #ffd700)'
                : dropItem.rarity === 'UR'
                ? 'linear-gradient(135deg, #f43f5e 0%, #fbbf24 50%, #a855f7 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              marginBottom: '8px',
              textAlign: 'center',
              fontWeight: '900',
              fontSize: '0.86rem',
              letterSpacing: '0.5px',
              boxShadow: dropItem.rarity === 'LR'
                ? '0 0 18px rgba(255, 0, 122, 0.7)'
                : dropItem.rarity === 'UR'
                ? '0 0 14px rgba(244, 63, 94, 0.6)'
                : '0 0 12px rgba(245, 158, 11, 0.6)',
              animation: 'pulse 1.4s infinite'
            }}>
              {dropItem.rarity === 'LR' ? '🌈 奇跡降臨！神話級【LR】アイテムドロップ！！' :
               dropItem.rarity === 'UR' ? '✨ 超絶幸運！激レア【UR】アイテムドロップ！！' :
               '⭐ 大当たり！激レア【SR】アイテムドロップ！！'}
            </div>
          )}

          {/* 🗝️ 地下の鍵ドロップバナー */}
          {hasFoundKey && (
            <div style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              padding: '7px 12px',
              borderRadius: '8px',
              marginBottom: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              boxShadow: '0 0 10px rgba(2, 132, 199, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span>🗝️</span>
              <span>レアドロップ！【地下の鍵】を発見！（地下パトロール挑戦権 +1）</span>
            </div>
          )}

          {/* 撃退結果ヘッダー */}
          <div style={{ 
            background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', 
            padding: '6px 10px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{enemy?.icon}</span>
              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#047857' }}>
                🎉 【{enemy?.name || '強敵'}】を撃退！
              </span>
            </div>
            <div style={{ fontWeight: '900', color: '#d97706', fontSize: '0.82rem' }}>
              +{lastEarnedExp} EXP {enemy?.type === 'elite' ? '🎫+1' : ''}
            </div>
          </div>

          {/* 戦闘ログ (勝利時もしっかり読める！) */}
          {renderBattleLog()}

          {/* 次のLv進捗バー */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '0.72rem', color: '#334155', marginBottom: '3px' }}>
              <span>現在のLv: <strong style={{ color: '#2563eb' }}>Lv.{userLevel}</strong> (累計: {userExp || 0})</span>
              {levelInfo?.next ? (
                <span style={{ color: '#b45309' }}>あと <strong>{Math.max(0, levelInfo.next - (userExp || 0))} EXP</strong></span>
              ) : (
                <span style={{ color: '#fbbf24' }}>Lv.MAX</span>
              )}
            </div>
            {levelInfo?.next && (
              <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #10b981, #059669)', 
                  width: `${Math.min(100, Math.max(0, ((userExp || 0) / levelInfo.next) * 100))}%`,
                  transition: 'width 0.4s ease'
                }}></div>
              </div>
            )}
          </div>

          {/* ドロップアイテム詳細カード */}
          {dropItem && (
            <div style={{ 
              background: ['SR', 'UR', 'LR'].includes(dropItem.rarity) ? 'linear-gradient(135deg, #fdf2f8, #f5f3ff, #ecfdf5)' : '#fffbeb', 
              border: `2px solid ${getRarityColor(dropItem.rarity)}`,
              padding: '10px 12px', borderRadius: '10px', marginBottom: '10px', 
              boxShadow: ['SR', 'UR', 'LR'].includes(dropItem.rarity) ? RARITY_CONFIG[dropItem.rarity]?.boxGlow : 'none',
              animation: dropItem.rarity === 'LR' ? 'pulse-purple 1.5s infinite' : dropItem.rarity === 'UR' ? 'pulse-orange 1.5s infinite' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1, filter: ['SR', 'UR', 'LR'].includes(dropItem.rarity) ? `drop-shadow(0 0 8px ${getRarityColor(dropItem.rarity)})` : 'none' }}>
                  {dropItem.icon}
                </span>
                <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.68rem', color: getRarityColor(dropItem.rarity), fontWeight: 'bold' }}>
                    {dropItem.rarity === 'LR' ? '🔥 奇跡の神話級LRドロップ！' : dropItem.rarity === 'UR' ? '✨ 超激レアURドロップ！' : dropItem.rarity === 'SR' ? '⭐ 激レアSRドロップ！' : '🎁 ドロップ獲得！'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={getRarityBadgeStyle(dropItem.rarity)}>
                      {RARITY_CONFIG[dropItem.rarity]?.sparkle && <span>{RARITY_CONFIG[dropItem.rarity]?.sparkle}</span>}
                      <span>{dropItem.rarity}</span>
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', ...(['SR', 'UR', 'LR'].includes(dropItem.rarity) ? getRarityTextStyle(dropItem.rarity) : { color: '#1e293b' }) }}>
                      {dropItem.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* 上昇ステータス */}
              <div style={{ display: 'flex', gap: '8px', fontSize: '0.74rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px', background: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: '4px', width: 'fit-content' }}>
                {dropItem.atk > 0 && <span style={{ color: '#ef4444' }}>ATK +{dropItem.atk}</span>}
                {dropItem.def > 0 && <span style={{ color: '#3b82f6' }}>DEF +{dropItem.def}</span>}
                {dropItem.hp > 0 && <span style={{ color: '#10b981' }}>HP +{dropItem.hp}</span>}
                <span style={{ color: userLevel >= getReqLevel(dropItem) ? '#059669' : '#dc2626' }}>
                  必要Lv: {getReqLevel(dropItem)}
                </span>
              </div>

              {/* 特殊効果 */}
              {dropItem.effect && (
                <div style={{ fontSize: '0.74rem', color: '#92400e', background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '4px', padding: '4px 6px', marginBottom: '8px', fontWeight: 'bold', textAlign: 'left' }}>
                  ✨ {getItemEffectDescription(dropItem)}
                </div>
              )}

              {/* 装備 or カバン選択ボタン */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button
                  onClick={() => takeDropItem(true)}
                  disabled={userLevel < getReqLevel(dropItem)}
                  style={{
                    flex: 1, padding: '7px 8px', 
                    background: userLevel >= getReqLevel(dropItem) ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#94a3b8',
                    color: 'white', border: 'none', borderRadius: '6px',
                    cursor: userLevel >= getReqLevel(dropItem) ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold', fontSize: '0.78rem'
                  }}
                >
                  {userLevel >= getReqLevel(dropItem) ? '⚔️ すぐ装備して戻る' : `Lv.${getReqLevel(dropItem)}必要`}
                </button>
                <button
                  onClick={() => takeDropItem(false)}
                  style={{
                    flex: 1, padding: '7px 8px', 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white', border: 'none', borderRadius: '6px',
                    cursor: 'pointer', fontWeight: 'bold', fontSize: '0.78rem'
                  }}
                >
                  👜 鞄にしまって戻る
                </button>
              </div>
            </div>
          )}

          {!dropItem && (
            <button 
              onClick={() => { setBattleState('idle'); setEnemy(null); }}
              style={{ 
                width: '100%', padding: '9px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', 
                fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' 
              }}
            >
              戻る
            </button>
          )}
        </div>
      )}

      {/* 敗北画面UI */}
      {battleState === 'lost' && (
        <div style={{ animation: 'fadeIn 0.2s' }}>
          <div style={{ 
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', 
            padding: '6px 10px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#b91c1c' }}>
              💀 目の前が真っ暗になった...
            </span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
              パトロール失敗
            </span>
          </div>

          {/* 戦闘ログ */}
          {renderBattleLog()}

          <button 
            onClick={() => { setBattleState('idle'); setEnemy(null); }}
            style={{ width: '100%', padding: '9px', background: '#64748b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            広場に逃げ帰る
          </button>
        </div>
      )}

      {/* 🔍 タイムライン アイテム詳細プレビューモーダル */}
      {previewItem && (
        <div 
          onClick={() => setPreviewItem(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '360px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25), 0 10px 10px -5px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              position: 'relative',
              animation: 'scaleUp 0.2s ease-out',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* 閉じるボタン */}
            <button
              onClick={() => setPreviewItem(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                fontSize: '1rem',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
            >
              ✕
            </button>

            {/* アイテムアイコン */}
            <div style={{
              fontSize: '4.2rem',
              marginTop: '4px',
              marginBottom: '10px',
              lineHeight: 1,
              filter: ['LR', 'UR', 'SR'].includes(previewItem.rarity)
                ? `drop-shadow(0 0 16px ${RARITY_CONFIG[previewItem.rarity]?.color || '#f59e0b'}88)`
                : 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
            }}>
              {previewItem.icon || '🎁'}
            </div>

            {/* アイテム名 */}
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '900',
              marginBottom: '6px',
              wordBreak: 'break-word',
              ...getRarityTextStyle(previewItem.rarity || 'N')
            }}>
              {previewItem.name}
            </div>

            {/* レアリティ ＆ 種別バッジ */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              marginBottom: '14px',
              ...(previewItem.rarity === 'SPECIAL'
                ? { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 'bold' }
                : getRarityBadgeStyle(previewItem.rarity || 'N'))
            }}>
              <span>{previewItem.rarity || 'N'}</span>
              <span>•</span>
              <span>
                {previewItem.type === 'weapon' ? '🗡️ 武器'
                  : previewItem.type === 'armor' ? '🛡️ 防具'
                  : previewItem.type === 'accessory' ? '💍 装飾品'
                  : previewItem.type === 'partner' ? '👤 お供'
                  : previewItem.type === 'special' ? '🗝️ 特殊アイテム'
                  : 'アイテム'}
              </span>
            </div>

            {/* ステータス表（武器/防具などの場合） */}
            {previewItem.rarity !== 'SPECIAL' && (previewItem.atk > 0 || previewItem.def > 0 || previewItem.hp > 0) && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px',
                marginBottom: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '4px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>ATK</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#dc2626' }}>+{previewItem.atk || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>DEF</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#2563eb' }}>+{previewItem.def || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>HP</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#16a34a' }}>+{previewItem.hp || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 'bold' }}>必要Lv</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#059669' }}>Lv.{getReqLevel(previewItem)}</div>
                </div>
              </div>
            )}

            {/* 特殊効果 */}
            {previewItem.effect && (
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '8px 10px',
                marginBottom: '12px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold', marginBottom: '2px' }}>
                  ✨ 特殊能力
                </div>
                <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 'bold' }}>
                  {getItemEffectDescription(previewItem) || previewItem.effect}
                </div>
                {previewItem.effectMsg && (
                  <div style={{ fontSize: '0.72rem', color: '#b45309', fontStyle: 'italic', marginTop: '3px' }}>
                    発動時: {previewItem.effectMsg}
                  </div>
                )}
              </div>
            )}

            {/* フレーバーテキスト（説明文） */}
            {previewItem.desc && (
              <div style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.78rem',
                color: '#475569',
                lineHeight: '1.55',
                textAlign: 'left',
                marginBottom: '16px',
                border: '1px solid #f1f5f9'
              }}>
                {previewItem.desc}
              </div>
            )}

            {/* 閉じるボタン */}
            <button
              onClick={() => setPreviewItem(null)}
              style={{
                width: '100%',
                padding: '10px 0',
                borderRadius: '8px',
                background: '#1e293b',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; }}
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatrolMiniGame;
