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
  { id: 'r104', type: 'rare', name: '✨ アルゴリズムの化身', hp: 7777, atk: 500, def: 500, icon: '🤖🌀', desc: 'おすすめタブを支配する存在。誰も逆らうことはできない。' },


  // ================= 🐰 第5弾 追加エネミー (ディープなネットの闇・歌舞伎町編：30種) =================
  { id: 'el201', type: 'elite', name: 'トー横キッズ（たちんぼ）', hp: 400, atk: 50, def: 20, icon: '👧', desc: '歌舞伎町の片隅で獲物を待つ。攻撃を受けると金銭を要求される。' },
  { id: 'el202', type: 'elite', name: 'トー横四天王', hp: 900, atk: 85, def: 60, icon: '👑', desc: '界隈を牛耳るヤバい奴ら。4人揃うと手がつけられない。' },
  { id: 'el203', type: 'elite', name: '歌舞伎町のホスト', hp: 600, atk: 70, def: 40, icon: '🍾', desc: '甘い言葉で近づき、最終的に大ダメージを与えてくる。' },
  { id: 'e204', type: 'normal', name: 'ホスト狂いの地雷系女子', hp: 300, atk: 40, def: 10, icon: '🎀', desc: '推しのためにすべてを捧げる。怒らせると恐ろしい。' },
  { id: 'el205', type: 'elite', name: '頂き女子', hp: 550, atk: 90, def: 20, icon: '💕', desc: '巧みな話術でプレイヤーのHPを限界まで搾り取る。' },
  { id: 'e206', type: 'normal', name: '頂きおぢ', hp: 800, atk: 10, def: 5, icon: '👴', desc: 'ただ搾取されるだけの存在。倒すと少しお金を落とすかも。' },
  { id: 'el207', type: 'elite', name: '私人逮捕系YouTuber', hp: 750, atk: 80, def: 50, icon: '🚔', desc: '勝手に罪をでっち上げて突撃してくる危険人物。' },
  { id: 'e208', type: 'normal', name: '回転寿司テロリスト', hp: 200, atk: 30, def: 10, icon: '🍣', desc: '醤油ボトルを舐め回してバイオテロを引き起こす。' },
  { id: 'e209', type: 'normal', name: 'インプレゾンビの群れ', hp: 100, atk: 10, def: 99, icon: '🧟', desc: '無意味なリプライを大量に送ってくる。倒してもキリがない。' },
  { id: 'el210', type: 'elite', name: 'インプレゾンビの王', hp: 1000, atk: 50, def: 150, icon: '🧟‍♂️', desc: '青バッジを大量に纏い、アルゴリズムの寵愛を受けるゾンビの王。' },
  { id: 'el211', type: 'elite', name: '闇金業者', hp: 850, atk: 95, def: 40, icon: '💴', desc: '法外な利息でHPを削ってくる。絶対に逃げられない。' },
  { id: 'el212', type: 'elite', name: '情報商材屋', hp: 650, atk: 60, def: 70, icon: '📈', desc: '「これで絶対に勝てる」と言いながら何の効果もない攻撃をしてくる。' },
  { id: 'r213', type: 'rare', name: '✨ 女装パ◯ダ', hp: 4000, atk: 250, def: 300, icon: '🐼', desc: 'トー横の伝説の存在。圧倒的なインパクトでプレイヤーを圧倒する。' },
  { id: 'r214', type: 'rare', name: '✨ ぷ◯ん', hp: 3500, atk: 300, def: 250, icon: '🍮', desc: 'トー横界隈の象徴的な存在。その闇は底知れない。' },
  { id: 'e215', type: 'normal', name: '闇バイトの実行犯', hp: 250, atk: 45, def: 15, icon: '🥷', desc: '使い捨てのコマ。何も知らずに襲いかかってくる。' },
  { id: 'el216', type: 'elite', name: '指示役「ル〇ィ」', hp: 1500, atk: 120, def: 80, icon: '📱', desc: '海外から匿名で指示を出し、安全圏から強力な攻撃を仕掛ける。' },
  { id: 'el217', type: 'elite', name: 'パパ活議員', hp: 950, atk: 50, def: 120, icon: '💼', desc: '表向きはクリーンだが、裏ではHPを大量に消費している。' },
  { id: 'el218', type: 'elite', name: 'ゴシップ週刊誌の記者', hp: 500, atk: 85, def: 30, icon: '📸', desc: '隠し撮りでプレイヤーの弱点を暴き、致命傷を与える。' },
  { id: 'e219', type: 'normal', name: '退職代行利用者', hp: 150, atk: 0, def: 50, icon: '🏃', desc: '攻撃はしてこないが、ある日突然目の前から消え去る。' },
  { id: 'e220', type: 'normal', name: '陰謀論者', hp: 350, atk: 40, def: 25, icon: '🛸', desc: '「すべてはディープステートの陰謀だ！」と叫びながら殴ってくる。' },
  { id: 'e221', type: 'normal', name: '地球平面説論者', hp: 300, atk: 35, def: 30, icon: '🌍', desc: '物理法則を無視した直線的な攻撃しかしてこない。' },
  { id: 'el222', type: 'elite', name: '転売ヤーの元締め', hp: 800, atk: 70, def: 90, icon: '📦', desc: 'あらゆる物資を買い占め、プレイヤーの回復を妨害する。' },
  { id: 'e223', type: 'normal', name: 'クレカ現金化業者', hp: 200, atk: 25, def: 40, icon: '💳', desc: '一時的にHPをくれるが、後で莫大な利息を取り立てに来る。' },
  { id: 'e224', type: 'normal', name: 'オレオレ詐欺の受け子', hp: 180, atk: 20, def: 20, icon: '📞', desc: '常に怯えている。たまに警察に捕まって自滅する。' },
  { id: 'el225', type: 'elite', name: 'ネットの特定班', hp: 600, atk: 100, def: 10, icon: '🔍', desc: 'プレイヤーの個人情報を特定し、防御力を0にしてくる恐ろしい敵。' },
  { id: 'el226', type: 'elite', name: '炎上中の配信者', hp: 700, atk: 60, def: 60, icon: '🔥', desc: '炎上を燃料にして延々と攻撃を続ける無敵の人。' },
  { id: 'e227', type: 'normal', name: '自粛警察', hp: 250, atk: 30, def: 80, icon: '🚓', desc: '少しでもはみ出した行動をとると過剰に攻撃してくる。' },
  { id: 'e228', type: 'normal', name: 'コラボカフェ転売ヤー', hp: 220, atk: 20, def: 30, icon: '☕', desc: '特典のコースターだけを奪って去っていく。' },
  { id: 'e229', type: 'normal', name: 'スパチャで破産したおじさん', hp: 900, atk: 5, def: 5, icon: '💸', desc: 'HPは高いが中身はスッカラカン。哀愁が漂う。' },
  { id: 'el230', type: 'elite', name: 'Vチューバーのガチ恋勢', hp: 850, atk: 90, def: 50, icon: '😍', desc: '推しのためなら命を投げ出す狂戦士。' }

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
