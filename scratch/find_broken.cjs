const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
} else {
    envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
}

const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)[1];
const supabaseKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function findBrokenSurveys() {
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, category, tags, description')
        .order('id', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    const broken = [];
    for (const s of surveys) {
        const desc = s.description || '';
        const tags = s.tags || [];
        const isDescBroken = desc.includes('マイページ') || desc.includes('JavaScriptが無効') || desc.includes('トップ速報') || (desc.includes('（出典：') && desc.trim().length < 150);
        const isTagBroken = tags.some(t => t.length > 20 || t === s.title || t.includes('('));

        if (isDescBroken || isTagBroken) {
            broken.push({
                id: s.id,
                title: s.title,
                isDescBroken,
                isTagBroken,
                tags: s.tags
            });
        }
    }

    console.log(`Found ${broken.length} broken surveys out of ${surveys.length}:`);
    console.log(JSON.stringify(broken, null, 2));
}

findBrokenSurveys();
