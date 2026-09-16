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

const manualFixes = [
    { id: 22945, tags: ["ポケモンスリープ", "Sphere", "ラスベガス"] },
    { id: 22944, tags: ["オーイシマサヨシ", "ポケモン", "音楽"] },
    { id: 22943, tags: ["紀伊國屋書店", "西武渋谷店", "閉店"] },
    { id: 22942, tags: ["ZETA DIVISION", "ミズノ", "住友理工"] },
    { id: 22941, tags: ["ACE COOL", "Jinmenusagi", "Bonbero", "ヒップホップ"] },
    { id: 22940, tags: ["暗号資産", "H&P", "経済"] },
    { id: 22939, tags: ["Gyazo", "不正アクセス", "情報流出"] },
    { id: 22938, tags: ["テクダス", "Air Force One", "ターンテーブル"] },
    { id: 22937, tags: ["PITAKA", "iPhone 18 Pro", "ケース"] },
    { id: 22936, tags: ["メルカリ", "株価", "経済"] }
];

async function runManualFix() {
    console.log('Applying manual fixes for the last 10 articles due to AI rate limits...');
    let count = 0;
    
    for (const item of manualFixes) {
        console.log(`Fixing ID ${item.id} -> ${JSON.stringify(item.tags)}`);
        const { error } = await supabase
            .from('surveys')
            .update({ tags: item.tags })
            .eq('id', item.id);
            
        if (error) {
            console.error(`❌ Error fixing ID ${item.id}:`, error.message);
        } else {
            console.log(`✅ Success for ID ${item.id}`);
            count++;
        }
    }
    
    console.log(`\n🎉 All done! Fixed ${count} surveys manually.`);
}

runManualFix().catch(console.error);
