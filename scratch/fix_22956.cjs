const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });
}
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
(async () => {
  const { data } = await supabase.from('surveys').select('id, description').eq('id', 22956).single();
  const summaryObj = {
    "point1_title": "劇場版『虎に翼』",
    "point1_desc": "2027年1月公開の劇場版『虎に翼』のオープニングテーマに、米津玄師の『さよーならまたいつか！』が起用された。",
    "point2_title": "完全オリジナル",
    "point2_desc": "連続テレビ小説の制作陣が再集結。伊藤沙莉らキャスト続投で、ドラマで描かれなかった新たな物語が展開する。",
    "rabi_comment": "米津玄師さんの曲が劇場版でも聴けるなんて最高だね！また寅子たちに会えるのが待ち遠しいらび🐰",
    "keyword_title": "虎に翼",
    "keyword_desc": "日本初の女性弁護士・三淵嘉子をモデルにしたNHK連続テレビ小説。",
    "tags": ["米津玄師", "虎に翼", "伊藤沙莉"]
  };
  const richDescription = '[[SUMMARY:\n' + JSON.stringify(summaryObj, null, 2) + '\n]]\n\n' + data.description;
  const { error: descError } = await supabase.from('surveys').update({ description: richDescription, tags: summaryObj.tags }).eq('id', 22956);
  if (descError) { console.error(descError); } else { console.log('Updated 22956 successfully!'); }
})();
