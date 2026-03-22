const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// --- 1. 誤パッチの除去と初期化 ---
// 既に挿入されたIS_MAINTENANCEフラグや、壊れたオーバーレイを一度削除
content = content.replace(/\/\/ 🚧 メンテナンスモード設定\s+const IS_MAINTENANCE = true;/g, "");
// 壊れたパターンの削除（かなり広めにマッチさせて消す）
const badPattern = /\/\/ 🚧 メンテナンスモード表示[\s\S]+?© 2026 アンケート広場[\s\S]+?\}\s*(?=\r?\n\s*return \()/g;
content = content.replace(badPattern, "");

// --- 2. フラグの再配置 ---
content = content.replace(
    "const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;",
    "const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;\n\n// 🚧 メンテナンスモード設定\nconst IS_MAINTENANCE = true;"
);

// --- 3. メイン return への正しい挿入 ---
const maintenanceBlock = `
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

// メインの return は最後の方にある div.survey-main-portal を含むもの
content = content.replace("return (\n    <div className=\"survey-main-portal\">", maintenanceBlock + "\n  return (\n    <div className=\"survey-main-portal\">");

// --- 4. ナビゲーションのリセット解除 ---
// 文字列置換の方が安全
content = content.split("setFilterCategory('すべて'); // リストに戻る際にカテゴリフィルタをリセット").join("// setFilterCategory('すべて');");
content = content.split("setFilterTag(''); // リストに戻る際にタグフィルタをリセット").join("// setFilterTag('');");

// --- 5. ガードIDの型統一 (refreshSidebar周辺) ---
content = content.split("manualUpdatesRef.current[s.id]").join("manualUpdatesRef.current[String(s.id)]");

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx fixed successfully (V2)!');
