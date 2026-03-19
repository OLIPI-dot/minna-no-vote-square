const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const getEnv = (key) => {
    const files = ['.env.local', '.env'];
    for (const f of files) {
        const filePath = path.join(__dirname, '..', f);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
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

async function updateKatsuhikoThumbnail() {
    const searchTitle = "ボディビルダーカツヒコ氏、akikoさんをナンパする⚖️💪";
    
    // タイトルのバリエーションも考慮してあいまい検索
    const { data: surveys, error: findError } = await supabase
        .from('surveys')
        .select('id, title, image_url')
        .ilike('title', '%カツヒコ%');

    if (findError) {
        console.error('❌ 検索失敗:', findError.message);
        return;
    }

    if (!surveys || surveys.length === 0) {
        console.log('❓ 対応するアンケートが見つからなかったらび……。');
        return;
    }

    const target = surveys[0];
    console.log(`🎯 対象アンケートを発見！ ID: ${target.id}, Title: ${target.title}`);

    const newImageUrl = "nico:sm34727375.8266";
    
    const { error: updateError } = await supabase
        .from('surveys')
        .update({ image_url: newImageUrl })
        .eq('id', target.id);

    if (updateError) {
        console.error('❌ 更新失敗:', updateError.message);
        return;
    }

    console.log(`✅ ${target.title} のサムネイル情報を ${newImageUrl} に更新したよ！🐰🥕`);
}

updateKatsuhikoThumbnail();
