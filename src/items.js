export const ITEMS = [
  // ================= 武器 (Weapon) =================
  // [N] ノーマル
  { id: 'w1', type: 'weapon', rarity: 'N', name: '割り箸', atk: 2, def: 0, hp: 0, icon: '🥢', desc: 'とりあえず反撃するための武器。すぐ折れる。' },
  { id: 'w2', type: 'weapon', rarity: 'N', name: '古びたキーボード', atk: 5, def: 0, hp: 0, icon: '⌨️', desc: 'レスバの基本装備。エンターキーが外れかけ。' },
  { id: 'w3', type: 'weapon', rarity: 'N', name: '丸めたチラシ', atk: 1, def: 1, hp: 0, icon: '🗞️', desc: 'ハエを叩くのに丁度いい。' },
  { id: 'w4', type: 'weapon', rarity: 'N', name: '赤えんぴつ', atk: 3, def: 0, hp: 0, icon: '✏️', desc: 'アンケートに丸をつけるための由緒正しき武器。' },
  
  // [R] レア
  { id: 'w10', type: 'weapon', rarity: 'R', name: 'らびのニンジンソード', atk: 15, def: 0, hp: 0, icon: '🥕', desc: 'らびたんが齧りかけの剣。ビタミン豊富。' },
  { id: 'w11', type: 'weapon', rarity: 'R', name: 'ゲーミングマウス', atk: 18, def: 0, hp: 0, icon: '🖱️', desc: '7色に光る。クリック速度が上がり連射可能。', effect: 'double_attack' },
  { id: 'w12', type: 'weapon', rarity: 'R', name: 'ピコピコハンマー', atk: 10, def: 0, hp: 0, icon: '🔨', desc: '殴ると可愛い音が鳴る。精神的ダメージが高い。' },
  { id: 'w13', type: 'weapon', rarity: 'R', name: '論破の辞書', atk: 20, def: 0, hp: 0, icon: '📖', desc: '角で殴ると物理的にも痛い。', effect: 'mental_damage' },
  
  // [SR] スーパーレア
  { id: 'w20', type: 'weapon', rarity: 'SR', name: '正論の槍', atk: 45, def: 0, hp: 0, icon: '🔱', desc: '相手の矛盾を突く鋭い武器。ぐうの音も出ない。', effect: 'mental_damage' },
  { id: 'w21', type: 'weapon', rarity: 'SR', name: 'バズ・バズーカ', atk: 55, def: 0, hp: 0, icon: '🚀', desc: '一撃で話題をかっさらう強力な重火器。' },
  { id: 'w22', type: 'weapon', rarity: 'SR', name: '黄金のマイク', atk: 40, def: 10, hp: 0, icon: '🎤', desc: '発言力が爆上がりし、周囲を魅了する。' },
  
  // [UR] ウルトラレア
  { id: 'w30', type: 'weapon', rarity: 'UR', name: '伝説のクソリプハンマー', atk: 120, def: 0, hp: 0, icon: '⚒️', desc: '相手のHPと精神を完全に粉砕する最凶の武器。', effect: 'mental_damage' },
  { id: 'w31', type: 'weapon', rarity: 'UR', name: '全知全能のアンケート用紙', atk: 150, def: 0, hp: 0, icon: '📜', desc: '世界の真理を書き込める神の紙。' },
  { id: 'w32', type: 'weapon', rarity: 'UR', name: '神剣エクスカリバー（百均）', atk: 111, def: 11, hp: 11, icon: '🗡️', desc: '百均で売っていた謎の剣。なぜかめちゃくちゃ強い。', effect: 'double_attack' },


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
  { id: 'a21', type: 'armor', rarity: 'SR', name: 'スルー・シールド', atk: 0, def: 55, hp: 0, icon: '🛡️', desc: 'どんな煽りコメントも綺麗に受け流す魔法の盾。', effect: 'dodge_up' },
  
  // [UR] ウルトラレア
  { id: 'a30', type: 'armor', rarity: 'UR', name: '鋼のメンタルアーマー', atk: 0, def: 150, hp: 0, icon: '🤖', desc: 'どんな誹謗中傷もノーダメージになる無敵の鎧。', effect: 'regen' },
  { id: 'a31', type: 'armor', rarity: 'UR', name: '絶対領域バリア', atk: 0, def: 200, hp: 100, icon: '🌌', desc: '誰も踏み込めない神聖なオーラで身を包む。', effect: 'reflect' },


  // ================= アクセサリー (Accessory) =================
  // [N] ノーマル
  { id: 'ac1', type: 'accessory', rarity: 'N', name: '生えかけの草「w」', atk: 0, def: 0, hp: 15, icon: '🌱', desc: '笑うと少し元気になる。' },
  { id: 'ac2', type: 'accessory', rarity: 'N', name: 'その辺で拾った10円玉', atk: 0, def: 0, hp: 5, icon: '🪙', desc: '少しだけ得した気分になれる。' },
  
  // [R] レア
  { id: 'ac10', type: 'accessory', rarity: 'R', name: '煽り耐性のお守り', atk: 0, def: 5, hp: 30, icon: '🧿', desc: 'ストレスを軽減してくれるありがたいお守り。' },
  { id: 'ac11', type: 'accessory', rarity: 'R', name: '魔剤エナジードリンク', atk: 10, def: 0, hp: 20, icon: '🥫', desc: '飲むと一時的に無敵になった気がする。', effect: 'crit_up' },
  
  // [SR] スーパーレア
  { id: 'ac20', type: 'accessory', rarity: 'SR', name: '高みの見物のティーカップ', atk: 0, def: 10, hp: 80, icon: '☕', desc: '争いを見ながら飲む紅茶はうまい。HP大幅UP。' },
  { id: 'ac21', type: 'accessory', rarity: 'SR', name: '黄金のニンジン', atk: 15, def: 15, hp: 50, icon: '🥕', desc: 'らびたんの大好物。持っていると運気が上がる。', effect: 'regen' },
  
  // [UR] ウルトラレア
  { id: 'ac30', type: 'accessory', rarity: 'UR', name: '王者のサングラス', atk: 25, def: 25, hp: 150, icon: '🕶️', desc: '圧倒的なオーラを放ち、ザコを寄せ付けない。', effect: 'dodge_up' },
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
  { id: 'w206', type: 'weapon', rarity: 'SR', name: '論破王の唇', atk: 80, def: 0, hp: 0, icon: '👄', desc: '「それってあなたの感想ですよね？」と物理で殴る。', effect: 'mental_damage' },
  { id: 'w207', type: 'weapon', rarity: 'UR', name: '開示請求の通知書', atk: 400, def: 100, hp: 0, icon: '✉️', desc: '届いた瞬間、相手は顔面蒼白になり震え上がる。', effect: 'mental_damage' },
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

  // ================= 🐰 第4弾 追加アイテム（時事ネタ・ネットミーム爆増編：30種） =================
  // --- 武器 ---
  { id: 'w301', type: 'weapon', rarity: 'N', name: '謝罪文のスクショ', atk: 5, def: 0, hp: 0, icon: '📸', desc: '真っ黒な背景に白い文字。相手のミスを突きつける。' },
  { id: 'w302', type: 'weapon', rarity: 'N', name: 'ポエムのメモ帳', atk: 3, def: 0, hp: 0, icon: '📓', desc: '深夜に書かれた痛いポエム。精神攻撃用。' },
  { id: 'w303', type: 'weapon', rarity: 'R', name: '誹謗中傷のメガホン', atk: 25, def: 0, hp: 0, icon: '📣', desc: '大声で相手を非難する。非常にやかましい。' },
  { id: 'w304', type: 'weapon', rarity: 'R', name: '論破のソース（Wiki）', atk: 30, def: 0, hp: 0, icon: '🌐', desc: 'WikipediaのURLを貼り付けて相手を黙らせる。' },
  { id: 'w305', type: 'weapon', rarity: 'SR', name: '炎上中のアフィブログ', atk: 65, def: 0, hp: 0, icon: '🔥', desc: '他人の不幸を金に換える燃え盛る鈍器。' },
  { id: 'w306', type: 'weapon', rarity: 'SR', name: '暴露本', atk: 75, def: 0, hp: 0, icon: '📖', desc: '裏事情を暴露して社会的に抹殺する。' },
  { id: 'w307', type: 'weapon', rarity: 'UR', name: '未公開の文春砲', atk: 350, def: 0, hp: 0, icon: '💣', desc: '発射されたら最後、社会的地位が木端微塵になる。' },
  { id: 'w308', type: 'weapon', rarity: 'UR', name: '裏金の帳簿', atk: 500, def: -50, hp: 0, icon: '📒', desc: 'とんでもない破壊力を持つが、持っているだけでリスクがある。' },
  { id: 'w309', type: 'weapon', rarity: 'R', name: '有名人のサイン（偽）', atk: 15, def: 0, hp: 0, icon: '🖋️', desc: 'メルカリで買った。偽物だが殴れば痛い。' },
  { id: 'w310', type: 'weapon', rarity: 'SR', name: 'AI生成のフェイク画像', atk: 55, def: 0, hp: 0, icon: '🖼️', desc: '世論を操作する恐ろしい情報兵器。' },

  // --- 防具 ---
  { id: 'a301', type: 'armor', rarity: 'N', name: 'ガラケー', atk: 0, def: 10, hp: 0, icon: '📱', desc: 'とにかく物理的に硬い。二つ折りの盾。' },
  { id: 'a302', type: 'armor', rarity: 'N', name: 'エコーチェンバーの壁', atk: 0, def: 5, hp: 5, icon: '🧱', desc: '自分に都合のいい意見しか聞こえなくなる壁。' },
  { id: 'a303', type: 'armor', rarity: 'R', name: 'デジタルタトゥー', atk: 10, def: 30, hp: -10, icon: '🕸️', desc: '一生消えない呪いの防具。防御は高いがHPが減る。' },
  { id: 'a304', type: 'armor', rarity: 'R', name: 'サブアカウントの盾', atk: 0, def: 40, hp: 0, icon: '🛡️', desc: '本垢を守るための捨て駒。' },
  { id: 'a305', type: 'armor', rarity: 'SR', name: '通報ボタン', atk: 0, def: 75, hp: 0, icon: '🚨', desc: '押せば運営が飛んでくる（かもしれない）最強の盾。' },
  { id: 'a306', type: 'armor', rarity: 'SR', name: '限界オタクのパーカー', atk: 0, def: 50, hp: 50, icon: '🧥', desc: '推しへの執念で編み込まれた防御服。' },
  { id: 'a307', type: 'armor', rarity: 'UR', name: '上級国民の特権', atk: 0, def: 300, hp: 100, icon: '👑', desc: 'あらゆる攻撃を「なかったこと」にする最強の盾。' },
  { id: 'a308', type: 'armor', rarity: 'UR', name: '完全なる匿名性', atk: 0, def: 400, hp: 0, icon: '🥷', desc: '誰にも特定されない。実質無敵。' },
  { id: 'a309', type: 'armor', rarity: 'R', name: '課金アイテムの領収書', atk: 0, def: 25, hp: 15, icon: '🧾', desc: '束ねると意外と分厚い防御層になる。' },
  { id: 'a310', type: 'armor', rarity: 'SR', name: '記憶喪失（都合のいい）', atk: 0, def: 85, hp: 0, icon: '🤔', desc: '「記憶にございません」ですべての攻撃を無効化する。' },

  // --- アクセサリー ---
  { id: 'ac301', type: 'accessory', rarity: 'N', name: '謎の情報商材', atk: -5, def: -5, hp: 25, icon: '📀', desc: '買った後悔でHPだけが無駄に上がる。' },
  { id: 'ac302', type: 'accessory', rarity: 'N', name: 'サクラのレビュー', atk: 5, def: 0, hp: 5, icon: '🌸', desc: '星5の評価で少しだけ強くなった気がする。' },
  { id: 'ac303', type: 'accessory', rarity: 'R', name: 'バズったツイートの通知', atk: 20, def: 0, hp: 10, icon: '🔔', desc: '鳴り止まない通知音でアドレナリンが分泌される。' },
  { id: 'ac304', type: 'accessory', rarity: 'R', name: '推しのアクスタ', atk: 10, def: 10, hp: 20, icon: '🧍', desc: '一緒に戦ってくれているような気がする。' },
  { id: 'ac305', type: 'accessory', rarity: 'SR', name: 'パパ活の指南書', atk: 30, def: 0, hp: 50, icon: '📖', desc: '恐ろしい錬金術が書かれた禁書。' },
  { id: 'ac306', type: 'accessory', rarity: 'SR', name: '炎上保険', atk: 0, def: 60, hp: 40, icon: '📜', desc: '炎上した時のための備え。安心感が段違い。' },
  { id: 'ac307', type: 'accessory', rarity: 'UR', name: 'インサイダー情報', atk: 200, def: 0, hp: 0, icon: '📈', desc: '絶対に勝てる戦いしかしないための禁断の果実。' },
  { id: 'ac308', type: 'accessory', rarity: 'UR', name: '国家の機密データ', atk: 300, def: 300, hp: -100, icon: '💽', desc: '強大な力を得るが、常に命を狙われる。' },
  { id: 'ac309', type: 'accessory', rarity: 'R', name: '投げ銭の履歴', atk: 15, def: 5, hp: 0, icon: '💸', desc: '過去の栄光を振り返って自分を奮い立たせる。' },
  { id: 'ac310', type: 'accessory', rarity: 'SR', name: '示談書', atk: 0, def: 50, hp: 50, icon: '🤝', desc: '札束で和解した証。防御とHPが大きく上がる。' },

  // ================= 👑 レジェンドレア (LR) =================
  { id: 'w_lr1', type: 'weapon', rarity: 'LR', name: '真・エクスカリバー（本物）', atk: 9999, def: 9999, hp: 9999, icon: '🗡️✨', desc: 'この広場の創造主が落としたとされる、すべてを破壊する神の剣。' },

  // ================= 🐰 第5弾 追加アイテム（ディープなネットの闇編：30種） =================
  // --- 武器 ---
  { id: 'w401', type: 'weapon', rarity: 'N', name: '魔法のストロングゼロ（缶）', atk: 30, def: -10, hp: -10, icon: '🍺', desc: '飲むと痛覚が麻痺して強くなるが、寿命が縮む。' },
  { id: 'w402', type: 'weapon', rarity: 'R', name: '私人逮捕用の手錠', atk: 45, def: 0, hp: 0, icon: '🔗', desc: '勝手に相手を拘束する。やりすぎると自分が捕まる。' },
  { id: 'w403', type: 'weapon', rarity: 'N', name: '回転寿司の醤油ボトル', atk: 15, def: 0, hp: -5, icon: '🍶', desc: '舐め回してから相手に投げつけるバイオ兵器。' },
  { id: 'w404', type: 'weapon', rarity: 'SR', name: 'ホストの売掛金', atk: 120, def: 0, hp: 0, icon: '📝', desc: '重すぎるツケを鈍器にして殴る。相手は死ぬ。' },
  { id: 'w405', type: 'weapon', rarity: 'R', name: '陰謀論のビラ', atk: 35, def: 0, hp: 0, icon: '📄', desc: '読ませることで相手の脳を破壊する。' },
  { id: 'w406', type: 'weapon', rarity: 'SR', name: '頂き女子のマニュアル', atk: 100, def: 0, hp: 50, icon: '📔', desc: '相手からHPと金を効率よく吸い取る禁断の書。' },
  { id: 'w407', type: 'weapon', rarity: 'UR', name: '青いチェックマーク（物理）', atk: 250, def: 100, hp: 0, icon: '☑️', desc: '角が尖っていて物理的に刺さる。' },
  { id: 'w408', type: 'weapon', rarity: 'SR', name: '特定班のカメラ', atk: 80, def: 0, hp: 0, icon: '📷', desc: 'フラッシュを焚いて相手の個人情報を奪う。' },
  { id: 'w409', type: 'weapon', rarity: 'R', name: '炎上ツイートのスクショ', atk: 50, def: 0, hp: 0, icon: '📱', desc: '印刷して丸めて投げる。精神ダメージが大きい。' },
  { id: 'w410', type: 'weapon', rarity: 'UR', name: '退職代行の通知書', atk: 400, def: 0, hp: 0, icon: '✉️', desc: 'これを出された相手は一切の反論を許されず消滅する。' },

  // --- 防具 ---
  { id: 'a401', type: 'armor', rarity: 'N', name: '地雷系メイク', atk: 0, def: 20, hp: 10, icon: '💄', desc: '泣きはらしたような目で相手の同情を誘う。' },
  { id: 'a402', type: 'armor', rarity: 'R', name: '歌舞伎町のランドセル', atk: 0, def: 40, hp: 20, icon: '🎒', desc: 'MCMのリュック。謎の防御力を誇る。' },
  { id: 'a403', type: 'armor', rarity: 'N', name: 'アルミホイルの帽子', atk: 0, def: 15, hp: 0, icon: '🧢', desc: '5G電波や思考盗聴から脳を守ってくれる（らしい）。' },
  { id: 'a404', type: 'armor', rarity: 'SR', name: '転売ヤーの段ボール砦', atk: 0, def: 80, hp: 0, icon: '📦', desc: '大量の在庫で作られた要塞。非常に硬い。' },
  { id: 'a405', type: 'armor', rarity: 'UR', name: 'パパのプラチナカード', atk: 0, def: 200, hp: 100, icon: '💳', desc: 'すべての攻撃を財力で跳ね返す最強の盾。' },
  { id: 'a406', type: 'armor', rarity: 'SR', name: '配信部屋の防音壁', atk: 0, def: 90, hp: 0, icon: '🧱', desc: 'どんなに叫んでも外部に音が漏れないため安全。' },
  { id: 'a407', type: 'armor', rarity: 'UR', name: '匿名VPNの盾', atk: 0, def: 250, hp: 0, icon: '🌐', desc: '発信元を完全に偽装し、一切の追跡を許さない。' },
  { id: 'a408', type: 'armor', rarity: 'R', name: 'マイナンバーカード', atk: 0, def: 50, hp: -10, icon: '🪪', desc: '防御力は高いが、持っているだけで個人情報が漏れていく。' },
  { id: 'a409', type: 'armor', rarity: 'N', name: '立ちんぼの看板', atk: 0, def: 25, hp: 0, icon: '🪧', desc: '「助けてください」と書かれたダンボール。同情を買う。' },
  { id: 'a410', type: 'armor', rarity: 'SR', name: 'ホストクラブのVIPルーム', atk: 0, def: 150, hp: 50, icon: '🛋️', desc: '一般人は絶対に入れない安全地帯。' },

  // --- アクセサリー ---
  { id: 'ac401', type: 'accessory', rarity: 'R', name: '魔法の咳止めシロップ', atk: 20, def: 0, hp: -20, icon: '💊', desc: '飲むとフワフワして強くなるが、体に悪い。' },
  { id: 'ac402', type: 'accessory', rarity: 'N', name: 'マッチングアプリのアカウント', atk: 0, def: 10, hp: 10, icon: '📱', desc: '常に誰かと繋がっている安心感を得られる。' },
  { id: 'ac403', type: 'accessory', rarity: 'SR', name: '港区女子のインスタ垢', atk: 30, def: 20, hp: 40, icon: '📸', desc: 'キラキラした日常を見せつけることで相手を絶望させる。' },
  { id: 'ac404', type: 'accessory', rarity: 'UR', name: 'ホストのシャンパンタワー', atk: 100, def: 50, hp: 200, icon: '🥂', desc: '圧倒的な財力の象徴。すべてのステータスが爆上がりする。' },
  { id: 'ac405', type: 'accessory', rarity: 'SR', name: 'FXのロスカット通知', atk: 80, def: -30, hp: 0, icon: '📉', desc: '絶望で痛覚が麻痺し、捨て身の攻撃力が上がる。' },
  { id: 'ac406', type: 'accessory', rarity: 'R', name: '仮想通貨のウォレット', atk: 15, def: 15, hp: 15, icon: '🪙', desc: '残高はゼロだが、いつか上がると信じている。' },
  { id: 'ac407', type: 'accessory', rarity: 'SR', name: '闇金の借用書', atk: 100, def: -50, hp: 0, icon: '📜', desc: '追い詰められた人間の底力を引き出す。' },
  { id: 'ac408', type: 'accessory', rarity: 'UR', name: '情報商材のUSBメモリ', atk: 150, def: 100, hp: 50, icon: '💾', desc: '「これで月収1000万」という幻覚で超人になれる。' },
  { id: 'ac409', type: 'accessory', rarity: 'N', name: 'スパチャの領収書', atk: 0, def: 0, hp: 25, icon: '🧾', desc: '推しに貢いだ証。ただの紙切れだが心は満たされる。' },
  { id: 'ac410', type: 'accessory', rarity: 'R', name: '推しのチェキ', atk: 25, def: 25, hp: 50, icon: '🖼️', desc: 'スマホの裏に挟んでいる。見るだけでHPが回復する。' },


  // ================= 🐰 第6弾 追加アイテム（さらなる界隈の闇編：30種） =================
  // --- 武器 ---
  { id: 'w501', type: 'weapon', rarity: 'N', name: 'お気持ち表明の長文ノート', atk: 25, def: 0, hp: 0, icon: '📝', desc: '読むだけで精神がすり減る。相手にデバフをかける。' },
  { id: 'w502', type: 'weapon', rarity: 'SR', name: '弁護士からの内容証明', atk: 150, def: 0, hp: 0, icon: '✉️', desc: 'これを受け取ったら最後、逃げることは許されない。' },
  { id: 'w503', type: 'weapon', rarity: 'UR', name: 'ポリコレ棒（純金製）', atk: 200, def: 50, hp: 0, icon: '🦯', desc: 'どんな正論もねじ伏せる無敵の武器。ただし自分が叩かれるリスクも。' },
  { id: 'w504', type: 'weapon', rarity: 'R', name: '指が6本あるAIイラスト', atk: 45, def: 0, hp: 0, icon: '🖼️', desc: '相手に「AIじゃん」と突っ込ませる隙を作る。' },
  { id: 'w505', type: 'weapon', rarity: 'SR', name: '論破王の黄色い本', atk: 85, def: 0, hp: 0, icon: '📘', desc: '物理で殴るのが一番強い。' },
  { id: 'w506', type: 'weapon', rarity: 'N', name: 'まとめサイトの対立煽り記事', atk: 30, def: 0, hp: -5, icon: '💻', desc: 'ヘイトを稼いで攻撃力を上げる。' },
  { id: 'w507', type: 'weapon', rarity: 'R', name: '西麻布のシャンパン', atk: 60, def: 0, hp: 0, icon: '🍾', desc: '中身をぶちまけて相手の視界を奪う。' },
  { id: 'w508', type: 'weapon', rarity: 'SR', name: 'メンヘラのポエム', atk: 110, def: 0, hp: -20, icon: '💔', desc: '呪いが込められており、持っているだけでHPが減る。' },
  { id: 'w509', type: 'weapon', rarity: 'N', name: 'アフィリエイトリンク', atk: 15, def: 0, hp: 5, icon: '🔗', desc: '相手が踏むと自分のお小遣いが増える。' },
  { id: 'w510', type: 'weapon', rarity: 'UR', name: '全財産を賭けたレバレッジ100倍ロング', atk: 500, def: -200, hp: -200, icon: '📈', desc: '一撃必殺か、即死か。運命のダイスロール。' },

  // --- 防具 ---
  { id: 'a501', type: 'armor', rarity: 'SR', name: '論破王のスマイルマスク', atk: 0, def: 120, hp: 0, icon: '😏', desc: '何を言われてもノーダメージになる無敵の表情。' },
  { id: 'a502', type: 'armor', rarity: 'N', name: '自然派ママの手作り石鹸', atk: 0, def: 20, hp: 10, icon: '🧼', desc: '無添加だから安全。プラシーボ効果でHPが回復。' },
  { id: 'a503', type: 'armor', rarity: 'UR', name: 'パパのブラックカード', atk: 0, def: 300, hp: 150, icon: '💳', desc: '上限なしの財力がすべての攻撃を無効化する。' },
  { id: 'a504', type: 'armor', rarity: 'SR', name: '地下アイドルのチェキ束', atk: 0, def: 100, hp: 50, icon: '📸', desc: '推しへの愛の厚みが、物理的な防弾チョッキとなる。' },
  { id: 'a505', type: 'armor', rarity: 'R', name: '反ワクのアルミホイル全身タイツ', atk: 0, def: 60, hp: 0, icon: '👽', desc: 'あらゆる電波や毒を弾くと言い張っている。' },
  { id: 'a506', type: 'armor', rarity: 'N', name: 'ネカマの自撮りアイコン', atk: 0, def: 25, hp: 0, icon: '👩', desc: '相手の攻撃を躊躇させる効果がある。' },
  { id: 'a507', type: 'armor', rarity: 'SR', name: 'プロ市民の拡声器', atk: 50, def: 80, hp: 0, icon: '📢', desc: '防具なのに攻撃力がある。大声で相手を威嚇する。' },
  { id: 'a508', type: 'armor', rarity: 'R', name: '開示請求の盾', atk: 0, def: 75, hp: 0, icon: '⚖️', desc: '攻撃してきた相手のIPアドレスを記録する。' },
  { id: 'a509', type: 'armor', rarity: 'N', name: '出会い系アプリのサクラ垢', atk: 0, def: 15, hp: 15, icon: '💌', desc: '無限にポイントを消費させ、相手を疲弊させる。' },
  { id: 'a510', type: 'armor', rarity: 'UR', name: '無敵の人の精神', atk: 100, def: 250, hp: 100, icon: '🔥', desc: '失うものが何もないため、どんな攻撃も恐れない。' },

  // --- アクセサリー ---
  { id: 'ac501', type: 'accessory', rarity: 'SR', name: 'ヒモの飼育マニュアル', atk: 0, def: 50, hp: 100, icon: '🪢', desc: '何もしなくても生きられる究極の生存術。' },
  { id: 'ac502', type: 'accessory', rarity: 'N', name: '無断転載されたバズツイート', atk: 10, def: 10, hp: 10, icon: '🔄', desc: '承認欲求が満たされ、全ステータスが少し上がる。' },
  { id: 'ac503', type: 'accessory', rarity: 'R', name: 'メンヘラ製造機のLINE履歴', atk: 40, def: -20, hp: 30, icon: '📱', desc: '読んでるだけで沼に落ちる。' },
  { id: 'ac504', type: 'accessory', rarity: 'UR', name: '界隈の黒幕の連絡先', atk: 150, def: 150, hp: 150, icon: '📞', desc: 'これさえあれば、どんなトラブルも裏で解決できる。' },
  { id: 'ac505', type: 'accessory', rarity: 'SR', name: 'オーバードーズ用のお薬セット', atk: 100, def: 0, hp: -50, icon: '💊', desc: '一時的に超サイヤ人になれるが、確実に寿命が縮む。' },
  { id: 'ac506', type: 'accessory', rarity: 'R', name: '絵師の凍結されたアカウント', atk: 30, def: 30, hp: 0, icon: '❄️', desc: '過去の栄光と怨念が宿っている。' },
  { id: 'ac507', type: 'accessory', rarity: 'N', name: '冷笑系のリプライ', atk: 15, def: 15, hp: -5, icon: '😏', desc: '精神を研ぎ澄ますが、友達は減る。' },
  { id: 'ac508', type: 'accessory', rarity: 'SR', name: 'パパ活の確定申告書', atk: 50, def: 80, hp: 50, icon: '📄', desc: '税務署の影に怯えながらも、確かな財力を証明する。' },
  { id: 'ac509', type: 'accessory', rarity: 'N', name: '出禁オタの出待ちリスト', atk: 20, def: 0, hp: 20, icon: '📝', desc: '異常な執念でHPが上がる。' },
  { id: 'ac510', type: 'accessory', rarity: 'UR', name: '伝説の炎上動画', atk: 200, def: 0, hp: -100, icon: '🎬', desc: '世界中に拡散され、破滅的な攻撃力を手に入れる。' },

  // ================= 🐰 第7弾 追加アイテム（パンデミック＆ドン引き編） =================
  // --- 武器 ---
  { id: 'w601', type: 'weapon', rarity: 'SR', name: '特効薬の注射器', atk: 70, def: 0, hp: 0, icon: '💉', desc: '打たれると色んな意味でヤバい。ウイルスを感染させる。', effect: 'virus' },
  { id: 'w602', type: 'weapon', rarity: 'UR', name: 'コウモリのスープ', atk: 150, def: 0, hp: 0, icon: '🦇', desc: 'すべての元凶。敵は謎のウイルスで死ぬ。', effect: 'virus' },
  { id: 'w603', type: 'weapon', rarity: 'SR', name: '自称アーティストのポエム集', atk: 5, def: 0, hp: 0, icon: '📖', desc: '朗読すると、あまりの痛さに敵がドン引きして逃げる。', effect: 'cringe' },
  { id: 'w604', type: 'weapon', rarity: 'UR', name: '中二病の黒歴史ノート', atk: 10, def: 0, hp: 0, icon: '📓', desc: '「我は漆黒の堕天使…」敵は耐えきれずに逃亡する。', effect: 'cringe' },
  { id: 'w605', type: 'weapon', rarity: 'R', name: '買い占められたトイレットペーパー', atk: 30, def: 10, hp: 0, icon: '🧻', desc: '物理で殴る。意外と硬い。' },
  
  // --- 防具 ---
  { id: 'a601', type: 'armor', rarity: 'R', name: '小さすぎる布マスク', atk: 0, def: 20, hp: 0, icon: '😷', desc: '防御力は低いが、洗えば何度でも使える。', effect: 'regen' },
  { id: 'a602', type: 'armor', rarity: 'SR', name: '濃厚接触者のオーラ', atk: 0, def: 60, hp: 0, icon: '🌫️', desc: '近づく者すべてを病気にする危険なオーラ。', effect: 'virus' },
  { id: 'a603', type: 'armor', rarity: 'UR', name: 'ソーシャルディスタンス・バリア', atk: 0, def: 180, hp: 50, icon: '📏', desc: '敵との間に絶対的な距離を作り出し、ダメージを反射する。', effect: 'reflect' },
  { id: 'a604', type: 'armor', rarity: 'R', name: 'ドン引きされる私服', atk: 0, def: 10, hp: 0, icon: '👕', desc: '絶妙にダサく、敵が戦意を喪失する。', effect: 'cringe' },

  // --- アクセサリー ---
  { id: 'ac601', type: 'accessory', rarity: 'SR', name: 'ワクチン接種証明書', atk: 0, def: 30, hp: 100, icon: '📜', desc: 'これを見せるとどこへでも行ける無敵感。', effect: 'regen' },
  { id: 'ac602', type: 'accessory', rarity: 'UR', name: '緊急事態宣言', atk: 50, def: 50, hp: 50, icon: '🚨', desc: '敵の行動を強制的に制限する強権。', effect: 'mental_damage' },
  { id: 'ac603', type: 'accessory', rarity: 'SR', name: 'アルコール消毒液', atk: 20, def: 20, hp: 20, icon: '🧴', desc: 'プシュッとするだけで清められた気がする。', effect: 'lifesteal' },

  // ================= 🐰 第8弾 追加アイテム（ディープネットミーム＆陰謀論編） =================
  // --- 武器 ---
  { id: 'w701', type: 'weapon', rarity: 'N', name: '5Gアンテナの破片', atk: 25, def: 0, hp: 0, icon: '📡', desc: '謎の電波を受信してしまい、頭が痛くなる。', effect: 'mental_damage' },
  { id: 'w702', type: 'weapon', rarity: 'R', name: '謎の波動が出る石', atk: 40, def: 0, hp: 0, icon: '🪨', desc: '信じる者にだけ効果があるスピリチュアルな石。', effect: 'regen' },
  { id: 'w703', type: 'weapon', rarity: 'SR', name: 'ケムトレイル散布機', atk: 80, def: 0, hp: 0, icon: '✈️', desc: '空から謎の化学物質を撒き散らし、敵を弱体化させる。', effect: 'virus' },
  { id: 'w704', type: 'weapon', rarity: 'UR', name: 'マコモ湯の残り湯', atk: 150, def: 0, hp: 0, icon: '♨️', desc: 'すべてを浄化し、同時にすべてを汚染する伝説の湯。', effect: 'virus' },
  
  // --- 防具 ---
  { id: 'a701', type: 'armor', rarity: 'N', name: 'アルミホイルの帽子', atk: 0, def: 15, hp: 10, icon: '👨‍🍳', desc: '電磁波や思考盗聴から脳を守ってくれる（気がする）。', effect: 'cringe' },
  { id: 'a702', type: 'armor', rarity: 'R', name: 'マイナスイオン発生器', atk: 0, def: 35, hp: 20, icon: '🌬️', desc: '滝のそばにいるような清々しさでダメージを軽減。', effect: 'regen' },
  { id: 'a703', type: 'armor', rarity: 'SR', name: '反重力シールド', atk: 0, def: 80, hp: 0, icon: '🛸', desc: '地球の裏側にいる爬虫類人から身を守る盾。', effect: 'reflect' },
  { id: 'a704', type: 'armor', rarity: 'UR', name: '光の戦士の白装束', atk: 0, def: 250, hp: 100, icon: '👻', desc: '謎の宗教団体が着ているアレ。近寄りがたいオーラを放つ。', effect: 'cringe' },

  // --- アクセサリー ---
  { id: 'ac701', type: 'accessory', rarity: 'N', name: '高濃度水素水', atk: 5, def: 5, hp: 30, icon: '💧', desc: 'ただの水より高い。飲むとプラシーボ効果で元気になる。', effect: 'regen' },
  { id: 'ac702', type: 'accessory', rarity: 'R', name: 'ディープステートの会員証', atk: 20, def: 20, hp: 20, icon: '👁️', desc: '世界の裏側を牛耳る組織のメンバーになれる。', effect: 'mental_damage' },
  { id: 'ac703', type: 'accessory', rarity: 'SR', name: 'ゴムマスク', atk: 30, def: 30, hp: 50, icon: '🎭', desc: '「あの政治家はゴムマスクだ！」という陰謀論を具現化。', effect: 'dodge_up' },
  { id: 'ac704', type: 'accessory', rarity: 'UR', name: 'アポロ月面着陸のセット', atk: 100, def: 100, hp: 200, icon: '🌕', desc: '実は月に行ってなかったというスタジオのセット。', effect: 'cringe' },

  // ================= 🐰 第9弾 追加アイテム（インターネットの歴史・古代ネットミーム編） =================
  // --- 武器 ---
  { id: 'w801', type: 'weapon', rarity: 'N', name: '糸電話', atk: 10, def: 0, hp: 0, icon: '☎️', desc: '通信速度は極端に遅いが、なぜか繋がる。', effect: 'double_attack' },
  { id: 'w802', type: 'weapon', rarity: 'R', name: 'ぬるぽハンマー', atk: 40, def: 0, hp: 0, icon: '🔨', desc: '「ガッ」と殴るための専用武器。条件反射で手が出る。', effect: 'double_attack' },
  { id: 'w803', type: 'weapon', rarity: 'SR', name: '香ばしい掲示板のログ', atk: 75, def: 0, hp: 0, icon: '📜', desc: '数年前のレスバトル記録。読むと精神に異常をきたす。', effect: 'mental_damage' },
  { id: 'w804', type: 'weapon', rarity: 'UR', name: '2ちゃんねるの石版', atk: 200, def: 0, hp: 0, icon: '🪨', desc: '古代のネット民が残したとされるオーパーツ。', effect: 'cringe' },
  
  // --- 防具 ---
  { id: 'a801', type: 'armor', rarity: 'N', name: '藁人形', atk: 0, def: 10, hp: -10, icon: '🎎', desc: '呪いをかけるための人形だが、間違えて着てしまった。', effect: 'reflect' },
  { id: 'a802', type: 'armor', rarity: 'R', name: '前略プロフの残骸', atk: 0, def: 25, hp: 10, icon: '📱', desc: '黒歴史が詰まったプロフ。敵がドン引きして攻撃力が下がる。', effect: 'cringe' },
  { id: 'a803', type: 'armor', rarity: 'SR', name: 'フラッシュ倉庫の鍵', atk: 0, def: 70, hp: 30, icon: '🗝️', desc: '失われた時代の遺物。懐かしさで敵の涙を誘う。', effect: 'dodge_up' },
  { id: 'a804', type: 'armor', rarity: 'UR', name: 'キリ番ゲッターの盾', atk: 0, def: 222, hp: 111, icon: '🛡️', desc: '10000HITを踏んだ者だけが持てる伝説の盾。', effect: 'reflect' },

  // --- アクセサリー ---
  { id: 'ac801', type: 'accessory', rarity: 'N', name: 'ダイヤルアップ接続のモデム音', atk: 5, def: 5, hp: 10, icon: '📻', desc: 'ピーーヒョロロロ...という音が不安と郷愁を誘う。', effect: 'mental_damage' },
  { id: 'ac802', type: 'accessory', rarity: 'R', name: 'アスキーアートの辞書', atk: 15, def: 15, hp: 30, icon: '📚', desc: 'AAで感情を表現できるようになる。', effect: 'crit_up' },
  { id: 'ac803', type: 'accessory', rarity: 'SR', name: 'VIPからの刺客証', atk: 40, def: 40, hp: 40, icon: '🎫', desc: 'これを提示すれば、大抵のことは許される（許されない）。', effect: 'dodge_up' },
  { id: 'ac804', type: 'accessory', rarity: 'UR', name: '吉野家コピペの台本', atk: 120, def: 120, hp: 150, icon: '📖', desc: '「問い詰めたい、小一時間問い詰めたい」', effect: 'double_attack' },

  // ================= 🐰 第10弾 追加アイテム（現代SNSの闇＆迷惑系編） =================
  // --- 武器 ---
  { id: 'w901', type: 'weapon', rarity: 'N', name: 'インプレゾンビの肉', atk: 30, def: 0, hp: 0, icon: '🧟', desc: '腐った肉。群がってくる。', effect: 'virus' },
  { id: 'w902', type: 'weapon', rarity: 'R', name: '港区女子のパパ活アプリ', atk: 50, def: 0, hp: 0, icon: '📱', desc: '恐ろしい勢いで相手のHP（財布）を削り取る。', effect: 'lifesteal' },
  { id: 'w903', type: 'weapon', rarity: 'SR', name: '万アカの裏垢', atk: 90, def: 0, hp: 0, icon: '👥', desc: '表の顔とは違う、ドス黒い感情をぶつける。', effect: 'mental_damage' },
  { id: 'w904', type: 'weapon', rarity: 'UR', name: '青い認証バッジ', atk: 250, def: 0, hp: 0, icon: '✅', desc: 'お金で買える権威。殴ると非常に痛い。', effect: 'crit_up' },
  
  // --- 防具 ---
  { id: 'a901', type: 'armor', rarity: 'N', name: '収益化剥奪の通知', atk: 0, def: 20, hp: -20, icon: '✉️', desc: '見るだけでHPが減るが、なぜか防御力はある。', effect: 'cringe' },
  { id: 'a902', type: 'armor', rarity: 'R', name: '加工されすぎた自撮り', atk: 0, def: 40, hp: 10, icon: '🤳', desc: 'もはや原型を留めておらず、敵の攻撃がすり抜ける。', effect: 'dodge_up' },
  { id: 'a903', type: 'armor', rarity: 'SR', name: '炎上系暴露系YouTuberの盾', atk: 0, def: 90, hp: 20, icon: '🛡️', desc: '他人の不幸を蜜にして身を守る不謹慎な盾。', effect: 'reflect' },
  { id: 'a904', type: 'armor', rarity: 'UR', name: '滝沢○レソのタレコミDM', atk: 0, def: 300, hp: 100, icon: '📩', desc: 'これを持つ者には誰も手を出せない。', effect: 'mental_damage' },

  // --- アクセサリー ---
  { id: 'ac901', type: 'accessory', rarity: 'N', name: '嘘松ツイート', atk: 10, def: 10, hp: 10, icon: '🤥', desc: '「今日電車でさ〜」から始まる虚言。', effect: 'cringe' },
  { id: 'ac902', type: 'accessory', rarity: 'R', name: 'プロフの「人生はゲーム」', atk: 20, def: 20, hp: 20, icon: '🎮', desc: 'これを書いている奴は大体ヤバい。', effect: 'cringe' },
  { id: 'ac903', type: 'accessory', rarity: 'SR', name: 'AI生成の美女アカウント', atk: 50, def: 50, hp: 50, icon: '🤖', desc: '中身はおっさん。無数のスパムを飛ばす。', effect: 'double_attack' },
  { id: 'ac904', type: 'accessory', rarity: 'UR', name: 'Z○の影', atk: 150, def: 150, hp: 250, icon: '👤', desc: '炊き出しと並行して裏の仕事もこなす男の影。', effect: 'regen' }
];

export const getReqLevel = (item) => {
  if (item.reqLevel) return item.reqLevel;
  switch (item.rarity) {
    case 'LR': return 80;
    case 'UR': return 50;
    case 'SR': return 30;
    case 'R': return 10;
    default: return 1;
  }
};

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
