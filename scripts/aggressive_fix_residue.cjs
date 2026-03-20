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

async function findAndFix() {
    console.log('--- Aggressive Search for "]]>" ---');

    // Search Surveys (all columns)
    const { data: surveys } = await supabase.from('surveys').select('*').order('created_at', { ascending: false }).limit(200);
    for (const s of surveys || []) {
        let needsUpdate = false;
        const updateObj = {};

        if (s.title && s.title.includes(']]>')) {
            updateObj.title = s.title.replace(/\]\]>/g, '').trim();
            needsUpdate = true;
        }
        if (s.description && s.description.includes(']]>')) {
            updateObj.description = s.description.replace(/\]\]>/g, '').trim();
            needsUpdate = true;
        }
        // Check tags if they are strings in the array
        if (s.tags && Array.isArray(s.tags)) {
            const fixedTags = s.tags.map(t => typeof t === 'string' ? t.replace(/\]\]>/g, '').trim() : t);
            if (JSON.stringify(fixedTags) !== JSON.stringify(s.tags)) {
                updateObj.tags = fixedTags;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            console.log(`Fixing survey ${s.id} (${s.title.slice(0, 20)}...)`);
            await supabase.from('surveys').update(updateObj).eq('id', s.id);
        }
    }

    // Search Comments
    const { data: comments } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(300);
    for (const c of comments || []) {
        if (c.content && c.content.includes(']]>')) {
            console.log(`Fixing comment ${c.id} from ${c.user_name}...`);
            await supabase.from('comments').update({ content: c.content.replace(/\]\]>/g, '').trim() }).eq('id', c.id);
        }
    }

    console.log('Search and fix completed!');
}

findAndFix();
