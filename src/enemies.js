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
  { id: 'r4', type: 'rare', name: '✨ 覚醒らびたん（裏ボス）', hp: 50000, atk: 9999, def: 1000, icon: '🐰👑', desc: '怒りで我を忘れた広場の主。勝てるわけがない。' },

  // ================= 🐰 第4弾 追加エネミー (ネットミーム・時事ネタ増量編) =================
  // --- Elite 枠 ---
  { id: 'el101', type: 'elite', name: '迷惑系ユーチューバー', hp: 450, atk: 65, def: 30, icon: '📹', desc: 'カメラを回しながら突撃してくる。とにかくウザい。' },
  { id: 'el102', type: 'elite', name: '暴露系YouTuber', hp: 420, atk: 80, def: 15, icon: '💣', desc: 'ターゲットの弱みを握って大ダメージを与えてくる。' },
  { id: 'el103', type: 'elite', name: '悪徳転売ヤー', hp: 320, atk: 45, def: 50, icon: '📦', desc: '欲しいアイテムを全て買い占めて高値で売りつけてくる。' },
  { id: 'el104', type: 'elite', name: '怪しいコンサルタント', hp: 550, atk: 50, def: 70, icon: '👔', desc: '横文字を多用し、言葉巧みにプレイヤーのHPを奪う。' },
  { id: 'el105', type: 'elite', name: '転生したなろう主人公', hp: 700, atk: 90, def: 40, icon: '🗡️', desc: '「また俺何かやっちゃいました？」と言いながら理不尽な火力を出す。' },
  { id: 'el106', type: 'elite', name: '底辺切り抜き職人', hp: 650, atk: 60, def: 55, icon: '✂️', desc: '文脈を無視して都合のいい部分だけを切り抜いて攻撃してくる。' },
  { id: 'el107', type: 'elite', name: '謎の裏垢女子', hp: 350, atk: 65, def: 40, icon: '💋', desc: '正体不明。強力なデバフ（精神攻撃）を放ってくる。' },
  { id: 'el108', type: 'elite', name: 'トー横キッズ', hp: 380, atk: 50, def: 25, icon: '💊', desc: '群れで襲いかかってくる。HPは低いが攻撃の回転が速い。' },
  { id: 'el109', type: 'elite', name: '増税メガネ', hp: 600, atk: 40, def: 80, icon: '👓', desc: 'じわじわとプレイヤーのHP（財布）を削り取ってくる強敵。' },
  { id: 'el110', type: 'elite', name: '居眠り議員', hp: 800, atk: 10, def: 100, icon: '💤', desc: '寝ているだけだが異常に硬く、税金を吸い取っている。' },
  { id: 'el111', type: 'elite', name: '闇バイトの元締め', hp: 550, atk: 75, def: 40, icon: '📱', desc: '自分は手を汚さず、使い捨てのコマを突撃させてくる。' },
  { id: 'el112', type: 'elite', name: '撮り鉄', hp: 600, atk: 85, def: 30, icon: '📸', desc: '電車を撮るためなら手段を選ばず、罵声を浴びせてくる。' },

  // --- Rare 枠 ---
  { id: 'r101', type: 'rare', name: '✨ 黄金のスパムボット', hp: 1000, atk: 150, def: 100, icon: '🪙', desc: '全身が純金でできた謎のボット。逃げ足が速い。' },
  { id: 'r102', type: 'rare', name: '✨ 特級呪物クソリッパー', hp: 3000, atk: 350, def: 250, icon: '💩', desc: '絶対に反省しない究極の煽り屋。防御力がカチカチ。' },
  { id: 'r103', type: 'rare', name: '✨ シン・増税メガネ', hp: 5000, atk: 400, def: 800, icon: '👓🔥', desc: '国民の怒りを吸収して巨大化した姿。すべてを無に帰す。' },
  { id: 'r104', type: 'rare', name: '✨ アルゴリズムの化身', hp: 7777, atk: 500, def: 500, icon: '🤖🌀', desc: 'おすすめタブを支配する存在。誰も逆らうことはできない。' }

];

export const rollEnemy = () => {
  const rand = Math.random();
  let type = 'normal';
  if (rand < 0.01) type = 'rare';        // 1%
  else if (rand < 0.30) type = 'elite';  // 29%
  // 残り70%は normal

  const pool = ENEMIES.filter(e => e.type === type);
  let selected = { ...pool[Math.floor(Math.random() * pool.length)] };

  // 10%の確率で「激怒した（突然変異）」個体になる（らびたん系、黄金系以外）
  if (Math.random() < 0.10 && !selected.name.includes('らびたん') && !selected.name.includes('黄金') && !selected.name.includes('✨')) {
    const multi = Math.floor(Math.random() * 3) + 3; // 3〜5倍の強化
    selected.name = `激怒した ${selected.name}`;
    selected.hp = selected.hp * multi;
    selected.atk = selected.atk * multi;
    selected.def = selected.def * multi;
    selected.isEnraged = true;
  }

  return selected;
};
