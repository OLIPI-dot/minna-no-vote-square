const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env から環境変数を手動で読み込むらび！
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

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupLabiComments() {
    console.log('🚀 お掃除開始するらびっ！');

    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, description')
        .like('description', '%守護霊らびの視点%');

    if (error) {
        console.error('❌ データ取得失敗:', error);
        return;
    }

    console.log(`🔍 ${surveys.length}件の記事が見つかったらび！`);

    let count = 0;
    for (const survey of surveys) {
        // 正規表現で「守護霊らびの視点：〜 ---」の部分を削除するらび
        // 文字列の先頭から「---」とその後の改行までを対象にするらびっ！
        const cleanedDesc = survey.description.replace(/^🐰 \*\*守護霊らびの視点：\*\*[\s\S]*?---\s*/, '');
        
        if (cleanedDesc !== survey.description) {
            const { error: updateError } = await supabase
                .from('surveys')
                .update({ description: cleanedDesc })
                .eq('id', survey.id);

            if (updateError) {
                console.error(`❌ 更新失敗 (ID: ${survey.id}):`, updateError);
            } else {
                count++;
            }
        }
    }

    console.log(`✨ お掃除完了！ ${count}件の記事をスッキリさせたらびっ！🥕`);
}

cleanupLabiComments().catch(console.error);
