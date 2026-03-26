const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'i:/olipiprojects/antigravity-scratch/minna-no-vote-square/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function search() {
    console.log("Searching for 'カツヒコ'...");
    const { data, error } = await supabase
        .from('surveys')
        .select('id, title, description, tags, category')
        .or('title.ilike.%カツヒコ%,description.ilike.%カツヒコ%');
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data.length} matches in title/description.`);
        console.log(JSON.stringify(data, null, 2));
    }

    console.log("\nSearching for 'カツヒコ' in tags (exact)...");
    const { data: tagData, error: tagError } = await supabase
        .from('surveys')
        .select('id, title, description, tags, category')
        .contains('tags', ['カツヒコ']);
    
    if (tagError) {
        console.error("Tag Error:", tagError);
    } else {
        console.log(`Found ${tagData.length} matches in tags.`);
        console.log(JSON.stringify(tagData, null, 2));
    }
}

search();
