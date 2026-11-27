import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// 🕒 「〇分前」表示
const timeAgo = (dateStr) => {
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diffSec < 60) return 'たった今';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}分前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}時間前`;
  const day = Math.floor(hour / 24);
  return `${day}日前`;
};

// ✂️ コメント本文を30文字くらいに短くする（続きが気になる作戦🤭）
const shortText = (text, max = 30) => {
  const clean = (text || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/>>\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
};

const shortTitle = (title, max = 28) => {
  const t = title || 'アンケート';
  return t.length > max ? t.slice(0, max) + '…' : t;
};

const SHOW_COUNT = 5;

// 💬 新着コメント（どの記事にどんなコメントがついたかを紹介）
const RecentComments = ({ navigateTo }) => {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('min_ake_cached_recent_comments_v1') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 1. 新しいコメントを少し多めに取得（削除済みや非公開記事を除いた後で5件残るように）
      const { data: comms, error } = await supabase
        .from('comments')
        .select('id, survey_id, content, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error || !Array.isArray(comms) || cancelled) return;

      const valid = comms.filter(c => c.content && c.content !== '[[DELETED]]' && shortText(c.content));
      const surveyIds = [...new Set(valid.map(c => c.survey_id))];
      if (surveyIds.length === 0) { setItems([]); return; }

      // 2. コメントがついた記事の情報を取得（公開中のものだけ・descriptionは除外して通信軽量化）
      const { data: svs } = await supabase
        .from('surveys')
        .select('id,title,category,tags,visibility,image_url,likes_count,total_votes,is_official,created_at,deadline,source_published_at,view_count,comment_count')
        .in('id', surveyIds)
        .eq('visibility', 'public');
      if (cancelled || !Array.isArray(svs)) return;

      const svMap = new Map(svs.map(s => [String(s.id), s]));

      // 3. 同じ記事が並びすぎないよう、1記事につき最新1件だけ紹介
      const seen = new Set();
      const result = [];
      for (const c of valid) {
        const key = String(c.survey_id);
        const sv = svMap.get(key);
        if (!sv || seen.has(key)) continue;
        seen.add(key);
        result.push({ comment: c, survey: sv });
        if (result.length >= SHOW_COUNT) break;
      }
      setItems(result);
      try { localStorage.setItem('min_ake_cached_recent_comments_v1', JSON.stringify(result)); } catch {}
    };

    const initTimer = setTimeout(load, 600);
    // 🔄 3分ごとにそっと更新＋スマホの回線復帰時に再取得
    const timer = setInterval(load, 3 * 60 * 1000);
    const handleWakeOrOnline = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setItems(prev => {
          if (!prev || prev.length === 0) load();
          return prev;
        });
      }
    };
    window.addEventListener('online', load);
    document.addEventListener('visibilitychange', handleWakeOrOnline);
    return () => {
      cancelled = true;
      clearTimeout(initTimer);
      clearInterval(timer);
      window.removeEventListener('online', load);
      document.removeEventListener('visibilitychange', handleWakeOrOnline);
    };
  }, []);

  // コメントがまだ無いときはカードごと出さない
  if (items.length === 0) return null;

  return (
    <div className="sidebar-section-card" style={{ marginBottom: '24px' }}>
      <h3 className="live-feed-title" style={{ color: '#0284c7' }}>💬 新着コメント</h3>
      <div className="live-feed-content">
        {items.map(({ comment, survey }) => (
          <div
            key={comment.id}
            className="live-item clickable"
            onClick={() => navigateTo('details', survey)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && navigateTo('details', survey)}
            aria-label={`${survey.title} についたコメントを見る`}
            style={{ borderLeft: '4px solid #7dd3fc' }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px', color: '#334155' }}>
              「{shortTitle(survey.title)}」
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', background: '#f0f9ff', padding: '4px 8px', borderRadius: '8px' }}>
              💭 {shortText(comment.content)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
              {timeAgo(comment.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentComments;
