const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 💡 .env から環境変数を手動で読み込む (プロジェクトルートから探すらび！)
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            const v = value.join('=').trim().replace(/^['"]|['"]$/g, '');
            if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v;
            if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY' || key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = v;
        }
    });
} else {
    console.error('.env file not found at:', envPath);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateYouTuberCategory() {
    console.log('🚀 YouTuberカテゴリの引越しを開始するらび！');

    // 1. YouTuberカテゴリのアンケートを取得
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, tags, category')
        .eq('category', 'YouTuber');

    if (error) {
        console.error('データ取得失敗らび…', error);
        return;
    }

    console.log(`✅ ${surveys.length} 件のYouTuberアンケートを見つけたよ！`);

    for (const s of surveys) {
        const newTags = Array.from(new Set([...(s.tags || []), 'YouTuber']));
        
        const { error: updateErr } = await supabase
            .from('surveys')
            .update({ 
                category: 'エンタメ', 
                tags: newTags 
            })
            .eq('id', s.id);

        if (updateErr) {
            console.error(`❌ ID: ${s.id} の更新に失敗したよ`, updateErr);
        } else {
            console.log(`✨ ID: ${s.id} をエンタメカテゴリに引っ越し完了らび！`);
        }
    }

    console.log('🎊 お引越し完了！お疲れ様らびっ！🐰🥕');
}

migrateYouTuberCategory().catch(console.error);
