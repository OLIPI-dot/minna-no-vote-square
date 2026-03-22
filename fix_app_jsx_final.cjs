const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\App.jsx';
let content = fs.readFileSync(path, 'utf8');

// --- 0. 以前の誤っパッチのクリーンアップ ---
// マングリングされた箇所を特定して復元する
// （今回は手動で問題箇所を特定して置換します）

// 1. IS_MAINTENANCE フラグの正規化
content = content.replace(/\/\/ 🚧 メンテナンスモード設定\r?\nconst IS_MAINTENANCE = true;/g, "");
content = content.replace("const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;", "const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;\n\n// 🚧 メンテナンスモード設定\nconst IS_MAINTENANCE = true;");

// 2. 誤って挿入されたメンテナンスオーバーレイの削除
// 全ての return ( の前に挿入された可能性があるので、一度すべて消す
const badPatchPattern = /if \(IS_MAINTENANCE && !isAdmin\) \{[\s\S]*?© 2026 アンケート広場[\s\S]*?\}\s*(?=return \()/g;
content = content.replace(badPatchPattern, "");

// 3. メイン return ( への正しい挿入
// メイン return ( は `return (\n    <div className="survey-main-portal">` の形であることがわかっている
const mainReturnPattern = /return \(\s+<div className="survey-main-portal">/;
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

if (!content.includes('メンテナンスモード表示')) {
    content = content.replace(mainReturnPattern, maintenanceBlock + "\n  return (\n    <div className=\"survey-main-portal\">");
}

// 4. navigateTo のフィルタ解除無効化（既にされているかもしれないが念のため）
content = content.replace(
    /setFilterCategory\('すべて'\); \/\/ リストに戻る際にカテゴリフィルタをリセット/g,
    "// setFilterCategory('すべて'); // 🛡️ おりぴさんリクエスト：フィルタを保持するらび！"
);
content = content.replace(
    /setFilterTag\(''); \/\/ リストに戻る際にタグフィルタをリセット/g,
    "// setFilterTag('');"
);

// 5. いいねカウントのガード強化 (refreshSidebar等での型不一致解消)
// s.id を String(s.id) に統一
content = content.replace(
    /manualUpdatesRef\.current\[s\.id\]/g,
    "manualUpdatesRef.current[String(s.id)]"
);

fs.writeFileSync(path, content, 'utf8');
console.log('App.jsx fixed and patched successfully!');
