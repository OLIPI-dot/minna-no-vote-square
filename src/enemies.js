import enemiesData from './data/enemies.json';

export const ENEMIES = enemiesData;

/**
 * 敵のステータスとレベルをプレイヤーのレベルに合わせてスケーリングする
 */
export const scaleEnemy = (rawEnemy, userLevel = 1) => {
  const isMetal = rawEnemy.def >= 9000;
  
  // 敵レベル決定（プレイヤーLvの±10%前後の自然な揺らぎ）
  const variance = 0.90 + Math.random() * 0.20;
  let enemyLevel = Math.max(1, Math.round(userLevel * variance));
  if (rawEnemy.type === 'rare') enemyLevel = Math.round(enemyLevel * 1.05);

  const enemy = { ...rawEnemy, level: enemyLevel };

  // メタル系（DEF 9000以上の迷子のらびたん、はぐれらびたん）はHP・DEF固定
  if (isMetal) {
    return enemy;
  }

  // レベルに応じたターゲットステータス（プレイヤーのLv成長に合わせた適正バランス）
  let targetHp, targetAtk, targetDef, maxHpCap, maxAtkCap;
  if (rawEnemy.type === 'rare') {
    // レアボス: 5〜6ターンで撃破可能、被ダメは耐えられるレベル（手ごたえ十分！）
    targetHp = 500 + enemyLevel * 25;
    targetAtk = 35 + enemyLevel * 2.2;
    targetDef = 20 + enemyLevel * 1.3;
    maxHpCap = 800 + enemyLevel * 30;
    maxAtkCap = 50 + enemyLevel * 2.6;
  } else if (rawEnemy.type === 'elite') {
    // エリート: 3ターン前後で撃破可能
    targetHp = 220 + enemyLevel * 15;
    targetAtk = 25 + enemyLevel * 1.8;
    targetDef = 12 + enemyLevel * 1.0;
    maxHpCap = 350 + enemyLevel * 20;
    maxAtkCap = 35 + enemyLevel * 2.2;
  } else {
    // 通常敵: 1〜2ターンで爽快に撃破！
    targetHp = 60 + enemyLevel * 7;
    targetAtk = 15 + enemyLevel * 1.4;
    targetDef = 5 + enemyLevel * 0.7;
    maxHpCap = 100 + enemyLevel * 10;
    maxAtkCap = 25 + enemyLevel * 1.8;
  }

  // 元データの個体差（±20%以内のマイルドな個性）を反映
  const baseHpNorm = rawEnemy.type === 'normal' ? 80 : rawEnemy.type === 'elite' ? 300 : 800;
  const baseAtkNorm = rawEnemy.type === 'normal' ? 25 : rawEnemy.type === 'elite' ? 50 : 100;
  const baseDefNorm = rawEnemy.type === 'normal' ? 10 : rawEnemy.type === 'elite' ? 25 : 50;

  const hpRatio = Math.max(0.80, Math.min(1.20, (rawEnemy.hp || baseHpNorm) / baseHpNorm));
  const atkRatio = Math.max(0.80, Math.min(1.20, (rawEnemy.atk || baseAtkNorm) / baseAtkNorm));
  const defRatio = Math.max(0.80, Math.min(1.20, (rawEnemy.def || baseDefNorm) / baseDefNorm));

  enemy.hp = Math.round(Math.min(maxHpCap, targetHp * hpRatio));
  enemy.atk = Math.round(Math.min(maxAtkCap, targetAtk * atkRatio));
  enemy.def = Math.round(targetDef * defRatio);

  // プレイヤー通常攻撃力を超えてカチカチになりすぎないよう安全上限
  const maxSafeDef = Math.round((userLevel * 5 + 10) * 0.70);
  if (enemy.def < 9000 && enemy.def > maxSafeDef) {
    enemy.def = maxSafeDef;
  }

  return enemy;
};

export const rollEnemy = (userLevel = 1) => {
  const rand = Math.random();

  // 🐰 メタルらびたん枠（約3%：出会えたら超ラッキー！）
  if (rand < 0.03) {
    const isHagure = Math.random() < 0.25; // 25%ではぐれらびたん
    const rabbitId = isHagure ? 'el4_2' : 'el4';
    const rabbit = ENEMIES.find(e => e.id === rabbitId);
    if (rabbit) return scaleEnemy(rabbit, userLevel);
  }

  // 敵タイプの抽選:
  // 通常敵: 80% (サクサク狩れる爽快感！)
  // エリート: 16% (ほどよい中ボス！)
  // レアボス: 4% (ここぞという強敵！)
  const typeRand = Math.random();
  let type = 'normal';
  if (typeRand < 0.04) {
    type = 'rare';       // 4%
  } else if (typeRand < 0.20) {
    type = 'elite';      // 16%
  } else {
    type = 'normal';     // 80%
  }

  // らびたん系（el4, el4_2）は専用枠にしたので通常プールからは除外
  const pool = ENEMIES.filter(e => e.type === type && e.id !== 'el4' && e.id !== 'el4_2');
  let selected = pool[Math.floor(Math.random() * pool.length)] || ENEMIES[0];

  // プレイヤーLvに合わせてスケーリング
  let enemy = scaleEnemy(selected, userLevel);

  // 5%の確率で「激怒した（突然変異）」個体になる（以前の10%から半減、強化倍率も適正化）
  if (Math.random() < 0.05 && !enemy.name.includes('らびたん') && !enemy.name.includes('黄金') && !enemy.name.includes('✨') && !enemy.name.includes('らび -sin -')) {
    const multi = 1.3 + Math.random() * 0.2; // 1.3〜1.5倍の程よい強化
    enemy.name = `激怒した ${enemy.name}`;
    enemy.hp = Math.round(enemy.hp * multi);
    enemy.atk = Math.round(enemy.atk * 1.15);
    enemy.isEnraged = true;
  }

  return enemy;
};
