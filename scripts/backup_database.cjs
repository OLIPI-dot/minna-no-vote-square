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
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupTable(tableName) {
    console.log(`📦 ${tableName} テーブルのデータを吸い出し中...`);
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) {
        console.error(`❌ ${tableName} のバックアップに失敗らび…`, error);
        return null;
    }
    console.log(`✅ ${tableName}: ${data.length} 件のデータが見つかったよ！`);
    return data;
}

async function runBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

    console.log('🚀 広場の大切なデータのバックアップを開始するらび！');

    const tables = ['surveys', 'options', 'comments', 'inquiries'];
    const backupData = {};

    for (const table of tables) {
        backupData[table] = await backupTable(table);
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log(`✨ バックアップが完了したよ！場所: ${backupFile} 🐰🥕`);
    console.log('これで万が一のときも、おりぴさんの広場は守られるらびっ！🎊');
}

runBackup().catch(console.error);
