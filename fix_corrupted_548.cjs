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

async function fix() {
    console.log('🛠️ ID: 548 を修復（上書き）中...');
    const { error } = await supabase.from('surveys').update({
        title: 'Fixed Title',
        description: 'Fixed Description',
        tags: ['fixed']
    }).eq('id', 548);

    if (error) {
        console.error(error);
        process.exit(1);
    }
    console.log('✅ 修復完了！');
    process.exit(0);
}

fix();
