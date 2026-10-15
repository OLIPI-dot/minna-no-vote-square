import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { rollEnemy } from '../enemies';
import { ITEMS } from '../items';

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
  const [lastEarnedExp, setLastEarnedExp] = useState(0);
  const [healCount, setHealCount] = useState(0); // 何回回復したか
  const [usedSos, setUsedSos] = useState(false); // 救援を呼んだか
  const [sosState, setSosState] = useState('idle'); // idle, voting, completed
  const [sosVotes, setSosVotes] = useState({ A: 0, B: 0, C: 0, D: 0 });
  const [sosTime, setSosTime] = useState(30);
  const [awakenBuff, setAwakenBuff] = useState(false); // 覚醒バフ: 次の攻撃の威力3倍
  const [enemyStatus, setEnemyStatus] = useState(null); // 'virus' など
  const [isHardMode, setIsHardMode] = useState(false);
  const timerRef = useRef(null);
  const botIntervalRef = useRef(null);
  const winProcessedRef = useRef(false);

  // 1日のパトロール回数制限 (最大10回 - クラウドおよびローカルで同期)
  const getTodayPatrols = () => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    let localCount = 0;
    try {
      const data = JSON.parse(localStorage.getItem('daily_patrols_v2') || '{}');
      if (data.date === todayStr) localCount = data.count || 0;
    } catch { localCount = 0; }

    let cloudCount = 0;
    if (user?.user_metadata?.daily_patrol_date === todayStr) {
      cloudCount = user.user_metadata?.daily_patrol_count || 0;
    }

    const count = Math.max(localCount, cloudCount);
    return { date: todayStr, count };
  };
  const [patrolsToday, setPatrolsToday] = useState(() => getTodayPatrols().count);
  const MAX_PATROLS = 20; // 1日20回まで（たっぷり冒険！）

  // ユーザーのログイン状態が変化した時にも最新回数を反映
  useEffect(() => {
    const current = getTodayPatrols();
    setPatrolsToday(current.count);
    localStorage.setItem('daily_patrols_v2', JSON.stringify(current));
  }, [user]);

  // プレイヤーステータス計算
  const pMaxHp = (userLevel * 10 + 100) + (equipment?.accessory?.hp || 0) + (equipment?.partner?.hp || 0);
  const pAtk = (userLevel * 5 + 10) + (equipment?.weapon?.atk || 0) + (equipment?.partner?.atk || 0);
  const pDef = (userLevel * 2) + (equipment?.armor?.def || 0) + (equipment?.partner?.def || 0);

  const startPatrol = (hardMode = false) => {
    const todayStr = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
    const currentData = getTodayPatrols();
    if (currentData.count >= MAX_PATROLS) {
      setPatrolsToday(currentData.count);
      return;
    }
    
    // 回数消費
    const newCount = currentData.count + 1;
    localStorage.setItem('daily_patrols_v2', JSON.stringify({ date: todayStr, count: newCount }));
    setPatrolsToday(newCount);

    if (user) {
      supabase.auth.updateUser({
        data: {
          daily_patrol_date: todayStr,
          daily_patrol_count: newCount
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

    // 🔍 特定の効果を持っているすべての装備を取得（古いセーブデータ対応）
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

    // ✨ 【自動回復: regen】ターンの開始時に回復（重複で回復量アップ: 1個10%, 2個20%, 最大30%）
    const regenItem = getEffectSource('regen');
    if (regenItem) {
      const regenCount = getEffectCount('regen');
      const healPct = Math.min(0.30, 0.10 * regenCount);
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

    // 🦠 【ウイルス: virus】
    if (enemyStatus === 'virus') {
      const virusDmg = Math.max(5, Math.floor(enemy.hp * 0.1)); // 最大HPの10%
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

    // 🔥 【大炎上: burn】ターンの開始時に敵に特大ダメージ
    if (enemyStatus === 'burn') {
      const burnDmg = Math.max(10, Math.floor(enemy.hp * 0.2)); // 最大HPの20%
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

    // 🎲 お互いの命中率とクリティカル判定（重複で確率アップ・上限キャップ付き）
    const critCount = getEffectCount('crit_up');
    let basePCrit = critCount > 0 ? Math.min(0.60, 0.10 + (0.20 * critCount)) : 0.10; // 重複で+20%、最大60%
    let pMiss = Math.random() < 0.05; // 5% ミス
    
    // 呪われた力（cursed_power）: 会心率大幅アップだが、ミスしなくなる代わりに防御関係にペナルティ
    const cursedItem = getEffectSource('cursed_power');
    if (cursedItem) {
      basePCrit = 0.50; // 50%で会心
      pMiss = false;    // ミスしない
    }

    // 🤓 【限界オタク: partner_cheer】会心率アップ
    const cheerItem = getEffectSource('partner_cheer');
    if (cheerItem) {
      basePCrit += 0.20;
      newLogs.push(`🤓 ${getEffectMsg('partner_cheer', cheerItem)}`);
    }
    
    const pCrit = Math.random() < basePCrit;

    const dodgeCount = getEffectCount('dodge_up');
    let baseEMiss = dodgeCount > 0 ? Math.min(0.60, 0.05 + (0.25 * dodgeCount)) : 0.05; // 重複で+25%、最大60%
    const stealthItem = getEffectSource('stealth');
    if (stealthItem) baseEMiss = 0.60; // 完全なる匿名性で60%回避
    if (cursedItem) baseEMiss = 0; // 呪われていると回避不可
    
    const eMiss = Math.random() < baseEMiss; 
    let ePainful = Math.random() < (enemy.type === 'rare' ? 0.15 : 0.05);
    if (cursedItem) ePainful = Math.random() < 0.5; // 呪われていると敵の痛恨率が50%に跳ね上がる

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

      // 🩸 【吸血: lifesteal】 25%の確率で発動（重複で確率+25%最大60%、吸収量も+15%UP）
      const lifestealItem = getEffectSource('lifesteal');
      const lifestealChance = getEffectChance('lifesteal', 0.25, 0.60);
      if (currentEnemyHp > 0 && lifestealItem && Math.random() < lifestealChance) {
        const drainRate = Math.min(0.70, 0.40 + 0.15 * (getEffectCount('lifesteal') - 1));
        const drain = Math.floor(dmgToEnemy * drainRate);
        currentPlayerHp = Math.min(pMaxHp, currentPlayerHp + drain);
        newLogs.push(`🩸 ${getStackLabel('lifesteal', '吸収')} ${getEffectMsg('lifesteal', lifestealItem)} (HP +${drain})`);
      }

      // ⚔️ 【二刀流: double_attack】 30%の確率で発動（重複で+30%、最大60%）
      const doubleItem = getEffectSource('double_attack');
      const doubleChance = getEffectChance('double_attack', 0.30, 0.60);
      if (currentEnemyHp > 0 && doubleItem && Math.random() < doubleChance) {
        let secondDmg = Math.floor(calcDamage() * 0.8);
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

      // 🔨 【BAN: ban】または【ブロック: block】 5%で即死（重複で+5%、最大20%）
      const banCount = getEffectCount('ban') + getEffectCount('block');
      const banItem = getEffectSource('ban') || getEffectSource('block');
      const banChance = Math.min(0.20, banCount * 0.05);
      if (currentEnemyHp > 0 && banItem && Math.random() < banChance) {
        const isBan = getEffectSource('ban');
        newLogs.push(`🚫 ${banCount > 1 ? `【追放×${banCount}】` : '【追放】'} ${getEffectMsg(isBan ? 'ban' : 'block', banItem)}`);
        currentEnemyHp = 0;
      }

      // 💀 【精神崩壊: mental_damage】 10%の確率で発動（重複で+10%、最大40%）
      const mentalItem = getEffectSource('mental_damage');
      const mentalChance = getEffectChance('mental_damage', 0.10, 0.40);
      if (currentEnemyHp > 0 && mentalItem && Math.random() < mentalChance) {
        isEnemyStunned = true;
        newLogs.push(`💀 ${getStackLabel('mental_damage', '混乱')} ${getEffectMsg('mental_damage', mentalItem)}`);
      }

      // 🦠 【ウイルス付与: virus】 30%で感染（重複で+20%、最大60%）
      const virusItem = getEffectSource('virus');
      const virusChance = getEffectChance('virus', 0.30, 0.60);
      if (currentEnemyHp > 0 && virusItem && enemyStatus !== 'virus') {
        if (Math.random() < virusChance) {
          setEnemyStatus('virus');
          newLogs.push(`💉 ${getStackLabel('virus', '感染源')} ${getEffectMsg('virus', virusItem)}`);
        }
      }

      // 🔥 【大炎上付与: burn】 25%で大炎上（重複で+20%、最大60%）
      const burnItem = getEffectSource('burn');
      const burnChance = getEffectChance('burn', 0.25, 0.60);
      if (currentEnemyHp > 0 && burnItem && enemyStatus !== 'burn') {
        if (Math.random() < burnChance) {
          setEnemyStatus('burn');
          newLogs.push(`🔥 ${getStackLabel('burn', '発火')} ${getEffectMsg('burn', burnItem)}`);
        }
      }

      // 😰 【ドン引き: cringe】 5%の確率で敵がドン引きして1ターン行動不能（重複で+5%、最大25%）
      const cringeItem = getEffectSource('cringe');
      const cringeChance = getEffectChance('cringe', 0.05, 0.25);
      if (currentEnemyHp > 0 && cringeItem && Math.random() < cringeChance) {
        isEnemyStunned = true;
        newLogs.push(`😰 ${getStackLabel('cringe', 'ドン引き')} ${getEffectMsg('cringe', cringeItem)}`);
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

    if (isEnemyStunned) {
      newLogs.push(`... 【${enemy.name}】 は虚空を見つめている。`);
    } else if (skipEnemyAttack) {
      // 謝罪等でスキップ済み
    } else if (eMiss) {
      newLogs.push(`💨 敵の反撃... しかしあなたはヒョイッと避けた！`);
    } else {
      let dmgToPlayer = enemy.atk - pDef;
      const variance = 1.0 + (Math.random() * 0.4 - 0.2);
      dmgToPlayer = Math.floor(dmgToPlayer * variance);
      const minDmg = Math.max(1, Math.floor(enemy.atk * 0.2));
      if (dmgToPlayer < minDmg) dmgToPlayer = minDmg;
      
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
      
      // 📜 【クソリプ防御: kusorep】 被弾時20%で発動し、ダメージを1にする（重複で+15%、最大50%）
      const kusorepItem = getEffectSource('kusorep');
      const kusorepChance = getEffectChance('kusorep', 0.20, 0.50);
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
          dmgToPlayer = Math.floor(dmgToPlayer * 0.25); // 75%カット
          newLogs.push(`🔒 【鍵垢】 ${getEffectMsg('lock_account', lockItem)}`);
        } else if (lawItem && Math.random() < 0.5) {
          dmgToPlayer = Math.floor(dmgToPlayer * 0.5); // 50%カット
          newLogs.push(`👨‍⚖️ 【異議あり】 ${getEffectMsg('partner_law', lawItem)} (ダメージ半減)`);
        }
        
        currentPlayerHp = Math.max(0, currentPlayerHp - dmgToPlayer);
        newLogs.push(ePainful 
          ? `🩸 痛恨の一撃！！！ 敵の猛攻で ${dmgToPlayer} の大ダメージを受けた！` 
          : `💥 敵の反撃！ ${dmgToPlayer} のダメージを受けた！`);
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
    
    // 敵のステータスからEXPを算出
    let baseDef = defeatedEnemy.def;
    let bonusExp = 0;
    // メタル系（迷子のらびたん、はぐれらびたん等）は超高防御(9999)を計算から除外してボーナスEXPを付与
    if (defeatedEnemy.def >= 9000) {
      baseDef = 10;
      bonusExp = defeatedEnemy.id === 'el4_2' ? 1500 : 500;
    }
    let earnedExp = Math.floor(defeatedEnemy.hp / 5 + defeatedEnemy.atk + baseDef) + bonusExp;
    
    // 激怒個体だった場合はさらに倍
    if (defeatedEnemy.isEnraged) earnedExp *= 2;
    // ハードモードならさらに倍
    if (isHardMode) earnedExp *= 2;
    
    setLastEarnedExp(earnedExp);
    addExp(earnedExp);
    
    let logs = [`✨ ${earnedExp} EXP を獲得した！`];
    if (levelInfo?.next && (userExp + earnedExp) >= levelInfo.next) {
      logs.push(`🎊 ✨ LEVEL UP！！ Lv.${userLevel} → Lv.${userLevel + 1} に上がった！`);
      logs.push(`💪 最大HP +10 / 攻撃力 +5 / 防御力 +2 UP！`);
    }
    setBattleLog(prev => [...prev, ...logs]);

    if (defeatedEnemy.id === 'el4_2') {
      addTickets(isHardMode ? 5 : 3); // はぐれらびたんは特大ガチャチケ3〜5枚！
    } else if (defeatedEnemy.id === 'el4') {
      addTickets(isHardMode ? 3 : 1); // 迷子のらびたんはガチャチケ1〜3枚！
    } else if (defeatedEnemy.type === 'rare') {
      addTickets(isHardMode ? 10 : 3); // 深層レアなら10枚！
    } else if (defeatedEnemy.type === 'elite') {
      addTickets(isHardMode ? 3 : 1); // 深層エリートなら3枚
    } else if (isHardMode) {
      addTickets(1); // 深層ならノーマル敵でもガチャチケが落ちる
    }
    
    // 伝説のUSAGI「らび -sin -」特別撃破判定！
    if (defeatedEnemy.id === 'e_rabi_sin' || defeatedEnemy.name.includes('らび -sin -')) {
      addTickets(isHardMode ? 30 : 20); // ガチャチケ超大量！
      // 「らび -sin -」自身、または他の神話級LRアイテムを確定ドロップ！
      const rabiSinPartner = ITEMS.find(i => i.id === 'p_rabi_sin');
      const drop = (rabiSinPartner && Math.random() < 0.6) ? rabiSinPartner : rollGachaSpecific('LR');
      if (drop) {
        setDropItem(drop);
        setBattleLog(prev => [
          ...prev, 
          `🌈 ✨ 奇跡降臨！！！！伝説のUSAGI【らび -sin -】から最高峰の【虹箱（LR確定）】がドロップした！！！！`
        ]);
      }
      return;
    }

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

          {dropItem && (
            <div style={{ 
              background: dropItem.rarity === 'LR' ? 'linear-gradient(135deg, #fdf2f8, #f5f3ff, #ecfdf5)' : '#fffbeb', 
              border: dropItem.rarity === 'LR' ? '2px solid #ec4899' : '1px dashed #f59e0b',
              padding: '5px 8px', borderRadius: '6px', marginBottom: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              animation: dropItem.rarity === 'LR' ? 'pulse-purple 1.5s infinite' : 'pulse-orange 1.5s infinite'
            }}>
              <span style={{ fontSize: '1.3rem' }}>{dropItem.icon}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.65rem', color: dropItem.rarity === 'LR' ? '#ec4899' : '#b45309', fontWeight: 'bold' }}>
                  {dropItem.rarity === 'LR' ? '🌈 神話級LRドロップ！' : '🎁 ドロップ獲得！'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: dropItem.rarity === 'LR' ? '#7c3aed' : '#1e293b' }}>
                  [{dropItem.rarity}] {dropItem.name}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={() => { dropItem ? takeDropItem() : setBattleState('idle'); setDropItem(null); setEnemy(null); }}
            style={{ 
              width: '100%', padding: '9px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', 
              fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)' 
            }}
          >
            {dropItem ? '装備して戻る' : '戻る'}
          </button>
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
    </div>
  );
};

export default PatrolMiniGame;
