const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const envPaths = ['.env.local', '.env'];
    for (const p of envPaths) {
        if (fs.existsSync(p)) {
            const lines = fs.readFileSync(p, 'utf8').split('\n');
            for (const line of lines) {
                if (line.trim().startsWith(key + '=')) {
                    return line.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
                }
            }
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

const newDesc = `明治のロングセラーアイス「エッセル スーパーカップ」の期間限定フレーバー「チョコミント」。清涼感あふれる味わいで根強い人気を誇る商品ですが、今X（旧Twitter）で、ある「違和感」が話題になっています。

投稿された画像を見ると、フタのパッケージには「チョコミント」と大きく書かれていますが、右上の期間限定ラベルの影に見えるはずの文字が…？ 実は、過去のフレーバーの「誤植」や「使い回し」ではないか？と疑いたくなるような、絶妙な違和感が発見されたのです。 

この投稿には10万件以上の「いいね」が寄せられ、「ミントだけに、見落とすとこだった！」「商品名を二度見した」といったユーモアあふれる反応が続出しています。 

みんなはこれ、パッと見て違和感に気づけるかな？🐰✨ それとも「美味しければOK！」かな？ ぜひ当時の状況や、チョコミントへの愛、あるいはパッケージへのツッコミをコメントで教えてほしいらび！

出典：ハフポスト日本版 (https://www.huffingtonpost.jp/entry/story_jp_65f79568e4b003a2723a2f7c)`;

async function update() {
    const { data, error } = await supabase.from('surveys').update({ description: newDesc }).eq('id', 1117);
    if (error) {
        console.error('❌ Error:', error);
    } else {
        console.log('✅ Update Success for Survey 1117!');
    }
}

update();
