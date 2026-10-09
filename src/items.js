export const ITEMS = [
  // 武器 (Weapon)
  { id: 'w1', type: 'weapon', rarity: 'N', name: '割り箸', atk: 2, def: 0, hp: 0, icon: '🥢', desc: 'とりあえず反撃するための武器。' },
  { id: 'w2', type: 'weapon', rarity: 'N', name: '古びたキーボード', atk: 5, def: 0, hp: 0, icon: '⌨️', desc: 'レスバの基本装備。エンターキーが外れかけ。' },
  { id: 'w3', type: 'weapon', rarity: 'R', name: 'らびのニンジンソード', atk: 15, def: 0, hp: 0, icon: '🥕', desc: 'らびたんが齧りかけの剣。' },
  { id: 'w4', type: 'weapon', rarity: 'SR', name: '正論の槍', atk: 40, def: 0, hp: 0, icon: '🔱', desc: '相手の矛盾を突く鋭い武器。会心の一撃が出やすい。' },
  { id: 'w5', type: 'weapon', rarity: 'UR', name: '伝説のクソリプハンマー', atk: 100, def: 0, hp: 0, icon: '🔨', desc: '相手のHPと精神を粉砕する最強の武器。' },

  // 防具 (Armor)
  { id: 'a1', type: 'armor', rarity: 'N', name: 'ペラペラのダンボール', atk: 0, def: 2, hp: 0, icon: '📦', desc: 'ないよりはマシ。' },
  { id: 'a2', type: 'armor', rarity: 'R', name: '匿名希望のマスク', atk: 0, def: 10, hp: 0, icon: '😷', desc: '身バレを防ぐ安心感で防御力が上がる。' },
  { id: 'a3', type: 'armor', rarity: 'SR', name: 'もこもこウサ耳フード', atk: 0, def: 30, hp: 0, icon: '🐰', desc: '相手の攻撃をフワッと吸収する可愛い防具。' },
  { id: 'a4', type: 'armor', rarity: 'SR', name: 'スルー・シールド', atk: 0, def: 45, hp: 0, icon: '🛡️', desc: 'どんな煽りコメントも綺麗に受け流す魔法の盾。' },
  { id: 'a5', type: 'armor', rarity: 'UR', name: '鋼のメンタルアーマー', atk: 0, def: 120, hp: 0, icon: '🤖', desc: 'どんな誹謗中傷もノーダメージになる無敵の鎧。' },

  // アクセサリー (Accessory)
  { id: 'ac1', type: 'accessory', rarity: 'N', name: '生えかけの草「w」', atk: 0, def: 0, hp: 10, icon: '🌱', desc: '笑うと少し元気になる。' },
  { id: 'ac2', type: 'accessory', rarity: 'R', name: '煽り耐性のお守り', atk: 0, def: 0, hp: 30, icon: '🧿', desc: 'ストレスを軽減してくれる。' },
  { id: 'ac3', type: 'accessory', rarity: 'SR', name: '高みの見物のティーカップ', atk: 0, def: 0, hp: 80, icon: '☕', desc: '争いを見ながら飲む紅茶はうまい。最大HPが大幅アップ。' },
  { id: 'ac4', type: 'accessory', rarity: 'UR', name: '王者のサングラス', atk: 10, def: 10, hp: 100, icon: '🕶️', desc: '圧倒的なオーラを放つサングラス。' }
];

export const rollGacha = () => {
  const rand = Math.random() * 100;
  let targetRarity = 'N';
  
  if (rand < 2) targetRarity = 'UR';       // 2%
  else if (rand < 12) targetRarity = 'SR'; // 10%
  else if (rand < 40) targetRarity = 'R';  // 28%
  else targetRarity = 'N';                 // 60%

  const pool = ITEMS.filter(item => item.rarity === targetRarity);
  return pool[Math.floor(Math.random() * pool.length)];
};
