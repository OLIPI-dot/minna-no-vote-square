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

async function search() {
    console.log('=== Comprehensive Search for "]]>" ===');
    
    const { data: surveys } = await supabase.from('surveys').select('id, title, description, tags').order('created_at', { ascending: false }).limit(100);
    
    for (const s of surveys || []) {
        if (JSON.stringify(s).includes(']]>')) {
            console.log(`Found in Survey ${s.id}:`);
            if (s.title && s.title.includes(']]>')) console.log('  - Title');
            if (s.description && s.description.includes(']]>')) console.log('  - Description');
            if (s.tags && JSON.stringify(s.tags).includes(']]>')) console.log('  - Tags');
        }
    }

    const { data: comments } = await supabase.from('comments').select('id, survey_id, content, user_name').order('created_at', { ascending: false }).limit(200);
    for (const c of comments || []) {
        if (c.content && c.content.includes(']]>')) {
            console.log(`Found in Comment ${c.id} (Survey ${c.survey_id}, User: ${c.user_name})`);
        }
    }
    
    console.log('=== Search Finished ===');
}

search();
