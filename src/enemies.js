import enemiesData from './data/enemies.json';

export const ENEMIES = enemiesData;

/**
 * 敵のステータスとレベルをプレイヤーのレベルに合わせてスケーリングする
 */
export const scaleEnemy = (rawEnemy, userLevel = 1) => {
  const isMetal = rawEnemy.def >= 9000;
  
  // 敵レベル決定（プレイヤーLvの±15%前後の揺らぎ）
  const variance = 0.85 + Math.random() * 0.30;
  let enemyLevel = Math.max(1, Math.round(userLevel * variance));
  if (rawEnemy.type === 'rare') enemyLevel = Math.round(enemyLevel * 1.08);

  const enemy = { ...rawEnemy, level: enemyLevel };

  // メタル系（DEF 9000以上の迷子のらびたん、はぐれらびたん）はHP・DEF固定
  if (isMetal) {
    return enemy;
  }

  // レベルに応じたターゲットステータス（成長指標）
  let targetHp, targetAtk, targetDef;
  if (rawEnemy.type === 'rare') {
    targetHp = 800 + enemyLevel * 30;
    targetAtk = 70 + enemyLevel * 4.8;
    targetDef = 35 + enemyLevel * 2.0;
  } else if (rawEnemy.type === 'elite') {
    targetHp = 300 + enemyLevel * 18;
    targetAtk = 40 + enemyLevel * 4.2;
    targetDef = 20 + enemyLevel * 1.8;
  } else {
    // normal
    targetHp = 80 + enemyLevel * 12;
    targetAtk = 20 + enemyLevel * 3.6;
    targetDef = 5 + enemyLevel * 1.5;
  }

  // ベースステータスとターゲット値の大きい方を採用し、個体値を反映
  const baseHpNorm = rawEnemy.type === 'normal' ? 80 : rawEnemy.type === 'elite' ? 300 : 800;
  const baseAtkNorm = rawEnemy.type === 'normal' ? 25 : rawEnemy.type === 'elite' ? 50 : 100;
  const baseDefNorm = rawEnemy.type === 'normal' ? 10 : rawEnemy.type === 'elite' ? 25 : 50;

  enemy.hp = Math.round(Math.max(rawEnemy.hp, targetHp * (rawEnemy.hp / baseHpNorm || 1)));
  enemy.atk = Math.round(Math.max(rawEnemy.atk, targetAtk * (rawEnemy.atk / baseAtkNorm || 1)));
  enemy.def = Math.round(Math.max(rawEnemy.def, targetDef * (rawEnemy.def / baseDefNorm || 1)));

  // レアボスのDEFがプレイヤー通常攻撃力を超えてカチカチになりすぎないよう安全上限
  const maxSafeDef = Math.round((userLevel * 5 + 10) * 0.85);
  if (enemy.def < 9000 && enemy.def > maxSafeDef) {
    enemy.def = maxSafeDef;
  }

  return enemy;
};

export const rollEnemy = (userLevel = 1) => {
  const rand = Math.random();

  // 🐰 メタルらびたん枠（約4%の確率：適度なレア感！）
  // 1日20回パトロールで数日に1回遭遇するワクワクバランス
  if (rand < 0.04) {
    const isHagure = Math.random() < 0.25; // らびたん枠の25%（全体の1%）は超レア「はぐれらびたん」
    const rabbitId = isHagure ? 'el4_2' : 'el4';
    const rabbit = ENEMIES.find(e => e.id === rabbitId);
    if (rabbit) return scaleEnemy(rabbit, userLevel);
  }

  let type = 'normal';
  if (rand < 0.05) type = 'rare';        // 5%
  else if (rand < 0.35) type = 'elite';  // 30%
  // 残り65%は normal

  // らびたん系（el4, el4_2）は専用枠にしたので通常プールからは除外
  const pool = ENEMIES.filter(e => e.type === type && e.id !== 'el4' && e.id !== 'el4_2');
  let selected = pool[Math.floor(Math.random() * pool.length)] || ENEMIES[0];

  // プレイヤーLvに合わせてスケーリング
  let enemy = scaleEnemy(selected, userLevel);

  // 10%の確率で「激怒した（突然変異）」個体になる（らびたん系、黄金系、らび -sin -以外）
  if (Math.random() < 0.10 && !enemy.name.includes('らびたん') && !enemy.name.includes('黄金') && !enemy.name.includes('✨') && !enemy.name.includes('らび -sin -')) {
    const multi = 1.8 + Math.random() * 0.7; // 1.8〜2.5倍の強化
    enemy.name = `激怒した ${enemy.name}`;
    enemy.hp = Math.round(enemy.hp * multi);
    enemy.atk = Math.round(enemy.atk * (1.2 + Math.random() * 0.3));
    enemy.def = Math.round(enemy.def * (1.2 + Math.random() * 0.2));
    enemy.isEnraged = true;
  }

  return enemy;
};
