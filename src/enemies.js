export const ENEMIES = [
  // ================= 普通のエネミー (Normal - 遭遇率70%) =================
  // スパム系
  { id: 'e1', type: 'normal', name: '量産型スパムボット', hp: 50, atk: 15, def: 5, icon: '🤖', desc: '無差別にURLを貼り付けてくる機械。' },
  { id: 'e1_2', type: 'normal', name: 'エロ垢スパムボット', hp: 80, atk: 20, def: 5, icon: '🤖', desc: '怪しいリンクを踏ませようと誘惑してくるボット。' },
  { id: 'e1_3', type: 'normal', name: '投資詐欺ボット', hp: 120, atk: 25, def: 15, icon: '🤖', desc: '「これで月収100万！」と嘘をつきながら殴ってくる。' },

  // クソリプおじさん系
  { id: 'e2', type: 'normal', name: 'クソリプおじさん', hp: 80, atk: 25, def: 10, icon: '👴', desc: '隙あらば自分語りをしてくる厄介な存在。' },
  { id: 'e2_2', type: 'normal', name: '説教クソリプおじさん', hp: 150, atk: 35, def: 20, icon: '👴', desc: '上から目線で長々とアドバイスをしてくる上位種。' },
  { id: 'e2_3', type: 'normal', name: '限界クソリプおじさん', hp: 200, atk: 50, def: 10, icon: '👴', desc: '何を言っているのか分からないが、とにかく攻撃力が高い。' },

  // 自称インフルエンサー系
  { id: 'e3', type: 'normal', name: '自称インフルエンサー', hp: 60, atk: 30, def: 2, icon: '🤳', desc: 'フォロワー数を盾に攻撃してくるが防御はもろい。' },
  { id: 'e3_2', type: 'normal', name: 'フォロバ100%インフルエンサー', hp: 100, atk: 10, def: 40, icon: '🤳', desc: 'ひたすら防御を固めてフォロワーを増やそうとする。' },

  // 自治厨系
  { id: 'e4', type: 'normal', name: '自治厨', hp: 120, atk: 10, def: 40, icon: '👮', desc: '広場のルールを勝手に決めて押し付けてくる。硬い。' },
  { id: 'e4_2', type: 'normal', name: '自称・運営の代行者', hp: 250, atk: 15, def: 80, icon: '👮', desc: '権力はないが、態度だけはデカい自治厨の上位種。' },

  // 亡霊系
  { id: 'e5', type: 'normal', name: 'ROM専の亡霊', hp: 200, atk: 5, def: 50, icon: '👻', desc: 'ただ見ているだけだが、プレッシャーでHPを削ってくる。' },
  { id: 'e5_2', type: 'normal', name: '古参の亡霊', hp: 300, atk: 10, def: 80, icon: '👻', desc: '「昔は良かった」と呪詛を吐きながら粘り強く生き残る。' },

  // ================= 中ボス / エリート (Elite - 遭遇率29%) =================
  { id: 'el1', type: 'elite', name: 'レスバ最強の男', hp: 600, atk: 60, def: 80, icon: '⌨️', desc: '絶対に非を認めず、長文で殴りかかってくる。' },
  { id: 'el1_2', type: 'elite', name: 'レスバ無敗の神', hp: 1200, atk: 120, def: 100, icon: '⌨️', desc: '論点をすり替える達人。ダメージが通りにくい。' },
  
  { id: 'el2', type: 'elite', name: '炎上インフルエンサー', hp: 1000, atk: 90, def: 30, icon: '🔥', desc: '炎上で得た知名度を武器に大暴れする。' },
  { id: 'el2_2', type: 'elite', name: '謝罪しないインフルエンサー', hp: 1500, atk: 80, def: 200, icon: '🔥', desc: '炎上しても絶対に謝らないため異常にタフ。' },
  
  { id: 'el3', type: 'elite', name: '謎の裏垢女子', hp: 800, atk: 70, def: 120, icon: '💋', desc: '正体不明。強力なデバフ（精神攻撃）を放ってくる。' },
  
  { id: 'el4', type: 'elite', name: '✨ 迷子のらびたん🐰🥕', hp: 15, atk: 1, def: 9999, icon: '🐰', desc: 'メタルスライム的な存在。倒すとガチャチケがもらえる！' },
  { id: 'el4_2', type: 'elite', name: '✨ はぐれらびたん🐰🥕', hp: 30, atk: 5, def: 9999, icon: '🐰', desc: 'はぐれメタル的な存在。HPが多いので倒すのが困難。' },

  // ================= レアエネミー (Rare - 遭遇率1%) =================
  { id: 'r1', type: 'rare', name: '✨ 黄金のスパムボット', hp: 5000, atk: 150, def: 200, icon: '🪙', desc: '全身が純金でできた謎のボット。逃げ足が速い。' },
  { id: 'r2', type: 'rare', name: '✨ はぐれ荒らし', hp: 8000, atk: 300, def: 50, icon: '🌪️', desc: 'すべてを破壊し尽くす伝説の荒らし。攻撃力がヤバい。' },
  { id: 'r3', type: 'rare', name: '✨ プイィ・クソリッパー', hp: 10000, atk: 50, def: 500, icon: '💩', desc: '絶対に反省しない究極の煽り屋。防御力がカチカチ。' },
  { id: 'r4', type: 'rare', name: '✨ 覚醒らびたん（裏ボス）', hp: 50000, atk: 9999, def: 1000, icon: '🐰👑', desc: '怒りで我を忘れた広場の主。勝てるわけがない。' }
];

export const rollEnemy = () => {
  const rand = Math.random();
  let type = 'normal';
  if (rand < 0.01) type = 'rare';        // 1%
  else if (rand < 0.30) type = 'elite';  // 29%
  // 残り70%は normal

  const pool = ENEMIES.filter(e => e.type === type);
  return pool[Math.floor(Math.random() * pool.length)];
};
