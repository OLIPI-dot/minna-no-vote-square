import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://minna-no-vote-square.vercel.app';

export default async function handler(req, res) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: surveys, error } = await supabase
      .from('surveys')
      .select('id, created_at')
      .eq('visibility', 'public')
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).send('Error fetching surveys');
    }

    const now = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${SITE_URL}/about.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.8</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${SITE_URL}/contact.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.7</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${SITE_URL}/terms.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.3</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${SITE_URL}/privacy.html</loc>\n    <lastmod>${now}</lastmod>\n    <priority>0.3</priority>\n  </url>\n`;

    for (const survey of (surveys || [])) {
      const date = new Date(survey.created_at).toISOString().split('T')[0];
      xml += `  <url>\n    <loc>${SITE_URL}/s/${survey.id}</loc>\n    <lastmod>${date}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.status(200).send(xml);

  } catch (err) {
    res.status(500).send(`Error: ${err.message}`);
  }
}
