const fs = require('fs');
const path = 'i:\\olipiprojects\\antigravity-scratch\\minna-no-vote-square\\src\\components\\SurveyDescription.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. トップのバッジのラッピング問題解決
content = content.replace(
    /alignItems: 'center',\s*justifyContent: 'space-between',\s*marginBottom: '20px',/g,
    "alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '20px',"
);
content = content.replace(
    /gap: '6px'\s*\}\}>⚡ 要約・注目ポイント/g,
    "gap: '6px', whiteSpace: 'nowrap' }}>⚡ 要約・注目ポイント"
);

// 2. スマホ縦並び (li を flex-col md:flex-row にする。 内部のテキストも flex-col にする)
const liRegex = /<li(?: key=\{idx\})? style=\{\{\s*display: 'flex',\s*alignItems: 'flex-start',\s*gap: '14px',\s*marginBottom: [^,]+,\s*fontSize: '1.02rem',\s*color: '#1e293b',\s*lineHeight: '1.75',\s*fontWeight: '500'\s*\}\}>/g;
content = content.replace(liRegex, (match, offset) => {
    // marginBottom が動的な場合(idx)と固定の場合がある
    const mbMatch = match.match(/marginBottom: ([^,]+),/);
    const mbValue = mbMatch ? mbMatch[1] : "'16px'";
    const keyAttr = match.includes('key={idx}') ? ' key={idx}' : '';
    return `<li${keyAttr} className="flex flex-col md:flex-row items-start gap-2 md:gap-[14px] text-[1.02rem] text-slate-800 leading-[1.75] font-medium" style={{ marginBottom: ${mbValue} }}>`;
});

// タイトルと本文のコンテナを flex-col md:block にする
content = content.replace(
    /<span style=\{\{ whiteSpace: 'normal', width: '100%' \}\}>/g,
    '<span className="flex flex-col md:block gap-1 w-full" style={{ whiteSpace: "normal" }}>'
);

// タイトルバッジの右マージンをスマホ時は下マージンに変えるため、インラインスタイルを修正
content = content.replace(
    /marginRight: '8px',/g,
    "marginRight: '8px', marginBottom: '4px',"
);

// 3. らびのひとこと のflex修正 (スマホで画像とテキストを縦並びにしない場合、ここでは li のスタイルが違うためスルーするか、必要なら別途対応)

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced successfully!");
