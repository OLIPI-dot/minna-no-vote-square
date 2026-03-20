const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const getEnv = (key) => {
    const files = ['.env.local', '.env'];
    for (const f of files) {
        if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf8');
            const match = content.split('\n').find(line => line.startsWith(`${key}=`));
            if (match) return match.split('=')[1].trim().replace(/^["'](.*)["']$/, '$1');
        }
    }
    return null;
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(url, key);

async function fixResidue() {
    console.log('--- Fixing CDATA Residue (]]>) ---');

    // 1. Fix surveys
    const { data: surveys, error: sErr } = await supabase
        .from('surveys')
        .select('id, description')
        .contains('description', ']]>');
    
    // Wait! Supabase .contains() is for arrays. For strings we use .like() or .ilike()
    // Let's just fetch all recent ones and check locally
    const { data: recentSurveys } = await supabase
        .from('surveys')
        .select('id, description')
        .order('created_at', { ascending: false })
        .limit(50);

    for (const s of recentSurveys || []) {
        if (s.description && s.description.includes(']]>')) {
            const fixed = s.description.replace(/\]\]>/g, '').trim();
            console.log(`Fixing survey ${s.id}...`);
            await supabase.from('surveys').update({ description: fixed }).eq('id', s.id);
        }
    }

    // 2. Fix comments
    const { data: recentComments } = await supabase
        .from('comments')
        .select('id, content')
        .order('created_at', { ascending: false })
        .limit(100);

    for (const c of recentComments || []) {
        if (c.content && c.content.includes(']]>')) {
            const fixed = c.content.replace(/\]\]>/g, '').trim();
            console.log(`Fixing comment ${c.id}...`);
            await supabase.from('comments').update({ content: fixed }).eq('id', c.id);
        }
    }

    console.log('Done cleaning!');
}

fixResidue();
