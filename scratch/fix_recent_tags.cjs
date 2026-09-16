const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// .env から環境変数を手動で読み込むらび！
const envPath = path.join(__dirname, '..', '.env');
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
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('環境変数が見つかりません');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTags() {
    console.log('Fetching recent surveys...');
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description, tags')
        .order('id', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    console.log(`Found ${surveys.length} surveys.`);
    let updateCount = 0;

    for (const s of surveys) {
        if (!s.description) continue;
        
        const summaryTagMatch = s.description.match(/\[\[SUMMARY:([\s\S]*?)\]\]/);
        if (summaryTagMatch) {
            try {
                const parsed = JSON.parse(summaryTagMatch[1].trim());
                if (parsed.tags && Array.isArray(parsed.tags)) {
                    // Extract tags exactly as AI generated them
                    const aiTags = parsed.tags.map(t => String(t).trim()).filter(t => t.length > 0);
                    
                    // If AI generated valid tags, update DB
                    if (aiTags.length > 0) {
                        console.log(`\nID ${s.id}: ${s.title}`);
                        console.log(`  Old Tags: ${JSON.stringify(s.tags)}`);
                        console.log(`  AI Tags:  ${JSON.stringify(aiTags)}`);
                        
                        const { error: updateErr } = await supabase
                            .from('surveys')
                            .update({ tags: aiTags })
                            .eq('id', s.id);
                            
                        if (updateErr) {
                            console.error(`  Error updating tags for ID ${s.id}:`, updateErr);
                        } else {
                            console.log(`  ✅ Successfully updated tags!`);
                            updateCount++;
                        }
                    } else {
                        console.log(`\nID ${s.id}: AI didn't provide tags in JSON.`);
                    }
                }
            } catch (e) {
                console.log(`\nID ${s.id}: Failed to parse JSON: ${e.message}`);
            }
        }
    }
    
    console.log(`\nFix complete. Updated ${updateCount} surveys.`);
}

fixTags().catch(console.error);
