import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AVATARS = ['🐰', '🐱', '🐶', '🐥', '🦊', '🐼', '🎮', '☕', '🌸', '✨'];

const QUICK_CHAT_PHRASES = [
  '👋 こんにちは！',
  '🥕 おつかれさま！',
  '🗳️ 投票してきたよ！',
  '🎰 ガチャ回したよ！',
  '🐰 らびたん話そう！'
];

// 🐰 らびたんの文脈お返事ジェネレーター
function buildRabiChatReply(userText, posterName) {
  const cleanName = (posterName || '名無しの広場民').replace(/\s*◆.*$/, '').trim() || '広場民';
  const text = (userText || '').toLowerCase();

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  if (/おはよ|おは〜|おはー|朝/.test(text)) {
    return pick([
      `＞${cleanName}さん\nおはようらび〜☀️🐰 今日も素敵な1日になりますように！朝のパトロールや投票も楽しんでいってね🥕✨`,
      `＞${cleanName}さん\nおはようらびっ🐰🌸 早起きえらいらび〜！今日も広場で最新の話題をチェックしてみてね🥕`
    ]);
  }
  if (/おつかれ|お疲れ|疲れた|ねむい|眠い|おやすみ|こんばん/.test(text)) {
    return pick([
      `＞${cleanName}さん\n今日もおつかれさまらび〜🐰🍵 特製ニンジンジュースをどうぞっ🥕 広場でゆっくりしていってね✨`,
      `＞${cleanName}さん\n毎日がんばっててえらいらび〜🐰🌸 ここでは肩の力を抜いて、のんびりアンケートやみんクエを楽しんでね🥕`
    ]);
  }
  if (/ガチャ|当た|ur|lr|ssr|パトロール|ボス|レイド|みんクエ|チケット|装備|ドロップ/.test(text)) {
    return pick([
      `＞${cleanName}さん\nみんクエ遊んでくれてありがとうらび〜🐰⚔️✨ 次はさらにすごい神引き＆レア装備が出ますようにっ🎰🥕`,
      `＞${cleanName}さん\nおお〜！広場の平和を守ってくれて心強いらび🛡️🐰 レイドボスや地下パトロールも一緒にがんばろうね🔥`
    ]);
  }
  if (/投票|アンケート|記事|ニュース|迷う|どっち|ランキング/.test(text)) {
    return pick([
      `＞${cleanName}さん\n投票ありがとうらび〜🗳️🐰✨ みんなの本音や結果を見るのワクワクするよね！気になる記事にコメントも残してみてね🥕`,
      `＞${cleanName}さん\nいろんな意見があって面白いよね🐰🌸 他にも気になる話題があったらどんどん1票入れてみてね🥕✨`
    ]);
  }
  if (/お腹|ごはん|ご飯|おやつ|食べ|ラーメン|カレー|おにぎり|にんじん|ニンジン|🥕/.test(text)) {
    return pick([
      `＞${cleanName}さん\nおいしそうらび〜🤤🥕 らびたんも特大ニンジンおにぎりが食べたくなってきちゃった🐰🍙✨`,
      `＞${cleanName}さん\nいいなぁ〜🐰🍴 おいしいものを食べてエネルギー満タンにしてね🥕✨`
    ]);
  }
  if (/こんにちは|こん〜|やっほ|はじめまして|👋/.test(text)) {
    return pick([
      `＞${cleanName}さん\nこんにちはらび〜🐰🥕✨ 広場に来てくれてうれしいな！今日もゆっくり遊んでいってね🌸`,
      `＞${cleanName}さん\nやっほーらび！🐰✨ 今日も新しいアンケートやみんクエで一緒に盛り上がろうね🥕`
    ]);
  }
  if (/らび|ラビ|うさぎ|ウサギ|話そう|？|\?|どう思/.test(text)) {
    return pick([
      `＞${cleanName}さん\n呼んでくれてうれしいらび〜🐰💕 らびたんはいつでもこの広場でみんなのこと見守ってるよ！なんでも気軽に話しかけてね🥕✨`,
      `＞${cleanName}さん\nなるほどらび〜🤔🐰 広場のみんなはどう思ってるか、アンケートで聞いてみるのも面白そうらびね🥕✨`
    ]);
  }

  return pick([
    `＞${cleanName}さん\nつぶやいてくれてありがとうらび〜🐰🥕✨ 広場がにぎやかになってとってもうれしいな🌸`,
    `＞${cleanName}さん\nうんうん、わかるらび〜🐰✨ 今日も広場でいろんな話題やみんクエを楽しんでいってね🥕`,
    `＞${cleanName}さん\n素敵なひとことありがとうらび🐰🌸 よかったら気になるアンケートにもポチッと1票入れてみてね🗳️✨`
  ]);
}

// 時間を「○分前」表示に変換
function timeAgo(dateStr) {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin}分前`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}時間前`;
  return `${Math.floor(diffH / 24)}日前`;
}

const SquareTimeline = () => {
  const [posts, setPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('min_ake_cached_timeline_v1') || '[]'); } catch { return []; }
  });
  const [inputText, setInputText] = useState('');
  const [name, setName] = useState(() => {
    try {
      const saved = localStorage.getItem('minake_hn') || '';
      return saved && saved !== '匿名広場民' ? saved.slice(0, 12) : '';
    } catch { return ''; }
  });
  const [selectedAvatar, setSelectedAvatar] = useState('🐰');
  const [isPosting, setIsPosting] = useState(false);
  const [rabiReplyEnabled, setRabiReplyEnabled] = useState(true);
  const [isRabiTyping, setIsRabiTyping] = useState(false);
  const [likedIds, setLikedIds] = useState(() => {
    const saved = localStorage.getItem('timeline_liked_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('min_ake_cached_timeline_v1') || '[]');
      return !(Array.isArray(cached) && cached.length > 0);
    } catch { return true; }
  });
  const [lastPostTime, setLastPostTime] = useState(0); // スパム防止
  const [timelineTab, setTimelineTab] = useState('chat'); // 'chat' | 'news' | 'all'
  const scrollRef = useRef(null);

  // 🔄 初回データ取得（4G/5G回線で記事一覧を優先するため300ms遅らせ、キャッシュがあれば0秒表示＆失敗時自動リトライ）
  useEffect(() => {
    let retryTimer = null;
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('timeline_posts')
        .select('*')
        .not('name', 'ilike', '%実況%')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && Array.isArray(data) && data.length > 0) {
        setPosts(data);
        try { localStorage.setItem('min_ake_cached_timeline_v1', JSON.stringify(data)); } catch { }
      } else if (error) {
        retryTimer = setTimeout(fetchPosts, 3500);
      }
      setIsLoading(false);
    };

    fetchPosts();

    // 📱 スマホでスリープ復帰・回線復帰したときにタイムラインが空なら自動で再取得
    const handleWakeOrOnline = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setPosts(prev => {
          if (!prev || prev.length === 0) fetchPosts();
          return prev;
        });
      }
    };
    window.addEventListener('online', fetchPosts);
    document.addEventListener('visibilitychange', handleWakeOrOnline);

    // ⚡ Supabase Realtime 購読 - 誰かが投稿したら即座に全員の画面に届く！
    const channel = supabase
      .channel('timeline_posts_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'timeline_posts' },
        (payload) => {
          // 🛡️ ゲーム実況・ボスのログはチャットタイムラインに混ぜない
          if (payload.new?.name && payload.new.name.includes('実況')) return;
          setPosts(prev => [payload.new, ...prev.slice(0, 29)]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'timeline_posts' },
        (payload) => {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        }
      )
      .subscribe();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener('online', fetchPosts);
      document.removeEventListener('visibilitychange', handleWakeOrOnline);
      supabase.removeChannel(channel);
    };
  }, []);

  // 🚀 投稿する
  const handlePost = async (e) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (!trimmedText) return;

    // スパム防止: 10秒に1回まで
    const now = Date.now();
    if (now - lastPostTime < 10000) {
      alert('少し待ってからもう一度つぶやいてね！🐰（10秒に1回まで）');
      return;
    }

    const posterName = name.trim() || '名無しの広場民';
    setIsPosting(true);
    const { data: insertedRows, error } = await supabase
      .from('timeline_posts')
      .insert([{
        name: posterName,
        avatar: selectedAvatar,
        content: trimmedText
      }])
      .select();

    if (error) {
      console.error('Post error:', error);
      alert('投稿に失敗しました。もう一度試してみてね！');
      setIsPosting(false);
      return;
    }

    if (Array.isArray(insertedRows) && insertedRows[0]) {
      const newPost = insertedRows[0];
      setPosts(prev => prev.some(p => p.id === newPost.id) ? prev : [newPost, ...prev.slice(0, 29)]);
    }
    setInputText('');
    setLastPostTime(now);
    setTimelineTab('chat');
    setIsPosting(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    // 🐰 らびたん自動お返事（ONのとき、2.2秒後に優しく返信！）
    if (rabiReplyEnabled) {
      setIsRabiTyping(true);
      const replyContent = buildRabiChatReply(trimmedText, posterName);
      setTimeout(async () => {
        try {
          let { data: rabiRows, error: rabiErr } = await supabase
            .from('timeline_posts')
            .insert([{
              name: 'らび🐰',
              avatar: '🐰',
              content: replyContent,
              is_official: true
            }])
            .select();
          if (rabiErr) {
            const fb = await supabase
              .from('timeline_posts')
              .insert([{
                name: 'らび🐰',
                avatar: '🐰',
                content: replyContent
              }])
              .select();
            rabiRows = fb.data;
          }
          if (Array.isArray(rabiRows) && rabiRows[0]) {
            const rabiPost = { ...rabiRows[0], is_official: true };
            setPosts(prev => prev.some(p => p.id === rabiPost.id) ? prev : [rabiPost, ...prev.slice(0, 29)]);
          }
        } catch (err) {
          console.warn('Rabi auto reply error:', err);
        } finally {
          setIsRabiTyping(false);
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        }
      }, 2200);
    }
  };

  // ラビ公式投稿のデザイン定義
  const officialCardStyle = {
    background: 'linear-gradient(135deg, #fdf4ff 0%, #f0f4ff 50%, #fff7ed 100%)',
    border: '1.5px solid #c4b5fd',
    boxShadow: '0 4px 16px rgba(139,92,246,0.10)',
    position: 'relative',
    overflow: 'hidden'
  };

  const officialAvatarStyle = {
    background: 'linear-gradient(135deg, #a78bfa, #60a5fa, #f472b6)',
    boxShadow: '0 0 0 2px #fff, 0 0 0 3px #a78bfa'
  };

  const officialNameStyle = {
    background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '900',
    fontSize: '0.88rem'
  };

  // 🎰 速報（ガチャ・ドロップ）のデザイン定義
  const newsCardStyle = {
    background: 'linear-gradient(135deg, #fffdf5 0%, #fef9c3 35%, #fffbeb 100%)',
    border: '1.5px solid #facc15',
    boxShadow: '0 4px 14px rgba(234, 179, 8, 0.15)',
    position: 'relative',
    overflow: 'hidden'
  };

  const newsAvatarStyle = {
    background: 'linear-gradient(135deg, #fde047, #f59e0b, #ea580c)',
    boxShadow: '0 0 0 2px #fff, 0 0 0 3px #f59e0b'
  };

  const newsNameStyle = {
    background: 'linear-gradient(90deg, #b45309, #d97706)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '900',
    fontSize: '0.88rem'
  };

  // タイムライン本文の装飾レンダラー
  const renderTimelineContent = (content) => {
    if (typeof content !== 'string') return null;

    // ガチャ速報・ドロップ速報のパース
    const headerMatch = content.match(/^【(ガチャ|ドロップ)速報】\s*/);
    if (headerMatch) {
      const newsType = headerMatch[1]; // 'ガチャ' or 'ドロップ'
      const rest = content.slice(headerMatch[0].length);
      const detailMatch = rest.match(/^(.+?)さんが\s*(?:(.*?から)\s*)?\[([^\]]+)\]\s*(.+?)\s*(を(?:引き当てました|ドロップしました|手に入れました|獲得しました)！?.*)$/);

      if (detailMatch) {
        const [, playerName, fromText, rarity, itemName, actionText] = detailMatch;

        // レアリティに応じたバッジ色
        let rarityBadgeStyle = {
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#ffffff',
          boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
        };
        let rarityIcon = '✨';

        if (rarity === 'LR') {
          rarityBadgeStyle = {
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)',
            color: '#ffffff',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)'
          };
          rarityIcon = '🌈';
        } else if (rarity === 'UR') {
          rarityBadgeStyle = {
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)',
            color: '#78350f',
            fontWeight: '900',
            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.35)'
          };
          rarityIcon = '✨';
        } else if (rarity === 'SR' || rarity === 'SSR') {
          rarityBadgeStyle = {
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(168, 85, 247, 0.3)'
          };
          rarityIcon = '⭐';
        }

        return (
          <div style={{ margin: '4px 0 6px 0', fontSize: '0.85rem' }}>
            {/* 上段: プレイヤーと獲得経路 */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
              <span style={{
                fontWeight: '800',
                color: '#78350f',
                background: 'rgba(254, 240, 138, 0.6)',
                padding: '1px 7px',
                borderRadius: '6px',
                border: '1px solid #fde047',
                fontSize: '0.82rem'
              }}>
                {playerName} さん
              </span>
              {fromText && (
                <span style={{ fontSize: '0.78rem', color: '#854d0e', fontWeight: '700' }}>
                  {fromText}
                </span>
              )}
            </div>

            {/* 中段: レアリティ＆アイテム名ボックス */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ffffff 0%, #fefce8 100%)',
              border: '1.5px solid #fef08a',
              boxShadow: '0 2px 8px rgba(234, 179, 8, 0.15)',
              margin: '2px 0 6px 0',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <span style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                borderRadius: '8px',
                fontWeight: '900',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
                ...rarityBadgeStyle
              }}>
                <span>{rarityIcon}</span>
                <span>{rarity}</span>
              </span>
              <span style={{
                fontWeight: '900',
                fontSize: '0.9rem',
                color: '#78350f',
                letterSpacing: '0.01em',
                wordBreak: 'break-word'
              }}>
                {itemName}
              </span>
            </div>

            {/* 下段: アクションテキスト */}
            <div style={{
              fontSize: '0.8rem',
              color: '#b45309',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px'
            }}>
              <span>{newsType === 'ガチャ' ? '🎊' : '⚔️'}</span>
              <span>{actionText}</span>
            </div>
          </div>
        );
      }

      // パースできなかった場合のフォールバック（速報タグ付き）
      return (
        <div style={{ margin: '4px 0 6px 0', fontSize: '0.85rem' }}>
          <span style={{
            display: 'inline-block',
            fontWeight: '800',
            color: '#b45309',
            background: '#fef3c7',
            padding: '1px 6px',
            borderRadius: '6px',
            marginRight: '6px',
            fontSize: '0.75rem'
          }}>
            【{newsType}速報】
          </span>
          <span style={{ color: '#451a03', fontWeight: '600' }}>{rest}</span>
        </div>
      );
    }

    // 通常の投稿
    return (
      <div style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: '#334155',
        fontSize: '0.85rem',
        lineHeight: '1.45',
        margin: '3px 0 6px 0'
      }}>
        {content}
      </div>
    );
  };

  // 💖 いいねを押す (トグル式)
  const handleLike = async (post) => {
    const isLiked = likedIds.has(post.id);
    const newLikes = isLiked ? Math.max(0, (post.likes || 0) - 1) : (post.likes || 0) + 1;

    setLikedIds(prev => {
      const next = new Set(prev);
      if (isLiked) {
        next.delete(post.id);
      } else {
        next.add(post.id);
      }
      localStorage.setItem('timeline_liked_ids', JSON.stringify(Array.from(next)));
      return next;
    });

    // 楽観的更新（UIをすぐ変える）
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));

    // ※タイムラインは高頻度ではないため簡易的なUpdateを使用
    await supabase
      .from('timeline_posts')
      .update({ likes: newLikes })
      .eq('id', post.id);
  };

  // タブに応じた投稿フィルタ
  const displayedPosts = posts.filter(p => {
    if (p.name && p.name.includes('実況')) return false;
    const isNews = typeof p.content === 'string' && (p.content.startsWith('【ガチャ速報】') || p.content.startsWith('【ドロップ速報】'));
    if (timelineTab === 'chat') return !isNews;
    if (timelineTab === 'news') return isNews;
    return true;
  });

  const newsCount = posts.filter(p => !p.name?.includes('実況') && typeof p.content === 'string' && (p.content.startsWith('【ガチャ速報】') || p.content.startsWith('【ドロップ速報】'))).length;
  const chatCount = posts.filter(p => !p.name?.includes('実況') && typeof p.content === 'string' && !(p.content.startsWith('【ガチャ速報】') || p.content.startsWith('【ドロップ速報】'))).length;

  return (
    <div className="sidebar-section-card" style={{
      marginBottom: '24px',
      border: '1px solid #e2e8f0',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      overflow: 'visible',
      boxSizing: 'border-box',
      padding: '20px 16px',
      width: '100%'
    }}>
      {/* 🏷️ ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1.5px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <h3 style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: '900',
            color: '#1e293b'
          }}>広場のタイムライン</h3>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.72rem',
          color: '#059669',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          padding: '2px 8px',
          borderRadius: '12px',
          fontWeight: 'bold'
        }}>
          <span style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 6px #10b981',
            animation: 'pulse-green 2s ease-in-out infinite'
          }}></span>
          リアルタイム
        </div>
      </div>

      {/* 📑 タブ切り替え（つぶやき / 速報 / すべて） */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '12px',
        padding: '3px',
        background: '#f1f5f9',
        borderRadius: '10px'
      }}>
        <button
          type="button"
          onClick={() => setTimelineTab('chat')}
          style={{
            flex: 1,
            padding: '6px 4px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: timelineTab === 'chat' ? '800' : '600',
            background: timelineTab === 'chat' ? '#ffffff' : 'transparent',
            color: timelineTab === 'chat' ? '#1e293b' : '#64748b',
            boxShadow: timelineTab === 'chat' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <span>💬 つぶやき</span>
          {chatCount > 0 && (
            <span style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: '8px',
              background: timelineTab === 'chat' ? '#e2e8f0' : '#e2e8f0',
              color: '#475569'
            }}>{chatCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTimelineTab('news')}
          style={{
            flex: 1,
            padding: '6px 4px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: timelineTab === 'news' ? '800' : '600',
            background: timelineTab === 'news' ? '#ffffff' : 'transparent',
            color: timelineTab === 'news' ? '#b45309' : '#64748b',
            boxShadow: timelineTab === 'news' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}
        >
          <span>🎰 速報</span>
          {newsCount > 0 && (
            <span style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: '8px',
              background: timelineTab === 'news' ? '#fef3c7' : '#e2e8f0',
              color: timelineTab === 'news' ? '#b45309' : '#475569'
            }}>{newsCount}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTimelineTab('all')}
          style={{
            padding: '6px 10px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: timelineTab === 'all' ? '800' : '600',
            background: timelineTab === 'all' ? '#ffffff' : 'transparent',
            color: timelineTab === 'all' ? '#1e293b' : '#64748b',
            boxShadow: timelineTab === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          すべて
        </button>
      </div>

      {/* 📜 タイムライン一覧 */}
      <div ref={scrollRef} style={{
        maxHeight: '300px',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 16px',
        boxSizing: 'border-box',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        scrollbarWidth: 'thin'
      }}>
        {isRabiTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #fdf4ff 0%, #fff1f2 100%)',
            border: '1px dashed #f472b6',
            fontSize: '0.76rem',
            color: '#be185d',
            fontWeight: 'bold',
            animation: 'fadeInUp 0.2s ease-out'
          }}>
            <img
              src="/favicon-144x144.png"
              alt="らびたん"
              style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #f472b6', background: '#fff' }}
            />
            <span>らびたんがお返事を書いています…✏️🐰</span>
          </div>
        )}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
            読み込み中…🐰
          </div>
        ) : displayedPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
            {timelineTab === 'news'
              ? 'まだ速報はないらび…🎰\nガチャやパトロールでURを狙ってみてね！'
              : 'まだつぶやきがないらび…🥕\n最初の一言を残してみてね！'}
          </div>
        ) : displayedPosts.map(p => {
          const isNews = typeof p.content === 'string' && (p.content.startsWith('【ガチャ速報】') || p.content.startsWith('【ドロップ速報】'));
          const isOfficialPost = Boolean(p.is_official || p.name === 'らび🐰' || p.name === '守護霊らび');
          return (
            <div key={p.id} style={{
              display: 'flex',
              gap: '10px',
              padding: '12px 16px',
              boxSizing: 'border-box',
              width: '100%',
              borderRadius: '14px',
              animation: 'fadeInUp 0.25s ease-out',
              flexShrink: 0,
              height: 'auto',
              minHeight: 'fit-content',
              ...(isOfficialPost
                ? officialCardStyle
                : isNews
                  ? newsCardStyle
                  : {
                    background: '#ffffff',
                    border: '1px solid #edf2f7',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }
              )
            }}>
              {/* アバター */}
              {isOfficialPost ? (
                <img
                  src="/favicon-144x144.png"
                  alt="らびたん"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '2px solid #f472b6',
                    objectFit: 'cover',
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(236, 72, 153, 0.22)',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                  ...(isNews
                    ? newsAvatarStyle
                    : { background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }
                  )
                }}>
                  {p.avatar}
                </div>
              )}

              {/* 本文エリア */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  {isOfficialPost ? (
                    <span style={officialNameStyle}>{p.name}</span>
                  ) : isNews ? (
                    <span style={newsNameStyle}>{p.name}</span>
                  ) : (
                    <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' }}>{p.name}</span>
                  )}
                  {isOfficialPost && (
                    <span style={{
                      fontSize: '0.65rem',
                      background: 'linear-gradient(90deg, #7c3aed, #2563eb)',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      letterSpacing: '0.02em',
                      flexShrink: 0
                    }}>✦ 公式</span>
                  )}
                  {isNews && (
                    <span style={{
                      fontSize: '0.65rem',
                      background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      letterSpacing: '0.02em',
                      flexShrink: 0,
                      boxShadow: '0 1px 4px rgba(217, 119, 6, 0.3)'
                    }}>✦ 速報</span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>・{timeAgo(p.created_at)}</span>
                </div>
                {renderTimelineContent(p.content)}
                {/* いいねボタン */}
                <button
                  type="button"
                  onClick={() => handleLike(p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: likedIds.has(p.id) ? 'default' : 'pointer',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: likedIds.has(p.id) ? '#e11d48' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{likedIds.has(p.id) ? '❤️' : '🤍'}</span>
                  <span>{p.likes || 0}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ✍️ 投稿フォーム */}
      <form onSubmit={handlePost} style={{
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1.5px solid #f1f5f9',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%', maxWidth: '100%'
      }}>
        {/* ✨ ワンタップひとこと定型ボタン */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '8px'
        }}>
          {QUICK_CHAT_PHRASES.map(phrase => (
            <button
              key={phrase}
              type="button"
              onClick={() => setInputText(phrase)}
              style={{
                background: inputText === phrase ? '#ede9fe' : '#f8fafc',
                border: inputText === phrase ? '1px solid #a78bfa' : '1px solid #e2e8f0',
                color: inputText === phrase ? '#5b21b6' : '#475569',
                borderRadius: '999px',
                padding: '3px 8px',
                fontSize: '0.68rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {phrase}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', width: '100%', boxSizing: 'border-box' }}>
          <select
            value={selectedAvatar}
            onChange={e => setSelectedAvatar(e.target.value)}
            style={{
              padding: '4px 6px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '1rem',
              background: '#fff',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="アイコンを選ぶ"
          >
            {AVATARS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <input
            className="text-[16px] md:text-[0.8rem]"
            type="text"
            placeholder="お名前（省略可）"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={12}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              background: '#fff',
              minWidth: 0,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
          <input
            className="text-[16px] md:text-[0.85rem]"
            type="text"
            placeholder="いまどうしてる？（50字まで）"
            value={inputText}
            onChange={e => setInputText(e.target.value.slice(0, 50))}
            style={{
              flex: '1 1 0%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              outline: 'none',
              background: '#fff',
              minWidth: 0,
              boxSizing: 'border-box',
              width: '100%'
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isPosting}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: inputText.trim() && !isPosting
                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                : '#cbd5e1',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              cursor: inputText.trim() && !isPosting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}
          >
            {isPosting ? '⏳' : '送信 🕊️'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', gap: '6px' }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.72rem',
            fontWeight: '800',
            color: rabiReplyEnabled ? '#be185d' : '#64748b',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={rabiReplyEnabled}
              onChange={e => setRabiReplyEnabled(e.target.checked)}
              style={{ accentColor: '#ec4899', cursor: 'pointer' }}
            />
            <span>🐰 らびたんにもお返事してもらう✨</span>
          </label>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {inputText.length}/50
          </span>
        </div>
      </form>
    </div>
  );
};

export default SquareTimeline;
