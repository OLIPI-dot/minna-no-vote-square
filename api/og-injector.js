import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, " "); // OGPのdescription用なので改行はスペースに変換
}

export default async function handler(req, res) {
  const surveyId = req.query.survey || req.query.s;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  try {
    // 1. 本来の静的 index.html をフェッチ
    // 注意: /index.html を直接指定して無限ループを防ぐ
    const htmlRes = await fetch(`${baseUrl}/index.html`);
    let html = await htmlRes.text();

    if (!surveyId) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    }

    // 2. Supabase からアンケート情報を取得
    const { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single();

    if (!error && survey) {
      // 3. OGP 情報を生成
      const title = escapeHtml(`📊「${survey.title}」| みんなのアンケート広場`);
      const description = escapeHtml(survey.description || '匿名で気軽に投票・本音が集まるアンケートコミュニティ。あなたの意見を教えてください！');
      const siteUrl = `${baseUrl}/s/${surveyId}`;

      let imageUrl = `${baseUrl}/ogp-image.png`;
      if (survey.image_url) {
        const parts = survey.image_url.split(',').map(v => v.trim());
        const ytPart = parts.find(v => v.startsWith('yt:'));
        if (ytPart) {
          const videoId = ytPart.substring(3);
          imageUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        } else if (parts[0] && parts[0].startsWith('http')) {
          imageUrl = parts[0];
        }
      }

      // 4. HTML 内のプレースホルダーを置換
      const customOgTags = `
  <!-- INJECTED BY OG-INJECTOR -->
  <title>${title}</title>
  <link rel="canonical" href="${siteUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
      `;

      // <!-- OG_TAGS_PLACEHOLDER_START --> から <!-- OG_TAGS_PLACEHOLDER_END --> までを置換
      html = html.replace(
        /<!-- OG_TAGS_PLACEHOLDER_START -->[\s\S]*?<!-- OG_TAGS_PLACEHOLDER_END -->/,
        customOgTags
      );

      // さらに元の <title> タグも置換 (プレースホルダー外にあるため削除)
      html = html.replace(/<title>.*?<\/title>/, '');
    }

    // 5. 書き換えた HTML を返す (人間もボットも同じSPAを読み込める)
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (err) {
    console.error('OGP Injection Error:', err);
    // エラー時はフェールセーフとしてルートへリダイレクト
    res.redirect(302, '/');
  }
}
