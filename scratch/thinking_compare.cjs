// 🧪 Gemini の「考える量」を変えたときの、料金（トークン数）と品質の比較テスト
// 投稿はしません。結果は scratch/thinking_compare_result.json に保存します。
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) process.env[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 本番スクリプトと同じプロンプトを使うため、ソースから抜き出す
const src = fs.readFileSync(path.join(ROOT, 'scripts', 'auto_latest_news.cjs'), 'utf8');
const tpl = src.match(/const AI_SUMMARY_PROMPT = \(articleContent\) => `([\s\S]*?)`\.trim\(\);/)[1];
const buildPrompt = (text) => tpl.replace('${articleContent}', text).trim();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const model = new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-3.6-flash' });

const CONFIGS = {
  current: { maxOutputTokens: 2048, temperature: 0.7, responseMimeType: 'application/json' },
  low: { maxOutputTokens: 2048, responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'low' } },
};

(async () => {
  const { data: surveys } = await supabase
    .from('surveys')
    .select('id,title,description')
    .eq('is_official', true)
    .order('created_at', { ascending: false })
    .limit(2);

  const results = [];
  for (const s of surveys) {
    // 保存済みの説明文から、要約ブロックと出典リンクを除いた本文だけを取り出す
    const body = (s.description || '')
      .replace(/\[\[SUMMARY:[\s\S]*?\]\]/, '')
      .split('（出典：')[0]
      .trim()
      .substring(0, 2500);
    for (const [name, cfg] of Object.entries(CONFIGS)) {
      const t0 = Date.now();
      const r = { title: s.title, config: name };
      try {
        const res = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: buildPrompt(body) }] }],
          generationConfig: cfg,
        });
        const u = res.response.usageMetadata || {};
        r.seconds = ((Date.now() - t0) / 1000).toFixed(1);
        r.promptTokens = u.promptTokenCount;
        r.outputTokens = u.candidatesTokenCount;
        r.thinkingTokens = u.thoughtsTokenCount || 0;
        r.finishReason = res.response.candidates?.[0]?.finishReason;
        const text = res.response.text().trim();
        try { r.output = JSON.parse(text); r.ok = true; } catch (e) { r.ok = false; r.raw = text; r.error = e.message; }
      } catch (e) {
        r.ok = false;
        r.error = e.message;
      }
      console.log(`${r.config.padEnd(8)} ok=${r.ok} think=${r.thinkingTokens} out=${r.outputTokens} in=${r.promptTokens} ${r.seconds}s ${r.finishReason || ''} | ${s.title}`);
      if (r.error) console.log('   error:', r.error.slice(0, 200));
      results.push(r);
    }
  }
  fs.writeFileSync(path.join(__dirname, 'thinking_compare_result.json'), JSON.stringify(results, null, 2));
})();
