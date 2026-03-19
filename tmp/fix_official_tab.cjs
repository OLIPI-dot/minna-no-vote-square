const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
    });
}
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function fix() {
    console.log('📦 アンケートの引っ越し（公式化）を開始するらび！');
    
    // ECB (426), NY原油 (425), イラン (424)
    const updates = [
        { id: 424, category: 'ニュース・経済' },
        { id: 425, category: 'ニュース・経済' },
        { id: 426, category: 'ニュース・経済' }
    ];

    for (const u of updates) {
        const { error } = await supabase.from('surveys')
            .update({ is_official: true, category: u.category })
            .eq('id', u.id);
        
        if (error) {
            console.error(`❌ ID ${u.id} の修正失敗:`, error.message);
        } else {
            console.log(`✅ ID ${u.id} を「公式・ニュース」へ移動完了！`);
        }
    }
}

fix();
