const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
    });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching recent surveys to check for broken ones...");
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
        
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    
    let deletedCount = 0;
    for (const sv of surveys) {
        // SUMMARYタグがないものは失敗作なので削除対象（最近作られたもののみ）
        if (!sv.description.includes('[[SUMMARY:')) {
            console.log(`\nFound potential bad survey: ID: ${sv.id}, Title: ${sv.title}`);
            console.log(`Description preview: ${sv.description.substring(0, 50)}...`);
            
            // Delete it
            console.log(`Deleting survey ${sv.id}...`);
            const { error: delErr } = await supabase.from('surveys').delete().eq('id', sv.id);
            if (delErr) {
                console.error(`Error deleting ${sv.id}:`, delErr);
            } else {
                console.log(`Successfully deleted ${sv.id}.`);
                deletedCount++;
            }
        }
    }
    console.log(`\nFinished. Deleted ${deletedCount} bad surveys.`);
}
run();
