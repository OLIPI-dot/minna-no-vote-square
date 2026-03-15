const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["'](.*)["']$/, '$1');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function updateToNature() {
    console.log('--- Updating Surveys to "自然" Category ---');
    
    const targetIds = [203, 204];
    
    for (const id of targetIds) {
        const { data, error } = await supabase
            .from('surveys')
            .update({ category: '自然' })
            .eq('id', id)
            .select();
        
        if (error) {
            console.error(`Error updating ID ${id}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`ID ${id} updated to "自然":`, data[0].title);
        } else {
            console.log(`ID ${id} was not found or already deleted.`);
        }
    }
}

updateToNature().catch(console.error);
