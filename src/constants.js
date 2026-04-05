// 🛡️ 管理者のメールアドレス
export const ADMIN_EMAILS = ['pachu.pachu.pachuly@gmail.com'];

// 🛡️ NGワードフィルター
export const NG_WORDS = ['死ね', '殺す', 'カス', 'アホ', 'バカ', 'きもい', 'キモイ', 'うざい'];
export const hasNGWord = (text) => NG_WORDS.some(ng => text.includes(ng));

// 🌟 アプリ全体で使うデフォルト画像
export const DEFAULT_SURVEY_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000';

// 🐰 らびの降臨メッセージ集
export const LABI_RESPONSES = {
  default: [
    "やっほー！呼んだかな？らびだよ！🐰✨ いつでも広場を見守ってるよ！",
    "やっほー！わーい！コメントありがとう！🥕 嬉しいなぁ！",
    "やっほー！その意見、とっても素敵だね！✨ さすが広場のみんな！",
    "やっほー！らびもそう思ってたんだ！🐰🥕 気が合うね！",
    "やっほー！広場が賑やかで楽しいな〜！🐾 今日も良い一日になりそう！",
    "やっほー！ひょっこり降臨！🐰 らびだよ〜！"
  ],
  keywords: [
    "やっほー！わああ！大好きなニンジンだー！🥕🥕🥕 むしゃむしゃ！😋 ありがとう！",
    "やっほー！ニンジンっていう言葉を聞くと、どこからでも飛んでくるよ！🐰💨💨",
    "やっほー！🥕 はらびの元気の源なんだ！広場のみにもお裾分けしたいな〜✨",
    "やっほー！らびは幸せ者だなぁ…！🥕 最高のプレゼントをありがとう！"
  ],
  admin: [
    "やっほー！管理者さん、いつも素敵な広場の運営をありがとう！応援してるらび！🐰✨",
    "やっほー！広場がもっと良くなるように、らびもお手伝い頑張るね！🥕🍀",
    "やっほー！いつも見守ってくれてありがとう！広場の平和はらびが守るよ！🛡️🐰",
    "やっほー！お疲れ様！🐰 たまには人参茶でも飲んでゆっくりしてね〜🍵"
  ]
};

export const CATEGORY_ICON_STYLE = {
  "すべて": { icon: "📂", color: "#64748b" },
  "ニュース": { icon: "⚡", color: "#0ea5e9" },
  "話題": { icon: "✨", color: "#8b5cf6" },
  "エンタメ": { icon: "🎭", color: "#ec4899" },
  "芸能": { icon: "🌟", color: "#a855f7" },
  "レビュー": { icon: "⭐", color: "#f59e0b" },
  "コラム": { icon: "🖊️", color: "#3b82f6" },
  "ネタ": { icon: "😂", color: "#f97316" },
  "ゲーム": { icon: "🎮", color: "#10b981" },
  "らび": { icon: "🐰", color: "#f472b6" },
  "その他": { icon: "🏷️", color: "#94a3b8" },
  "マイアンケート": { icon: "👤", color: "#94a3b8" }
};

// 🌏 アプリ全体で使う基本カテゴリリスト
export const BASE_CATEGORIES = ['ニュース', '芸能', '話題', 'エンタメ', 'レビュー', 'ゲーム', 'コラム', 'ネタ', 'らび', 'その他'];
export const FILTER_CATEGORIES = ['すべて', ...BASE_CATEGORIES];

// 🎨 スタンプリアクションの定義
export const STAMPS = [
  { id: 'saikou', label: '最高', src: '/stamps/saikou.png' },
  { id: 'gekiatsu', label: '激熱', src: '/stamps/gekiatsu.png' },
  { id: 'toutoi', label: '尊い', src: '/stamps/toutoi.png' },
  { id: 'oshi', label: '推し', src: '/stamps/oshi.png' },
  { id: 'happy', label: 'ハッピー', src: '/stamps/happy.png' },
  { id: 'daisuki', label: '大好き', src: '/stamps/daisuki.png' },
  { id: 'love', label: '愛', src: '/stamps/love.png' },
  { id: 'daijobu', label: 'だいじょぶ', src: '/stamps/daijobu.png' },
  { id: 'itawari', label: 'いたわり', src: '/stamps/itawari.png' },
  { id: 'kansha', label: '感謝', src: '/stamps/kansha.png' },
  { id: 'iinoyo', label: 'いいのよ', src: '/stamps/iinoyo.png' },
  { id: 'tanosimi', label: '楽しみ', src: '/stamps/tanosimi.png' },
  { id: 'yoshi', label: 'よし', src: '/stamps/yoshi.jpg' },
  { id: 'ok', label: 'OK', src: '/stamps/ok.png' },
  { id: 'haai', label: 'はーい', src: '/stamps/haai.png' },
  { id: 'zumi', label: '済み', src: '/stamps/zumi.png' },
  { id: 'kakuninchu', label: '確認中', src: '/stamps/kakuninchu.png' },
  { id: 'kirikae', label: '切り替え', src: '/stamps/kirikae.png' },
  { id: 'seiko', label: '成功', src: '/stamps/seiko.png' },
  { id: 'sippai', label: '失敗', src: '/stamps/sippai.png' }
];

export const VIEW_COOLDOWN_MS = 10 * 1000;
export const SUBMISSION_COOLDOWN_MS = 10 * 1000;
export const SCORE_VOTE_WEIGHT = 3;
