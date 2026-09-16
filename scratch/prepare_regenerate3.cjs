const fs = require('fs');
const code = fs.readFileSync('scratch/regenerate_ai.cjs', 'utf-8');

const additionalCode = `
async function regenerateBroken() {
    log('Fetching surveys from Supabase...');
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description')
        .order('id', { ascending: false });

    if (error) {
        log('Error fetching surveys: ' + error.message);
        return;
    }

    log(\`Found \${surveys.length} surveys.\`);
    let count = 0;

    for (const s of surveys) {
        if (!s.description || !s.description.includes('[[SUMMARY:') || s.description.includes('に関する最新トピックスが大きな関心を集めています')) {
            const urlMatch = (s.description || '').match(/\[続きを読む\]\\((https?:\\/\\/[^\\s)]+)\\)/) || (s.description || '').match(/(https?:\\/\\/news\\.yahoo\\.co\\.jp[^\\s]+)/);
            const sourceUrl = urlMatch ? urlMatch[1] : null;

            if (sourceUrl) {
                log(\`Regenerating ID \${s.id}: \${s.title}\`);
                const desc = await fetchRichData(sourceUrl, s.title);
                
                if (desc && desc.includes('[[SUMMARY:')) {
                    const { error: updateErr } = await supabase
                        .from('surveys')
                        .update({ description: desc })
                        .eq('id', s.id);
                    if (updateErr) {
                        log('Error updating ' + s.id + ': ' + updateErr.message);
                    } else {
                        log('Successfully updated ID ' + s.id);
                        count++;
                    }
                } else {
                    log('AI generation failed for ID ' + s.id);
                }
                await new Promise(r => setTimeout(r, 2000)); // sleep to avoid rate limits
            }
        }
    }
    log(\`Regeneration complete. Fixed \${count} surveys.\`);
}

regenerateBroken();
`;

let cleanCode = code.replace(/async function regenerateBroken\(\) \{[\s\S]*$/, '');
fs.writeFileSync('scratch/regenerate_ai.cjs', cleanCode + additionalCode);
console.log('Script prepared.');
