const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env manually to avoid dotenv dependency issues
const envFile = fs.readFileSync('i:/olipiprojects/antigravity-scratch/minna-no-vote-square/.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, val] = line.split('=');
    if (key && val) env[key.trim()] = val.trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function search() {
    console.log("Searching for 'カツヒコ' in title/description...");
    const { data: d1 } = await supabase.from('surveys').select('id, title, description, tags').or(`title.ilike.%カツヒコ%,description.ilike.%カツヒコ%`);
    console.log("Matches:", d1 ? d1.length : 0);
    if (d1 && d1.length > 0) console.log(JSON.stringify(d1, null, 2));

    console.log("\nSearching for 'カツヒコ' in tags...");
    // We'll fetch everything and filter locally for debugging
    const { data: all } = await supabase.from('surveys').select('id, title, tags').order('created_at', { ascending: false }).limit(100);
    const tagMatches = all.filter(s => s.tags && s.tags.includes('カツヒコ'));
    console.log("Tag Matches in last 100:", tagMatches.length);
    if (tagMatches.length > 0) console.log(JSON.stringify(tagMatches, null, 2));
}

search();
