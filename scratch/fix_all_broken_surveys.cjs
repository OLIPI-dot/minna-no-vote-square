const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) {
        const k = key.trim();
        const v = val.join('=').trim().replace(/^['"]|['"]$/g, '');
        if (k === 'VITE_SUPABASE_URL') supabaseUrl = v;
        if (k === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = v;
    }
});

if (!supabaseKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY!');
    process.exit(1);
}

console.log('Connecting with Service Role Key prefix:', supabaseKey.substring(0, 15));
const supabase = createClient(supabaseUrl, supabaseKey);

// 🏷️ タイトルから適切なカテゴリとタグを判定するらび！
function detectCategoryAndTags(title) {
    const t = title.toLowerCase();
    let category = 'ニュース';
    const tagSet = new Set();

    // カテゴリ判定
    if (t.includes('ゲーム') || t.includes('switch') || t.includes('ps5') || t.includes('xbox') || t.includes('レトロゲーマー') || t.includes('gta') || t.includes('steam') || t.includes('任天堂')) {
        category = 'ゲーム';
        tagSet.add('ゲーム');
    } else if (t.includes('アニメ') || t.includes('漫画') || t.includes('マンガ') || t.includes('攻殻機動隊') || t.includes('映画') || t.includes('芸能') || t.includes('松岡茉優') || t.includes('アイドル') || t.includes('ブルーレイ') || t.includes('なにわ男子') || t.includes('ドラマ')) {
        category = 'エンタメ';
        tagSet.add('エンタメ');
    } else if (t.includes('ai') || t.includes('gemini') || t.includes('claude') || t.includes('iphone') || t.includes('mac') || t.includes('usb') || t.includes('スマホ') || t.includes('アプリ') || t.includes('ソニー') || t.includes('figma') || t.includes('テスラ') || t.includes('pc') || t.includes('スマートウォッチ') || t.includes('ルンバ') || t.includes('イヤホン')) {
        category = 'テクノロジー';
        tagSet.add('テクノロジー');
    } else if (t.includes('大雨') || t.includes('氾濫') || t.includes('線状降水帯') || t.includes('事件') || t.includes('いじめ') || t.includes('当せん') || t.includes('復興相') || t.includes('日銀') || t.includes('円高') || t.includes('suica') || t.includes('火災') || t.includes('逮捕')) {
        category = '社会';
        tagSet.add('社会');
    }

    // 詳細タグの付与
    if (t.includes('レトロ') || t.includes('acアダプター') || t.includes('ゲーム機')) tagSet.add('レトロゲーム');
    if (t.includes('usb') || t.includes('ケーブル') || t.includes('充電') || t.includes('アダプター')) tagSet.add('ガジェット');
    if (t.includes('ディスプレイ') || t.includes('イヤホン') || t.includes('スマートウォッチ') || t.includes('ルンバ') || t.includes('掃除機') || t.includes('コード')) tagSet.add('便利グッズ');
    if (t.includes('ai') || t.includes('gemini') || t.includes('claude') || t.includes('copilot')) tagSet.add('生成AI');
    if (t.includes('iphone') || t.includes('apple') || t.includes('mac')) tagSet.add('Apple');
    if (t.includes('suica') || t.includes('ペンギン') || t.includes('キャラ')) tagSet.add('Suica');
    if (t.includes('大雨') || t.includes('警報') || t.includes('氾濫') || t.includes('降水帯') || t.includes('川')) tagSet.add('防災');
    if (t.includes('円高') || t.includes('日銀') || t.includes('利上げ') || t.includes('金利')) tagSet.add('経済');
    if (t.includes('映画') || t.includes('攻殻機動隊') || t.includes('アニメ')) tagSet.add('アニメ');
    if (t.includes('テスラ') || t.includes('サイバーキャブ') || t.includes('ev') || t.includes('バイク')) tagSet.add('EV');
    if (t.includes('漫画') || t.includes('マンガ') || t.includes('メダリスト')) tagSet.add('マンガ');

    tagSet.add('話題');
    tagSet.add('トレンド');

    // フィルタリング（20文字以上・記号入りは除外）
    const validTags = Array.from(tagSet).filter(tag => tag.length >= 2 && tag.length <= 15 && !tag.includes('(') && !tag.includes(')') && !tag.includes('ギズモード') && !tag.includes('ITmedia'));
    return { category, tags: validTags.slice(0, 5) };
}

// 📝 タイトルからリッチな解説文と要約、らびコメントを生成するらび！
function generateSurveyContent(title, existingDesc) {
    const cleanTitle = title.replace(/[（\(][^）\)]+[）\)]$/, '').trim();
    const sourceMatch = title.match(/[（\(]([^）\)]+)[）\)]$/);
    const sourceName = sourceMatch ? sourceMatch[1] : 'ニュース';

    // 既存のURLリンクを救出
    const urlMatch = (existingDesc || '').match(/\[続きを読む\]\((https?:\/\/[^\s)]+)\)/) || (existingDesc || '').match(/(https?:\/\/news\.yahoo\.co\.jp[^\s]+)/);
    const sourceUrl = urlMatch ? urlMatch[1] : '';

    let summary = [];
    let body = '';
    let rabi = '';

    if (title.includes('レトロゲーマー') || title.includes('各種ゲーム機をUSB-C')) {
        summary = [
            '昔懐かしい各種レトロゲーム機を、現代のUSB-Cで手軽に給電できる画期的な変換コードが登場！',
            'かさばる専用ACアダプターを持ち歩いたり探したりする悩みから解放されます。',
            'モバイルバッテリーや最新のUSB急速充電器を活用してスマートにレトロゲームを楽しめます。'
        ];
        body = `レトロゲームファン必見！押し入れに眠る懐かしのゲーム機たちを、最新のUSB Type-C電源で動かせる便利な変換コードが話題を集めています。\n\n従来のゲーム機は機種ごとに巨大な専用ACアダプターが必要で、コンセント周りがごちゃついたり断線の心配がありました。本アイテムを使えば、使い慣れたUSB-C充電器やモバイルバッテリー1台でスマートに給電可能になります。\n\n「あの名作をもう一度遊びたいけれど準備が面倒」と感じていたゲーマーにとって、まさに救世主となる便利アイテムです！`;
        rabi = `🐰 **らびの視点：** 昔のゲーム機のアダプターってすっごく重たくて場所をとったよね！USB-Cでサクッと動かせるなら、久しぶりに押し入れから引っ張り出して遊びたくなっちゃうらび〜！🎮✨`;
    } else if (title.includes('Suica') && title.includes('新キャラ')) {
        summary = [
            'JR東日本の「Suica」で親しまれたペンギンが2027年3月末で卒業へ。',
            '新たに3つの新キャラクター候補が発表され、ネット投票による選定がスタート！',
            '長年親しまれた愛されキャラの交代に、SNSでも大きな注目と惜しむ声が広がっています。'
        ];
        body = `JR東日本の交通系ICカード「Suica」のシンボルとして愛されてきた「Suicaのペンギン」が、2027年3月末をもって卒業することが発表されました。\n\nそれに伴い、次代を担う3つの新キャラクター候補がお披露目され、一般ユーザーによるネット投票で最終決定される方針が明らかになりました。長年通勤・通学を見守ってきたペンギンの勇退を惜しむ声とともに、新しい仲間がどのような姿になるのか熱い視線が注がれています。\n\nみんなは新しいキャラクターにどんな魅力を期待する？`;
        rabi = `🐰 **らびの視点：** 駅の改札やポスターで毎日見かけていたペンギンさんが卒業なんて、ちょっと寂しいらび…！でも新しい仲間が誰になるのか、投票の行方もドキドキ見守りたいらびっ！🐧🚩`;
    } else if (title.includes('Gemini') || title.includes('Deep Research')) {
        summary = [
            'GoogleのAI「Gemini」に搭載された強力なリサーチ機能「Deep Research」が話題！',
            '膨大なWeb上の情報や資料を網羅的に調査し、構造化されたレポートを自動生成。',
            'ビジネスの資料作成から社内ナレッジの検索まで、日々の調査業務を劇的に効率化します。'
        ];
        body = `Googleの最新AIモデルGeminiに加わった「Deep Research」機能が、ビジネスや研究の現場で大きな注目を集めています。\n\n単なる質疑応答にとどまらず、複数の情報源を自律的に検索・比較・検証し、網羅的なレポートとしてまとめてくれる点が最大の特徴です。資料作成の事前リサーチや市場調査にかかる時間を大幅に削減できるため、今後の知的生産のあり方を変えるツールとして期待されています。\n\nAIをリサーチに活用する動き、あなたは普段どれくらい取り入れていますか？`;
        rabi = `🐰 **らびの視点：** 自分で何時間もかけて調べていた情報が、AIさんにお願いするだけであっという間にまとまるなんて魔法みたいらび！使いこなせたら頼もしい相棒になるらびね〜！🤖📚`;
    } else if (title.includes('Mac顔') || title.includes('5インチディスプレイ')) {
        summary = [
            '往年の初代Macintoshをモチーフにした可愛い5インチ小型ディスプレイが登場！',
            '左手デバイスやUSBハブとしても活用でき、レトロな外観と実用性を両立。',
            'デスク周りのインテリアやサブモニターとしてガジェットファンの心を掴んでいます。'
        ];
        body = `往年の名機「クラシックMac」のデザインをそのまま手のひらサイズに凝縮した、ユニークな5インチディスプレイが注目を集めています。\n\n単なる観賞用フィギュアではなく、実際にPCと接続してサブ画面として使えるほか、ショートカット操作用の左手デバイスやUSBハブとしての機能も兼ね備えています。遊び心と実用性を兼ね備えた、デスクにあるだけで気分が上がるガジェットです！`;
        rabi = `🐰 **らびの視点：** レトロなMacのフォルムって今見てもすっごく可愛いらび〜！机の上にちょこんと置いて音楽プレイヤーや時計を表示させたら最高にエモいらびね！🖥️✨`;
    } else if (title.includes('大雨') || title.includes('氾濫') || title.includes('線状降水帯')) {
        summary = [
            '各地で大雨や線状降水帯の発生が相次ぎ、河川の氾濫や土砂災害への警戒が呼びかけられています。',
            '気象庁や自治体からの避難情報・ハザードマップを早めに確認することが大切です。',
            '最新の気象ニュースをチェックし、安全第一での行動を心がけましょう。'
        ];
        body = `大気の状態が不安定となり、全国各地で記録的な大雨や線状降水帯による急激な水位上昇が観測されています。\n\n河川の氾濫や浸水被害、土砂崩れなどの危険が高まっており、各自治体から避難情報が相次いで発表されています。周囲の安全確認やハザードマップの見直しなど、日頃の備えと最新の防災情報への注視が求められます。`;
        rabi = `🐰 **らびの視点：** 雨が強くなるとあっという間に水が上がってくるから本当に油断できないらび！危険を感じたら無理をせず、早めの安全確保を心がけてほしいらび…！☔🛡️`;
    } else {
        // 汎用高精度テンプレート
        summary = [
            `『${cleanTitle}』に関する最新トピックスが大きな関心を集めています。`,
            'ネットやSNS上でも様々な意見や反応が寄せられ、議論が活発化しています。',
            'あなたの印象や考えに最も近い選択肢を選んで、ぜひ投票に参加してください！'
        ];
        body = `本アンケートは、現在各メディアで注目を集めている『${cleanTitle}』をテーマに作成されています。\n\n最新の報道や社会的な反響を通じて、多様な視点や関心が寄せられています。日頃感じていることやご自身の考えについて、ぜひ下の選択肢から投票して広場のみんなと共有してみましょう！`;
        rabi = `🐰 **らびの視点：** この話題、みんなはどう受け止めているのかな？気軽にポチッと投票して、あなたの声を届けてほしいらび！🥕✨`;
    }

    let result = `[[SUMMARY:\n${summary.map(s => `・${s}`).join('\n')}\n]]\n\n${body}\n\n${rabi}\n\n（出典：${sourceName}）`;
    if (sourceUrl) {
        result += `\n\n[続きを読む](${sourceUrl})`;
    }
    return result;
}

async function fixAllBrokenSurveys() {
    console.log('Fetching all surveys to inspect...');
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, category, tags, description')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    console.log(`Total surveys fetched: ${surveys.length}`);
    let fixedCount = 0;

    for (const s of surveys) {
        const desc = s.description || '';
        const tags = s.tags || [];

        const isDescBroken = 
            desc.includes('マイページ') || 
            desc.includes('JavaScriptが無効') || 
            desc.includes('トップ速報') || 
            (desc.includes('（出典：') && desc.trim().length < 150) ||
            !desc.includes('[[SUMMARY:');

        const isTagBroken = 
            tags.some(t => t.length > 20 || t === s.title || t.includes('(') || t.includes('ギズモード') || t.includes('ITmedia'));

        if (isDescBroken || isTagBroken) {
            const { category, tags: newTags } = detectCategoryAndTags(s.title);
            const newDesc = generateSurveyContent(s.title, desc);

            const updatePayload = {
                description: newDesc,
                tags: newTags
            };
            if (s.category === 'ニュース' && category !== 'ニュース') {
                updatePayload.category = category;
            }

            const { data: updated, error: updateErr } = await supabase
                .from('surveys')
                .update(updatePayload)
                .eq('id', s.id)
                .select();

            if (updateErr) {
                console.error(`Error updating ID ${s.id}:`, updateErr.message);
            } else if (updated && updated.length > 0) {
                fixedCount++;
                console.log(`✨ [${fixedCount}] Fixed ID ${s.id}: "${s.title.substring(0, 25)}..." -> Tags: [${newTags.join(', ')}]`);
            }
        }
    }

    console.log(`\n🎉 全ての修復が完了しました！修復成功件数: ${fixedCount} 件`);
}

fixAllBrokenSurveys();
