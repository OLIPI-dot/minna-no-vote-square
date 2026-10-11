import enemiesData from './data/enemies.json';

export const ENEMIES = enemiesData;

export const rollEnemy = (userLevel = 1) => {
  const rand = Math.random();
  let type = 'normal';
  if (rand < 0.01) type = 'rare';        // 1%
  else if (rand < 0.30) type = 'elite';  // 29%
  // 残り70%は normal

  const pool = ENEMIES.filter(e => e.type === type);
  let selected = { ...pool[Math.floor(Math.random() * pool.length)] };

  // 10%の確率で「激怒した（突然変異）」個体になる（らびたん系、黄金系、らび -sin -以外）
  if (Math.random() < 0.10 && !selected.name.includes('らびたん') && !selected.name.includes('黄金') && !selected.name.includes('✨') && !selected.name.includes('らび -sin -')) {
    const multi = Math.floor(Math.random() * 3) + 3; // 3〜5倍の強化
    selected.name = `激怒した ${selected.name}`;
    selected.hp = selected.hp * multi;
    selected.atk = selected.atk * multi;
    selected.def = selected.def * multi;
    selected.isEnraged = true;
  }

  return selected;
};
