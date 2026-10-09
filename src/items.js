export const ITEMS = [
  // ================= 武器 (Weapon) =================
  // [N] ノーマル
  { id: 'w1', type: 'weapon', rarity: 'N', name: '割り箸', atk: 2, def: 0, hp: 0, icon: '🥢', desc: 'とりあえず反撃するための武器。すぐ折れる。' },
  { id: 'w2', type: 'weapon', rarity: 'N', name: '古びたキーボード', atk: 5, def: 0, hp: 0, icon: '⌨️', desc: 'レスバの基本装備。エンターキーが外れかけ。' },
  { id: 'w3', type: 'weapon', rarity: 'N', name: '丸めたチラシ', atk: 1, def: 1, hp: 0, icon: '🗞️', desc: 'ハエを叩くのに丁度いい。' },
  { id: 'w4', type: 'weapon', rarity: 'N', name: '赤えんぴつ', atk: 3, def: 0, hp: 0, icon: '✏️', desc: 'アンケートに丸をつけるための由緒正しき武器。' },
  
  // [R] レア
  { id: 'w10', type: 'weapon', rarity: 'R', name: 'らびのニンジンソード', atk: 15, def: 0, hp: 0, icon: '🥕', desc: 'らびたんが齧りかけの剣。ビタミン豊富。' },
  { id: 'w11', type: 'weapon', rarity: 'R', name: 'ゲーミングマウス', atk: 18, def: 0, hp: 0, icon: '🖱️', desc: '7色に光る。クリック速度が上がり連射可能。' },
  { id: 'w12', type: 'weapon', rarity: 'R', name: 'ピコピコハンマー', atk: 10, def: 0, hp: 0, icon: '🔨', desc: '殴ると可愛い音が鳴る。精神的ダメージが高い。' },
  { id: 'w13', type: 'weapon', rarity: 'R', name: '論破の辞書', atk: 20, def: 0, hp: 0, icon: '📖', desc: '角で殴ると物理的にも痛い。' },
  
  // [SR] スーパーレア
  { id: 'w20', type: 'weapon', rarity: 'SR', name: '正論の槍', atk: 45, def: 0, hp: 0, icon: '🔱', desc: '相手の矛盾を突く鋭い武器。ぐうの音も出ない。' },
  { id: 'w21', type: 'weapon', rarity: 'SR', name: 'バズ・バズーカ', atk: 55, def: 0, hp: 0, icon: '🚀', desc: '一撃で話題をかっさらう強力な重火器。' },
  { id: 'w22', type: 'weapon', rarity: 'SR', name: '黄金のマイク', atk: 40, def: 10, hp: 0, icon: '🎤', desc: '発言力が爆上がりし、周囲を魅了する。' },
  
  // [UR] ウルトラレア
  { id: 'w30', type: 'weapon', rarity: 'UR', name: '伝説のクソリプハンマー', atk: 120, def: 0, hp: 0, icon: '⚒️', desc: '相手のHPと精神を完全に粉砕する最凶の武器。' },
  { id: 'w31', type: 'weapon', rarity: 'UR', name: '全知全能のアンケート用紙', atk: 150, def: 0, hp: 0, icon: '📜', desc: '世界の真理を書き込める神の紙。' },
  { id: 'w32', type: 'weapon', rarity: 'UR', name: '神剣エクスカリバー（百均）', atk: 111, def: 11, hp: 11, icon: '🗡️', desc: '百均で売っていた謎の剣。なぜかめちゃくちゃ強い。' },


  // ================= 防具 (Armor) =================
  // [N] ノーマル
  { id: 'a1', type: 'armor', rarity: 'N', name: 'ペラペラのダンボール', atk: 0, def: 3, hp: 0, icon: '📦', desc: 'ないよりはマシ。雨に弱い。' },
  { id: 'a2', type: 'armor', rarity: 'N', name: '使い古したジャージ', atk: 0, def: 5, hp: 10, icon: '👕', desc: '絶妙にダサいが、着心地は良い。' },
  { id: 'a3', type: 'armor', rarity: 'N', name: '紙コップの兜', atk: 0, def: 2, hp: 0, icon: '🥤', desc: '頭を守っている気分になれる。' },
  
  // [R] レア
  { id: 'a10', type: 'armor', rarity: 'R', name: '匿名希望のマスク', atk: 0, def: 15, hp: 0, icon: '😷', desc: '身バレを防ぐ安心感で防御力が上がる。' },
  { id: 'a11', type: 'armor', rarity: 'R', name: '厚手のパーカー', atk: 0, def: 20, hp: 15, icon: '🧥', desc: '引きこもりには必須の快適な防御服。' },
  { id: 'a12', type: 'armor', rarity: 'R', name: 'おなべのフタ', atk: 0, def: 25, hp: 0, icon: '🥘', desc: '意外と硬い。伝説の勇者も愛用したとか。' },
  
  // [SR] スーパーレア
  { id: 'a20', type: 'armor', rarity: 'SR', name: 'もこもこウサ耳フード', atk: 0, def: 40, hp: 50, icon: '🐰', desc: '相手の攻撃をフワッと吸収する可愛い防具。' },
  { id: 'a21', type: 'armor', rarity: 'SR', name: 'スルー・シールド', atk: 0, def: 55, hp: 0, icon: '🛡️', desc: 'どんな煽りコメントも綺麗に受け流す魔法の盾。' },
  
  // [UR] ウルトラレア
  { id: 'a30', type: 'armor', rarity: 'UR', name: '鋼のメンタルアーマー', atk: 0, def: 150, hp: 0, icon: '🤖', desc: 'どんな誹謗中傷もノーダメージになる無敵の鎧。' },
  { id: 'a31', type: 'armor', rarity: 'UR', name: '絶対領域バリア', atk: 0, def: 200, hp: 100, icon: '🌌', desc: '誰も踏み込めない神聖なオーラで身を包む。' },


  // ================= アクセサリー (Accessory) =================
  // [N] ノーマル
  { id: 'ac1', type: 'accessory', rarity: 'N', name: '生えかけの草「w」', atk: 0, def: 0, hp: 15, icon: '🌱', desc: '笑うと少し元気になる。' },
  { id: 'ac2', type: 'accessory', rarity: 'N', name: 'その辺で拾った10円玉', atk: 0, def: 0, hp: 5, icon: '🪙', desc: '少しだけ得した気分になれる。' },
  
  // [R] レア
  { id: 'ac10', type: 'accessory', rarity: 'R', name: '煽り耐性のお守り', atk: 0, def: 5, hp: 30, icon: '🧿', desc: 'ストレスを軽減してくれるありがたいお守り。' },
  { id: 'ac11', type: 'accessory', rarity: 'R', name: '魔剤エナジードリンク', atk: 10, def: 0, hp: 20, icon: '🥫', desc: '飲むと一時的に無敵になった気がする。' },
  
  // [SR] スーパーレア
  { id: 'ac20', type: 'accessory', rarity: 'SR', name: '高みの見物のティーカップ', atk: 0, def: 10, hp: 80, icon: '☕', desc: '争いを見ながら飲む紅茶はうまい。HP大幅UP。' },
  { id: 'ac21', type: 'accessory', rarity: 'SR', name: '黄金のニンジン', atk: 15, def: 15, hp: 50, icon: '🥕', desc: 'らびたんの大好物。持っていると運気が上がる。' },
  
  // [UR] ウルトラレア
  { id: 'ac30', type: 'accessory', rarity: 'UR', name: '王者のサングラス', atk: 25, def: 25, hp: 150, icon: '🕶️', desc: '圧倒的なオーラを放ち、ザコを寄せ付けない。' },
  { id: 'ac31', type: 'accessory', rarity: 'UR', name: 'らびたんのぬいぐるみ', atk: 50, def: 50, hp: 200, icon: '🧸', desc: 'サイトのマスコット。すべてのステータスが激増する。' },

  // ================= 🐰 第2弾 追加アイテム (20種) =================
  // --- 武器 ---
  { id: 'w101', type: 'weapon', rarity: 'N', name: '抜けかけたLANケーブル', atk: 4, def: 0, hp: 0, icon: '🔌', desc: '少し引っ張るとすぐ切断される。' },
  { id: 'w102', type: 'weapon', rarity: 'N', name: '丸めたティッシュ', atk: 1, def: 0, hp: 0, icon: '🧻', desc: '画面を拭くのには便利。攻撃力は皆無。' },
  { id: 'w103', type: 'weapon', rarity: 'R', name: 'ネギ', atk: 12, def: 0, hp: 0, icon: '🧅', desc: '振ると謎の歌が聞こえてくる気がする。' },
  { id: 'w104', type: 'weapon', rarity: 'R', name: '光るゲーミングキーボード', atk: 22, def: 0, hp: 0, icon: '🌈', desc: '7色に光るだけで強くなった気がする。' },
  { id: 'w105', type: 'weapon', rarity: 'SR', name: '物理サーバーラック', atk: 60, def: 20, hp: 0, icon: '🗄️', desc: 'とても重い。角で殴ると致命傷になる。' },
  { id: 'w106', type: 'weapon', rarity: 'SR', name: '炎上中のスマホ', atk: 70, def: 0, hp: -10, icon: '📱', desc: '触るだけで火傷するが、破壊力は抜群。' },
  { id: 'w107', type: 'weapon', rarity: 'UR', name: '5000兆円の札束', atk: 999, def: 0, hp: 0, icon: '💴', desc: '札束で相手の顔を往復ビンタする最強の物理兵器。' },
  { id: 'w108', type: 'weapon', rarity: 'UR', name: '運営のBANハンマー', atk: 500, def: 50, hp: 0, icon: '🔨', desc: 'すべてを「無」に帰す権力の象徴。' },

  // --- 防具 ---
  { id: 'a101', type: 'armor', rarity: 'N', name: 'スーパーのレジ袋', atk: 0, def: 4, hp: 0, icon: '🛍️', desc: '風に乗って飛んでいきそう。' },
  { id: 'a102', type: 'armor', rarity: 'R', name: '推しのライブTシャツ', atk: 0, def: 18, hp: 20, icon: '👕', desc: '推しへの愛が物理的なダメージを軽減する。' },
  { id: 'a103', type: 'armor', rarity: 'R', name: 'ゲーミング座椅子', atk: 0, def: 30, hp: 10, icon: '💺', desc: '座り心地は良いが、動くのが面倒になる。' },
  { id: 'a104', type: 'armor', rarity: 'SR', name: 'Wi-Fiルーターのバリア', atk: 0, def: 60, hp: 30, icon: '📶', desc: '電波の壁で物理攻撃をシャットアウト。' },
  { id: 'a105', type: 'armor', rarity: 'UR', name: 'タワマン最上階', atk: 0, def: 300, hp: 200, icon: '🏢', desc: '下界の攻撃は一切届かない。圧倒的防御。' },

  // --- アクセサリー ---
  { id: 'ac101', type: 'accessory', rarity: 'N', name: '誰かの猫の画像', atk: 0, def: 0, hp: 20, icon: '🐈', desc: '見ているだけで少し癒やされる。' },
  { id: 'ac102', type: 'accessory', rarity: 'R', name: 'いいねボタン', atk: 5, def: 5, hp: 10, icon: '👍', desc: '押されるとちょっと嬉しい。' },
  { id: 'ac103', type: 'accessory', rarity: 'R', name: 'ブルーライトカット眼鏡', atk: 0, def: 15, hp: 15, icon: '👓', desc: '目の疲れを軽減し、長期戦に対応できる。' },
  { id: 'ac104', type: 'accessory', rarity: 'SR', name: 'フォロワー1万人のバッジ', atk: 20, def: 20, hp: 50, icon: '🏅', desc: 'ちょっとしたインフルエンサー気分でステータスUP。' },
  { id: 'ac105', type: 'accessory', rarity: 'UR', name: '石油王のブラックカード', atk: 100, def: 100, hp: 500, icon: '💳', desc: 'すべてを金で解決する魔法のカード。' },
  // ================= 🐰 第3弾 追加アイテム（ネットの闇鍋編：30種） =================
  // --- 武器 ---
  { id: 'w201', type: 'weapon', rarity: 'N', name: 'FF外から失礼する剣', atk: 8, def: 0, hp: 0, icon: '🤺', desc: '突然斬りかかるための礼儀正しい剣。' },
  { id: 'w202', type: 'weapon', rarity: 'N', name: 'クソ長文DM', atk: 5, def: 0, hp: 0, icon: '📜', desc: '読ませるだけで相手の精神力を奪う。' },
  { id: 'w203', type: 'weapon', rarity: 'R', name: '謎のAIイラスト生成機', atk: 25, def: 0, hp: 0, icon: '🤖', desc: '指が6本あるキャラを生み出して相手を混乱させる。' },
  { id: 'w204', type: 'weapon', rarity: 'R', name: '過去の黒歴史ツイート', atk: 30, def: 0, hp: 0, icon: '🐦', desc: '掘り返して投げつけると致命傷になる。' },
  { id: 'w205', type: 'weapon', rarity: 'SR', name: '赤スパ（1万円）', atk: 60, def: 0, hp: 10, icon: '🧧', desc: '圧倒的な財力で相手の目をくらませる。' },
  { id: 'w206', type: 'weapon', rarity: 'SR', name: '論破王の唇', atk: 80, def: 0, hp: 0, icon: '👄', desc: '「それってあなたの感想ですよね？」と物理で殴る。' },
  { id: 'w207', type: 'weapon', rarity: 'UR', name: '開示請求の通知書', atk: 400, def: 100, hp: 0, icon: '✉️', desc: '届いた瞬間、相手は顔面蒼白になり震え上がる。' },
  { id: 'w208', type: 'weapon', rarity: 'UR', name: '炎上系YouTuberのカメラ', atk: 250, def: 0, hp: 0, icon: '📹', desc: '迷惑行為を撮影しながら殴りかかる無敵の人専用武器。' },
  { id: 'w209', type: 'weapon', rarity: 'R', name: '誰かが落としたUSB', atk: 10, def: 0, hp: -5, icon: '💾', desc: 'PCに挿した瞬間、謎のウイルスが解き放たれる。' },
  { id: 'w210', type: 'weapon', rarity: 'SR', name: '自演用サブ垢の群れ', atk: 50, def: 0, hp: 0, icon: '👥', desc: '一斉に相手を攻撃する卑劣極まりない戦法。' },

  // --- 防具 ---
  { id: 'a201', type: 'armor', rarity: 'N', name: 'すりガラス', atk: 0, def: 6, hp: 0, icon: '🪟', desc: 'よく見えないが、とりあえず隠れているつもり。' },
  { id: 'a202', type: 'armor', rarity: 'N', name: 'モザイク処理', atk: 0, def: 8, hp: 5, icon: '🌫️', desc: '顔だけは守ることができる。' },
  { id: 'a203', type: 'armor', rarity: 'R', name: 'バ美肉アバター', atk: 0, def: 25, hp: 10, icon: '👧', desc: 'おじさんであることを隠すことで精神的ダメージを軽減。' },
  { id: 'a204', type: 'armor', rarity: 'R', name: 'セキュリティソフトの壁', atk: 0, def: 35, hp: 0, icon: '🛡️', desc: 'スパムを弾くが、時々自分も動けなくなる。' },
  { id: 'a205', type: 'armor', rarity: 'SR', name: '鍵アカウントの扉', atk: 0, def: 80, hp: 20, icon: '🔒', desc: '身内以外からの攻撃を完全にシャットアウト。' },
  { id: 'a206', type: 'armor', rarity: 'SR', name: '信者の擁護', atk: 0, def: 60, hp: 50, icon: '🙌', desc: '何をしてもファンが勝手に庇ってくれる。' },
  { id: 'a207', type: 'armor', rarity: 'UR', name: '弁護士特約', atk: 0, def: 250, hp: 100, icon: '👨‍⚖️', desc: '最強の法的な壁。並の攻撃はすべて無効化される。' },
  { id: 'a208', type: 'armor', rarity: 'UR', name: '無敵の人のオーラ', atk: 100, def: 150, hp: 50, icon: '🌪️', desc: '失うものが何もないため、防御の概念を超越している。' },
  { id: 'a209', type: 'armor', rarity: 'R', name: '段ボールハウス', atk: 0, def: 10, hp: 20, icon: '📦', desc: '落ち着く空間だが防御力はお察し。' },
  { id: 'a210', type: 'armor', rarity: 'SR', name: 'VPNの隠れ蓑', atk: 0, def: 70, hp: 0, icon: '🌐', desc: '発信元を偽装し、追跡を困難にする。' },

  // --- アクセサリー ---
  { id: 'ac201', type: 'accessory', rarity: 'N', name: '草生える草', atk: 0, def: 0, hp: 10, icon: '🌿', desc: 'とりあえず「ｗｗｗ」と入力しておく用。' },
  { id: 'ac202', type: 'accessory', rarity: 'N', name: '既読スルーの証', atk: 0, def: 5, hp: 5, icon: '📱', desc: '相手の怒りを少しだけ買う。' },
  { id: 'ac203', type: 'accessory', rarity: 'R', name: 'ミュートボタン', atk: 0, def: 10, hp: 20, icon: '🔇', desc: '不快な声を聞こえなくする素晴らしいアイテム。' },
  { id: 'ac204', type: 'accessory', rarity: 'R', name: 'リツイートの嵐', atk: 15, def: 0, hp: 10, icon: '🔄', desc: '通知をパンクさせることで相手を疲弊させる。' },
  { id: 'ac205', type: 'accessory', rarity: 'SR', name: 'ブロック機能', atk: 0, def: 30, hp: 30, icon: '🚫', desc: 'この世から対象を消し去る魔法の力。' },
  { id: 'ac206', type: 'accessory', rarity: 'SR', name: '承認欲求モンスターの心', atk: 40, def: -20, hp: 100, icon: '🧟', desc: '「いいね」を求めてHPが増えるが、防御は下がる。' },
  { id: 'ac207', type: 'accessory', rarity: 'UR', name: '青い認証バッジ', atk: 50, def: 50, hp: 100, icon: '☑️', desc: 'お金で買える権威。持っているだけでドヤれる。' },
  { id: 'ac208', type: 'accessory', rarity: 'UR', name: 'ブラック企業の名刺', atk: 150, def: -50, hp: 200, icon: '🏢', desc: '過労により痛覚が麻痺しているためHPが激増。' },
  { id: 'ac209', type: 'accessory', rarity: 'R', name: '深夜テンション', atk: 25, def: -10, hp: 0, icon: '🌙', desc: '夜中だけ攻撃力が上がるが翌朝に後悔する。' },
  { id: 'ac210', type: 'accessory', rarity: 'SR', name: '特定班のメガネ', atk: 30, def: 30, hp: 0, icon: '👓', desc: '相手の弱点を瞬時に見抜く恐ろしいメガネ。' },

  // ================= 👑 レジェンドレア (LR) =================
  { id: 'w_lr1', type: 'weapon', rarity: 'LR', name: '真・エクスカリバー（本物）', atk: 9999, def: 9999, hp: 9999, icon: '🗡️✨', desc: 'この広場の創造主が落としたとされる、すべてを破壊する神の剣。' }
];

export const rollGacha = () => {
  const rand = Math.random() * 100;
  let targetRarity = 'N';
  
  if (rand < 0.004) targetRarity = 'LR';   // 0.004% (約2万5000分の1)
  else if (rand < 0.504) targetRarity = 'UR'; // 0.5%
  else if (rand < 5.504) targetRarity = 'SR'; // 5.0%
  else if (rand < 30.004) targetRarity = 'R'; // 24.5%
  else targetRarity = 'N';                    // 残り約70%

  const pool = ITEMS.filter(item => item.rarity === targetRarity);
  return pool[Math.floor(Math.random() * pool.length)];
};
