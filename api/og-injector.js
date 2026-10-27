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
    .replace(/\s+/g, " "); // 改行・連続空白を綺麗にスペース変換
}

// 🌸 Google検索やSNSで最もクリックされやすい魅力的な要約文を生成する
function formatCleanDescription(rawDesc, title) {
  if (!rawDesc) {
    return `「${title || 'アンケート'}」についてみんなの意見や投票結果をリアルタイム公開中！匿名で気軽に投票・本音が集まるアンケート広場「みんアケ」でチェック！`;
  }

  let text = '';

  // 1. [[SUMMARY: ... ]] のJSONを綺麗にパースして要点を抽出
  if (rawDesc.includes('[[SUMMARY:')) {
    try {
      const match = rawDesc.match(/\[\[SUMMARY:\s*([\s\S]*?)\s*\]\]/);
      if (match && match[1]) {
        const json = JSON.parse(match[1]);
        const parts = [];
        if (json.point1_desc) parts.push(json.point1_desc);
        if (json.point2_desc) parts.push(json.point2_desc);
        if (json.rabi_comment) parts.push(json.rabi_comment);
        text = parts.join(' ').trim();
      }
    } catch (e) {
      text = rawDesc.replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '').trim();
    }
  } else {
    text = rawDesc;
  }

  // 2. HTMLタグ、マークダウン記号、URL、不要な注釈を綺麗に除去
  text = text
    .replace(/<[^>]*>?/gm, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*`_~]/g, '')
    .replace(/（出典：.*?）/g, '')
    .replace(/【続きを読む】/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. 検索結果に最も見やすい文字数（100〜120文字）にトリミング
  if (text.length > 115) {
    text = text.substring(0, 110) + '...';
  }

  if (!text) {
    text = `「${title}」についてみんなの投票結果や意見をチェック！`;
  }

  return `${text} 投票結果やみんなのリアルなコメントを「みんアケ」でチェック！`;
}

export default async function handler(req, res) {
  const surveyId = req.query.survey || req.query.s;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  const CANONICAL_BASE_URL = 'https://www.minna-no-vote-square.com';

  try {
    // 1. 本来の静的 index.html をフェッチ
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
      .maybeSingle();

    if (error || !survey) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(html);
    }

    // 3. OGP ＆ SEO用メタ情報を生成（正規URLは常に www ありに統一）
    const title = escapeHtml(`📊「${survey.title}」| みんアケ🐰🥕 | みんなのアンケート広場`);
    const cleanDesc = escapeHtml(formatCleanDescription(survey.description, survey.title));
    const siteUrl = `${CANONICAL_BASE_URL}/s/${surveyId}`;

    let imageUrl = `${CANONICAL_BASE_URL}/ogp-image.png`;
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

    // 4. HTML 内のプレースホルダーを置換（Google検索が最重要視する meta description も完全注入！）
    const customOgTags = `
  <!-- INJECTED BY OG-INJECTOR (SEO & OGP) -->
  <title>${title}</title>
  <link rel="canonical" href="${siteUrl}" />
  <meta name="description" content="${cleanDesc}" />
  <meta property="og:site_name" content="みんなのアンケート広場" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${cleanDesc}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${cleanDesc}" />
  <meta name="twitter:image" content="${imageUrl}" />
    `;

    // <!-- OG_TAGS_PLACEHOLDER_START --> から <!-- OG_TAGS_PLACEHOLDER_END --> までを置換
    html = html.replace(
      /<!-- OG_TAGS_PLACEHOLDER_START -->[\s\S]*?<!-- OG_TAGS_PLACEHOLDER_END -->/,
      customOgTags
    );

    // 元の <title> タグや静的 <meta name="description"> を安全に置換
    html = html.replace(/<title>.*?<\/title>/, '');
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, '');

    // 5. 書き換えた HTML を返す
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (err) {
    console.error('OGP Injection Error:', err);
    res.redirect(302, '/');
  }
}
