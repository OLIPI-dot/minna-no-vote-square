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
  { id: 'el230', type: 'elite', name: 'Vチューバーのガチ恋勢', hp: 850, atk: 90, def: 50, icon: '😍', desc: '推しのためなら命を投げ出す狂戦士。' },


  // ================= 🐰 第6弾 追加エネミー (さらなるネットの深淵・界隈の闇編：30種) =================
  { id: 'e301', type: 'normal', name: 'バチャ豚', hp: 300, atk: 25, def: 10, icon: '🐷', desc: '推しVチューバーのためなら昼夜問わず鳴き続ける。' },
  { id: 'el302', type: 'elite', name: '絵師の過激派ファン', hp: 550, atk: 75, def: 50, icon: '🎨', desc: '解釈違いを絶対に許さず、引用RTで袋叩きにしてくる。' },
  { id: 'e303', type: 'normal', name: 'お気持ち表明おじさん', hp: 200, atk: 15, def: 30, icon: '📝', desc: '聞かれてもないのに長文で持論を展開し、相手のHPをじわじわ削る。' },
  { id: 'el304', type: 'elite', name: 'ポリコレ戦士', hp: 800, atk: 60, def: 120, icon: '🌈', desc: 'あらゆるエンタメを監視し、少しでもズレていると棍棒で殴ってくる。' },
  { id: 'el305', type: 'elite', name: 'キャンセルカルチャーの権化', hp: 950, atk: 90, def: 80, icon: '❌', desc: '過去の失言を掘り起こし、社会的に抹殺しようとする恐怖の存在。' },
  { id: 'e306', type: 'normal', name: 'AIイラスト量産アカ', hp: 150, atk: 20, def: 15, icon: '🤖', desc: '指が6本ある女の子の絵を1日100枚投稿してくる。' },
  { id: 'el307', type: 'elite', name: '論破王もどき', hp: 600, atk: 50, def: 90, icon: '👓', desc: '「それってあなたの感想ですよね」を連呼し、会話を成立させない。' },
  { id: 'el308', type: 'elite', name: '冷笑系コメンテーター', hp: 700, atk: 45, def: 110, icon: '😏', desc: 'すべてを斜め上から見下し、反論されるとブロックして逃げる。' },
  { id: 'e309', type: 'normal', name: '限界アラサー女子', hp: 280, atk: 30, def: 20, icon: '🍷', desc: 'ストロングゼロを片手に深夜に病みツイートを連発する。' },
  { id: 'e310', type: 'normal', name: 'パパ活パパ', hp: 800, atk: 5, def: 5, icon: '👨', desc: 'ただお金をむしり取られるだけの存在。倒すとボーナス資金。' },
  { id: 'el311', type: 'elite', name: '港区女子', hp: 650, atk: 70, def: 60, icon: '🍾', desc: 'ラウンジで培った交渉術で、プレイヤーの財布にダイレクトアタック。' },
  { id: 'r312', type: 'rare', name: '✨ 西麻布の黒幕', hp: 4500, atk: 350, def: 400, icon: '🕴️', desc: 'すべての港区女子とパパを裏で操る絶対権力者。' },
  { id: 'el313', type: 'elite', name: '反ワク・反マスク連合軍', hp: 900, atk: 60, def: 80, icon: '🦠', desc: '謎の自然治癒力を信じており、状態異常が効かない。' },
  { id: 'e314', type: 'normal', name: '自然派ママ', hp: 400, atk: 35, def: 40, icon: '🌿', desc: '手作り石鹸と謎のオーガニック理論で物理攻撃を防ぐ。' },
  { id: 'e315', type: 'normal', name: '無断転載BOT', hp: 120, atk: 15, def: 10, icon: '🔄', desc: 'バズったツイートを数秒でパクって自分の手柄にする。' },
  { id: 'e316', type: 'normal', name: 'パクツイ職人', hp: 250, atk: 40, def: 20, icon: '🐦', desc: '無断転載BOTの進化系。パクった内容で本家よりバズる。' },
  { id: 'r317', type: 'rare', name: '✨ 裏垢特定班のリーダー', hp: 3800, atk: 400, def: 150, icon: '🕵️', desc: '瞳に映った景色から住所を特定する伝説のスナイパー。' },
  { id: 'el318', type: 'elite', name: '開示請求のプロ', hp: 1200, atk: 10, def: 500, icon: '⚖️', desc: '超絶硬い防御力を持ち、攻撃するたびに精神ダメージを反射してくる。' },
  { id: 'el319', type: 'elite', name: 'プロ市民', hp: 850, atk: 75, def: 90, icon: '📢', desc: '拡声器で鼓膜を破壊し、数の暴力で圧倒してくる。' },
  { id: 'el320', type: 'elite', name: 'まとめサイト管理人', hp: 750, atk: 65, def: 70, icon: '💻', desc: '対立煽りでプレイヤーを混乱させ、同士討ちを狙う。' },
  { id: 'e321', type: 'normal', name: 'アフィカスの亡霊', hp: 300, atk: 25, def: 50, icon: '🔗', desc: '死してなお、アフィリエイトリンクを踏ませようと付き纏う。' },
  { id: 'e322', type: 'normal', name: '出会い厨', hp: 200, atk: 30, def: 15, icon: '💌', desc: '見境なくDMを送りつけ、ワンチャンを狙い続ける。' },
  { id: 'e323', type: 'normal', name: 'ネカマのおっさん', hp: 400, atk: 45, def: 35, icon: '🧔‍♀️', desc: '可愛いアイコンの中身。真実を知った時の精神ダメージは計り知れない。' },
  { id: 'el324', type: 'elite', name: 'プロのヒモ', hp: 550, atk: 80, def: 20, icon: '🪢', desc: '何もしないのに何故か許される才能を持つ。女の怨念を召喚して攻撃する。' },
  { id: 'el325', type: 'elite', name: 'メンヘラ製造機', hp: 700, atk: 95, def: 40, icon: '💔', desc: '甘い言葉で近づき、関わった人間をすべてメンヘラに変える。' },
  { id: 'e326', type: 'normal', name: 'オーバードーズ患者', hp: 150, atk: 60, def: 5, icon: '💊', desc: '自暴自棄の超火力で突っ込んでくるが、勝手に倒れることもある。' },
  { id: 'e327', type: 'normal', name: 'ホストの痛客', hp: 350, atk: 50, def: 30, icon: '🍾', desc: '店内でのマナーが悪く、シャンパンボトルを振り回す。' },
  { id: 'el328', type: 'elite', name: '地下アイドルのTO', hp: 800, atk: 70, def: 100, icon: '👑', desc: '圧倒的な財力と古参の威厳で界隈を仕切るトップオタ。' },
  { id: 'el329', type: 'elite', name: '出禁になった厄介オタ', hp: 600, atk: 85, def: 50, icon: '🚫', desc: 'ルール無用で暴れ回る。物理的な危害を加えてくる。' },
  { id: 'e330', type: 'normal', name: '全ロスした投資家', hp: 100, atk: 99, def: 0, icon: '📉', desc: 'レバレッジ100倍で全財産を失い、捨て身の一撃を放ってくる。' },

  // ================= 🐰 記念すべきエネミー No.100 =================
  { id: 'r100', type: 'rare', name: '✨ 炎上芸術祭の知事', hp: 10000, atk: 100, def: 999, icon: '🏛️🔥', desc: 'リコール署名を集められてもビクともしない強靭なメンタル（防御力）の持ち主。' },

  // ================= 🐰 第7弾 追加エネミー（パンデミック＆社会の闇編） =================
  { id: 'e401', type: 'normal', name: 'ノーマスクおじさん', hp: 180, atk: 40, def: 10, icon: '👴', desc: 'マスクをつけずに大声で怒鳴り散らす。飛沫ダメージあり。' },
  { id: 'e402', type: 'normal', name: '自粛警察', hp: 200, atk: 35, def: 30, icon: '🚓', desc: '正義を振りかざし、他人の行動を監視して張り紙をしていく。' },
  { id: 'e403', type: 'normal', name: 'パチンコ屋の行列', hp: 300, atk: 50, def: 15, icon: '🎰', desc: 'どんな緊急事態でも決して並ぶことをやめない集団。' },
  { id: 'e404', type: 'normal', name: '買い占め転売ヤー', hp: 150, atk: 20, def: 50, icon: '🛒', desc: 'トイレットペーパーを全て買い占めて高額で売りつける。逃げ足が速い。' },
  { id: 'el405', type: 'elite', name: '反ワクインフルエンサー', hp: 500, atk: 70, def: 40, icon: '🗣️', desc: '謎の陰謀論を唱え、信者ファンネルを飛ばして攻撃してくる。' },
  { id: 'el406', type: 'elite', name: '路上飲みの若者集団', hp: 600, atk: 80, def: 20, icon: '🍻', desc: 'ゴミを撒き散らしながら集団で絡んでくる。めちゃくちゃタチが悪い。' },
  { id: 'e407', type: 'normal', name: '闇バイトの指示役', hp: 250, atk: 60, def: 10, icon: '📱', desc: '安全な場所から若者を操り、手を汚さずに攻撃してくる。' },
  { id: 'el408', type: 'elite', name: '暴走する電動キックボード', hp: 400, atk: 90, def: 30, icon: '🛴', desc: 'ノーヘルで信号無視をかまし、突進してくる凶悪な乗り物。' },
  { id: 'r409', type: 'rare', name: '✨ ゴー○ューおじさん', hp: 2000, atk: 120, def: 80, icon: '🥩', desc: '税金を使ってステーキを食べていた伝説のおじさん。' },
  { id: 'r410', type: 'rare', name: '✨ 中抜き男爵', hp: 3000, atk: 150, def: 200, icon: '🎩', desc: '補助金を9割中抜きする錬金術師。倒すと大量のゴールド（EXP）を落とす。' }
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
