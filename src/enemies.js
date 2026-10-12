import enemiesData from './data/enemies.json';

export const ENEMIES = enemiesData;

export const rollEnemy = (userLevel = 1) => {
  const rand = Math.random();

  // 🐰 メタルらびたん枠（約4%の確率：適度なレア感！）
  // 1日10回パトロールで数日に1回遭遇するワクワクバランス
  if (rand < 0.04) {
    const isHagure = Math.random() < 0.25; // らびたん枠の25%（全体の1%）は超レア「はぐれらびたん」
    const rabbitId = isHagure ? 'el4_2' : 'el4';
    const rabbit = ENEMIES.find(e => e.id === rabbitId);
    if (rabbit) return { ...rabbit };
  }

  let type = 'normal';
  if (rand < 0.05) type = 'rare';        // 1%
  else if (rand < 0.35) type = 'elite';  // 30%
  // 残り65%は normal

  // らびたん系（el4, el4_2）は専用枠にしたので通常プールからは除外
  const pool = ENEMIES.filter(e => e.type === type && e.id !== 'el4' && e.id !== 'el4_2');
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
