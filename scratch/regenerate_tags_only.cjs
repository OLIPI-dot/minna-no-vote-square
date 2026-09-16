const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" }); // Use the model name from auto_latest_news

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fixTagsWithAI() {
    console.log('Fetching recent surveys to fix tags...');
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description, tags')
        .order('id', { ascending: false })
        .limit(10); // Fix last 10 articles

    if (error) {
        console.error('Error fetching surveys:', error);
        return;
    }

    console.log(`Found ${surveys.length} surveys to process. (Will wait 15s between API calls to prevent Rate Limits)`);

    let count = 0;
    for (const s of surveys) {
        if (!s.description) continue;
        
        // Remove old summary block to get pure text
        const mainText = s.description.replace(/\[\[SUMMARY:[\s\S]*?\]\]/, '').trim();
        
        const prompt = `
以下の記事タイトルと本文から、タグを3〜4個抽出してJSON形式で出力してください。

【必須ルール】
・JSONのキーは "tags" のみ。
・最優先ルール：タイトルに含まれる「作品名（例：ポケモンスリープ）」「製品名（例：iPhone）」「企業名」は【必ず最優先で1〜2個目に抽出】すること。
・「注目トピック」「ニュース」「イベント」「公式発表」などの抽象的で無意味なワードは出力禁止。

【記事タイトル】
${s.title}

【本文】
${mainText.substring(0, 800)}...

【出力JSON】
{
  "tags": ["タグ1", "タグ2", "タグ3"]
}
`;

        try {
            console.log(`\nID ${s.id}: ${s.title}`);
            console.log(`Old Tags: ${JSON.stringify(s.tags)}`);
            console.log(`Generating new tags via Gemini...`);
            
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            const text = result.response.text();
            const parsed = JSON.parse(text);
            
            if (parsed.tags && Array.isArray(parsed.tags)) {
                const newTags = parsed.tags.map(t => String(t).trim()).filter(t => t.length > 0);
                
                if (newTags.length > 0) {
                    console.log(`=> New Tags: ${JSON.stringify(newTags)}`);
                    
                    const { error: updateErr } = await supabase
                        .from('surveys')
                        .update({ tags: newTags })
                        .eq('id', s.id);
                        
                    if (updateErr) {
                        console.error('Update Error:', updateErr);
                    } else {
                        console.log('✅ DB Updated!');
                        count++;
                    }
                }
            }
        } catch (e) {
            console.error(`❌ Failed for ID ${s.id}:`, e.message);
        }
        
        // Rate limit mitigation (15 RPM limit)
        console.log('Waiting 15 seconds...');
        await sleep(15000);
    }
    
    console.log(`\n🎉 All done! Fixed ${count} surveys.`);
}

fixTagsWithAI().catch(console.error);
