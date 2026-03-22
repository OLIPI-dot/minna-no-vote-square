const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. IS_MAINTENANCE フラグの追加
if (!content.includes('const IS_MAINTENANCE =')) {
    content = content.replace(
        "const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;",
        "const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;\n\n// 🚧 メンテナンスモード設定\nconst IS_MAINTENANCE = true;"
    );
}

// 2. navigateTo のフィルタ解除無効化
content = content.replace(
    "setFilterCategory('すべて'); // リストに戻る際にカテゴリフィルタをリセット",
    "// setFilterCategory('すべて'); // 🛡️ おりぴさんリクエスト：フィルタを保持するらび！"
);
content = content.replace(
    "setFilterTag(''); // リストに戻る際にタグフィルタをリセット",
    "// setFilterTag('');"
);

// 3. メンテナンスオーバーレイの追加
const maintenanceOverlay = `
  // 🚧 メンテナンスモード表示
  if (IS_MAINTENANCE && !isAdmin) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff5f7 0%, #ffffff 100%)', color: '#64748b', textAlign: 'center', padding: '20px'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🐰🚧</div>
        <h1 style={{ color: '#ec4899', marginBottom: '16px' }}>ただいまメンテナンス中らび！</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
          現在、広場のパワーアップ作業をしてるよ。 <br />
          もう少しで終わるから、ニンジンでも食べて待っててね ✨
        </p>
        <div style={{ marginTop: '30px', fontSize: '0.9rem', opacity: 0.7 }}>
          © 2026 アンケート広場 / Powered by olipi projects
        </div>
      </div>
    );
  }
`;

if (!content.includes('メンテナンスモード表示')) {
    content = content.replace(
        "return (",
        maintenanceOverlay + "\n  return ("
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx patched successfully!');
