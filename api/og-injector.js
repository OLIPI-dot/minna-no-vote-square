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

// 🌸 [[SUMMARY: ...]] から構造化データを抽出するヘルパー
function extractSummaryData(rawDesc) {
  if (!rawDesc) return { points: [], rabiComment: '', plainText: '' };

  const points = [];
  let rabiComment = '';
  let plainText = '';

  if (rawDesc.includes('[[SUMMARY:')) {
    try {
      const match = rawDesc.match(/\[\[SUMMARY:\s*([\s\S]*?)\s*\]\]/);
      if (match && match[1]) {
        const json = JSON.parse(match[1]);
        if (json.point1_title || json.point1_desc) {
          points.push({ title: json.point1_title || 'ポイント1', desc: json.point1_desc || '' });
        }
        if (json.point2_title || json.point2_desc) {
          points.push({ title: json.point2_title || 'ポイント2', desc: json.point2_desc || '' });
        }
        if (json.point3_title || json.point3_desc) {
          points.push({ title: json.point3_title || 'ポイント3', desc: json.point3_desc || '' });
        }
        if (json.rabi_comment) {
          rabiComment = json.rabi_comment;
        }
      }
    } catch (e) {
      // JSONパース失敗時はフォールバック
    }
  }

  plainText = rawDesc
    .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*`_~]/g, '')
    .replace(/（出典：.*?）/g, '')
    .replace(/【続きを読む】/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { points, rabiComment, plainText };
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

    // 2. Supabase からアンケート情報・選択肢・コメント・新着アンケートを並列取得（SEO本文＆内部リンク網生成用）
    const [
      { data: survey, error },
      { data: options },
      { data: comments },
      { data: recentSurveys }
    ] = await Promise.all([
      supabase.from('surveys').select('*').eq('id', surveyId).maybeSingle(),
      supabase.from('options').select('id, name, votes').eq('survey_id', surveyId).order('id', { ascending: true }),
      supabase.from('comments').select('user_name, content, created_at').eq('survey_id', surveyId).order('created_at', { ascending: true }).limit(10),
      supabase.from('surveys').select('id, title, category').eq('visibility', 'public').neq('id', surveyId).order('created_at', { ascending: false }).limit(10)
    ]);

    if (error || !survey) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(404).send(html);
    }

    // 同じカテゴリの関連アンケートも最大8件取得して内部リンク網を構築
    let categorySurveys = [];
    if (survey.category) {
      const { data: catData } = await supabase
        .from('surveys')
        .select('id, title, category')
        .eq('visibility', 'public')
        .eq('category', survey.category)
        .neq('id', surveyId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (Array.isArray(catData)) {
        categorySurveys = catData;
      }
    }

    // 3. OGP ＆ SEO用メタ情報を生成（正規URLは常に www ありに統一）
    const title = escapeHtml(`📊「${survey.title}」【みんなの本音・投票結果】| みんアケ🐰🥕`);
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

    // 4. 構造化データ（DiscussionForumPosting）を生成してGoogle検索に記事・投票・コメントを伝える
    const { points, rabiComment, plainText } = extractSummaryData(survey.description);
    const bodyTextForSchema = [
      ...points.map(p => `${p.title}: ${p.desc}`),
      rabiComment,
      plainText
    ].filter(Boolean).join(' ') || cleanDesc;

    const breadcrumbItems = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "みんなのアンケート広場（みんアケ）",
        "item": `${CANONICAL_BASE_URL}/`
      }
    ];
    if (survey.category) {
      breadcrumbItems.push({
        "@type": "ListItem",
        "position": 2,
        "name": survey.category,
        "item": `${CANONICAL_BASE_URL}/?c=${encodeURIComponent(survey.category)}`
      });
    }
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": breadcrumbItems.length + 1,
      "name": survey.title,
      "item": siteUrl
    });

    const jsonLdData = [
      {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        "headline": survey.title,
        "description": formatCleanDescription(survey.description, survey.title),
        "articleBody": bodyTextForSchema,
        "url": siteUrl,
        "datePublished": survey.created_at,
        "image": imageUrl,
        "author": {
          "@type": "Organization",
          "name": "みんなのアンケート広場（みんアケ）",
          "url": CANONICAL_BASE_URL
        },
        "interactionStatistic": [
          {
            "@type": "InteractionCounter",
            "interactionType": "https://schema.org/VoteAction",
            "userInteractionCount": survey.total_votes || 0
          },
          {
            "@type": "InteractionCounter",
            "interactionType": "https://schema.org/CommentAction",
            "userInteractionCount": survey.comment_count || (comments ? comments.length : 0)
          }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems
      }
    ];
    const safeJsonLd = JSON.stringify(jsonLdData).replace(/</g, '\\u003c');

    // 5. HTML 内のプレースホルダーを置換（Google検索が最重要視する meta description ＆ JSON-LD も完全注入！）
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
  <script type="application/ld+json">${safeJsonLd}</script>
    `;

    // <!-- OG_TAGS_PLACEHOLDER_START --> から <!-- OG_TAGS_PLACEHOLDER_END --> までを置換
    html = html.replace(
      /<!-- OG_TAGS_PLACEHOLDER_START -->[\s\S]*?<!-- OG_TAGS_PLACEHOLDER_END -->/,
      customOgTags
    );

    // 元の <title> タグや静的 <meta name="description"> を安全に置換
    html = html.replace(/<title>.*?<\/title>/, '');
    html = html.replace(/<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i, '');

    // 6. Googlebot向けに初期HTMLの <div id="root"> 内にアンケート本文・選択肢・コメントをSSR注入！
    // （人間がブラウザで開いた時はReact起動と同時にいつもの画面へ自動で置き換わります）
    const cleanTags = Array.isArray(survey.tags)
      ? survey.tags.filter(t => typeof t === 'string' && !t.startsWith('_STAMP:') && !t.startsWith('[L]'))
      : [];

    const pointsHtml = points.length > 0
      ? `<section><h2>ニュースの要点・背景</h2>${points.map(p => `<h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.desc)}</p>`).join('')}</section>`
      : (plainText ? `<section><h2>アンケートの背景</h2><p>${escapeHtml(plainText)}</p></section>` : '');

    const rabiHtml = rabiComment
      ? `<section><h2>らびたんのコメント</h2><p>${escapeHtml(rabiComment)}</p></section>`
      : '';

    const optionsHtml = Array.isArray(options) && options.length > 0
      ? `<section><h2>投票の選択肢（現在 合計${Number(survey.total_votes) || 0}票）</h2><ul>${options.map(o => {
        const optName = escapeHtml((o.name || '').replace(/^\u200B/, ''));
        const optVotes = Number(o.votes) || 0;
        return `<li>${optName}（${optVotes}票）</li>`;
      }).join('')}</ul></section>`
      : '';

    const commentsHtml = Array.isArray(comments) && comments.length > 0
      ? `<section><h2>みんなのコメント・本音</h2><ul>${comments.map(c => `<li><strong>${escapeHtml(c.user_name || '名無しの広場民')}:</strong> ${escapeHtml(c.content || '')}</li>`).join('')}</ul></section>`
      : '';

    const tagsHtml = cleanTags.length > 0
      ? `<p>関連キーワード: ${cleanTags.map(t => escapeHtml(t)).join(' / ')}</p>`
      : '';

    const usedIds = new Set([String(surveyId)]);
    const relatedCategoryHtml = categorySurveys.length > 0
      ? `<nav aria-label="関連するアンケート"><h2>「${escapeHtml(survey.category)}」の関連アンケート</h2><ul>${categorySurveys.map(item => {
        usedIds.add(String(item.id));
        return `<li><a href="${CANONICAL_BASE_URL}/s/${item.id}">${escapeHtml(item.title)}</a></li>`;
      }).join('')}</ul></nav>`
      : '';

    const filteredRecent = Array.isArray(recentSurveys)
      ? recentSurveys.filter(item => !usedIds.has(String(item.id))).slice(0, 6)
      : [];

    const recentSurveysHtml = filteredRecent.length > 0
      ? `<nav aria-label="新着アンケート"><h2>いま注目の新着アンケート</h2><ul>${filteredRecent.map(item => `<li><a href="${CANONICAL_BASE_URL}/s/${item.id}">${escapeHtml(item.title)}</a></li>`).join('')}</ul></nav>`
      : '';

    const ssrArticleHtml = `<div id="root">
    <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;font-family:sans-serif;color:#94a3b8;">
      <p>読み込み中...🐰</p>
    </div>
    <article style="max-width:720px;margin:0 auto;padding:16px;color:#475569;font-family:sans-serif;font-size:14px;line-height:1.7;">
      <nav aria-label="パンくずリスト"><a href="${CANONICAL_BASE_URL}/">みんなのアンケート広場（みんアケ）トップ</a>${survey.category ? ` &gt; <span>${escapeHtml(survey.category)}</span>` : ''}</nav>
      <h1>${escapeHtml(survey.title)}</h1>
      ${survey.category ? `<p>カテゴリ: ${escapeHtml(survey.category)}</p>` : ''}
      ${tagsHtml}
      ${pointsHtml}
      ${rabiHtml}
      ${optionsHtml}
      ${commentsHtml}
      ${relatedCategoryHtml}
      ${recentSurveysHtml}
    </article>
  </div>`;

    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>\s*<\/div>/,
      ssrArticleHtml
    );

    // 5. 書き換えた HTML を返す
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);

  } catch (err) {
    console.error('OGP Injection Error:', err);
    res.redirect(302, '/');
  }
}
