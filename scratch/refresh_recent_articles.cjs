const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// .env 読み込み
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let geminiModel = null;
if (GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
} else {
    console.error('GEMINI_API_KEY is not set');
    process.exit(1);
}

const AI_SUMMARY_OPTIONS = {
    max_tokens: 2048,
    temperature: 0.7
};

const AI_SUMMARY_PROMPT = (articleContent) => `
以下のフォーマットのJSON形式のみを出力してください。余計な解説文やマークダウンの枠組みは不要です。

{
  "point1_title": "要点見出し1（15字以内）",
  "point1_desc": "要点説明1（60〜80字）",
  "point2_title": "要点見出し2（15字以内）",
  "point2_desc": "要点説明2（60〜80字）",
  "rabi_comment": "記事の具体名に触れたらびの感想（50〜70字）",
  "keyword_title": "専門用語（なければ空文字）",
  "keyword_desc": "用語の1行解説（なければ空文字）",
  "tags": ["固有名詞1", "固有名詞2", "トピック"],
  "survey_question": "記事の核心を突いた投票の問いかけ（30字以内）",
  "survey_options": [
    "選択肢1（前向き・期待・賛成の意見）",
    "選択肢2（別の視点やこだわり）",
    "選択肢3（慎重・懸念・反対・様子見の意見）",
    "選択肢4（あまり関心がない・様子見）"
  ]
}

【必須ルール（絶対遵守）】
・point1_title, point1_desc, point2_title, point2_desc, rabi_comment, tags, survey_question, survey_options のキーは【いかなる場合も省略せず、必ず全て】出力してください。
・要約（desc）は必ず60〜80文字程度で、読者にニュースのメリットや変更点がしっかり伝わる充実した内容にしてください。※【重要】本文の冒頭1〜2文をそのままコピー＆ペーストすることは絶対に禁止です。記事全体の趣旨を咀嚼してあなた自身の言葉で要約してください。タイトルの丸写しも厳禁です。
・rabi_comment に関する禁止事項：「話題のニュースだね！みんなはどう思う？」のような、どの記事にも使い回せる汎用的な定型文の出力は【厳禁】です。必ず「記事の中身（例：実質7万円は安いね！、噴火警戒は心配だね、等）」に感情を動かされたコメントにし、明るく親しみやすい語尾（うさぎキャラ）にしてください。
・keyword_title と keyword_desc は原則必須です。一般的な平易なニュース以外は必ず記事内の重要キーワードを1つ選んで解説を出力してください。
・tags の最優先ルール：記事タイトルに含まれる「作品名（例：ポケモンスリープ、ポケモン）」「製品名（例：iPhone、Galaxy）」「企業名」は【必ず最優先で1〜2個目にタグとして抽出】してください。
・tags に「注目トピック」「ニュース」「イベント」などの抽象的で無意味なワードは出力禁止です。記事本文から直接3〜4個抽出してください。
・survey_options は必ず4つの文字列の配列として出力してください。
・途中で文章が切れないよう、必ず完全なJSON形式で最後まで出力してください。

【記事テキスト】
${articleContent}
`.trim();

async function generateAISummary(articleContent) {
    if (!geminiModel || !articleContent || articleContent.length < 50) return null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const truncated = articleContent.substring(0, 2500);
            const result = await geminiModel.generateContent({
                contents: [{ role: 'user', parts: [{ text: AI_SUMMARY_PROMPT(truncated) }] }],
                generationConfig: {
                    maxOutputTokens: AI_SUMMARY_OPTIONS.max_tokens,
                    temperature: AI_SUMMARY_OPTIONS.temperature,
                    responseMimeType: "application/json",
                }
            });
            const responseText = result.response.text().trim();
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/(\{[\s\S]*\})/);
            const jsonString = jsonMatch ? jsonMatch[1].trim() : responseText;
            
            if (jsonString) {
                const parsed = JSON.parse(jsonString);
                if (
                    parsed && 
                    parsed.point1_title?.trim() && parsed.point1_desc?.trim() && 
                    parsed.point2_title?.trim() && parsed.point2_desc?.trim() && 
                    parsed.rabi_comment?.trim() &&
                    Array.isArray(parsed.tags) &&
                    parsed.survey_question?.trim() &&
                    Array.isArray(parsed.survey_options) &&
                    parsed.survey_options.length === 4
                ) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error(`AI retry ${attempt} failed: ${e.message}`);
        }
    }
    return null;
}

(async () => {
    // 1. 直近の surveys データを取得 (最新30件)
    const { data: surveys, error } = await supabase
        .from('surveys')
        .select('id, title, description, tags')
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) {
        console.error('Failed to fetch surveys:', error);
        process.exit(1);
    }

    console.log(`Fetched ${surveys.length} surveys. Updating...`);

    let updatedCount = 0;
    for (const survey of surveys) {
        // 既存の [[SUMMARY:...]] と 🐰 などの装飾を除去して生の本文だけにする
        const rawBody = survey.description
            .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')
            .replace(/🐰 \*\*らびの視点：\*\*[\s\S]*?(?=\n\n|$)/g, '')
            .replace(/\[続き[をに]読む\]\(https?:\/\/[^\s)]+\)/g, '')
            .replace(/[\(（]\s*出典[\s\S]*?[\)）]/g, '')
            .trim();

        console.log(`Processing ID: ${survey.id} (${survey.title})`);
        
        // 2. 本文を最新プロンプトでGeminiに渡し再生成
        const summaryObj = await generateAISummary(rawBody);
        
        if (summaryObj) {
            // 新しい richDescription を作成
            const newDescription = '[[SUMMARY:\n' + JSON.stringify(summaryObj, null, 2) + '\n]]\n\n' + rawBody;
            
            // 3. Supabaseの description と tags カラムを UPDATE
            const { error: updateError } = await supabase
                .from('surveys')
                .update({ 
                    description: newDescription, 
                    tags: summaryObj.tags 
                })
                .eq('id', survey.id);
                
            if (updateError) {
                console.error(`❌ Failed to update ID ${survey.id}:`, updateError.message);
            } else {
                // 4. アンケート選択肢（options）を再構築
                const { error: deleteOptionsError } = await supabase
                    .from('options')
                    .delete()
                    .eq('survey_id', survey.id);

                if (!deleteOptionsError) {
                    await supabase
                        .from('options')
                        .insert(summaryObj.survey_options.map(name => ({ survey_id: survey.id, name, votes: 0 })));
                }

                console.log(`✅ Updated ID ${survey.id}`);
                updatedCount++;
            }
        } else {
            console.log(`⚠️ Failed to generate AI summary for ID ${survey.id}`);
        }
        
        // Rate limit対策で少し待機
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`\n🎉 Refresh complete! Updated ${updatedCount} articles.`);
})();
