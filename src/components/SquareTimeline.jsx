import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const AVATARS = ['🐰', '🐱', '🐶', '🐥', '🦊', '🐼', '🎮', '☕', '🌸', '✨'];

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
  const [posts, setPosts] = useState([]);
  const [inputText, setInputText] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐰');
  const [isPosting, setIsPosting] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [lastPostTime, setLastPostTime] = useState(0); // スパム防止
  const scrollRef = useRef(null);

  // 🔄 初回データ取得
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('timeline_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data) {
        setPosts(data);
      }
      setIsLoading(false);
    };

    fetchPosts();

    // ⚡ Supabase Realtime 購読 - 誰かが投稿したら即座に全員の画面に届く！
    const channel = supabase
      .channel('timeline_posts_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'timeline_posts' },
        (payload) => {
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
      supabase.removeChannel(channel);
    };
  }, []);

  // 🚀 投稿する
  const handlePost = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // スパム防止: 30秒に1回まで
    const now = Date.now();
    if (now - lastPostTime < 30000) {
      alert('少し待ってからもう一度つぶやいてね！🐰（30秒に1回まで）');
      return;
    }

    setIsPosting(true);
    const { error } = await supabase
      .from('timeline_posts')
      .insert([{
        name: name.trim() || '名無しの広場民',
        avatar: selectedAvatar,
        content: inputText.trim()
      }]);

    if (error) {
      console.error('Post error:', error);
      alert('投稿に失敗しました。もう一度試してみてね！');
    } else {
      setInputText('');
      setLastPostTime(now);
    }
    setIsPosting(false);
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

  // 💖 いいねを押す
  const handleLike = async (post) => {
    if (likedIds.has(post.id)) return; // 重複いいね防止

    const newLikes = (post.likes || 0) + 1;
    setLikedIds(prev => new Set([...prev, post.id]));
    // 楽観的更新（UIをすぐ変える）
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));

    await supabase
      .from('timeline_posts')
      .update({ likes: newLikes })
      .eq('id', post.id);
  };

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
        marginBottom: '14px',
        paddingBottom: '10px',
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
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
            読み込み中…🐰
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.85rem' }}>
            まだつぶやきがないらび…🥕<br />最初の一言を残してみてね！
          </div>
        ) : posts.map(p => (
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
            ...(p.is_official
              ? officialCardStyle
              : {
                  background: '#ffffff',
                  border: '1px solid #edf2f7',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }
            )
          }}>
            {/* アバター */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
              ...(p.is_official
                ? officialAvatarStyle
                : { background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }
              )
            }}>
              {p.avatar}
            </div>

            {/* 本文エリア */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                {p.is_official ? (
                  <span style={officialNameStyle}>{p.name}</span>
                ) : (
                  <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' }}>{p.name}</span>
                )}
                {p.is_official && (
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
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>・{timeAgo(p.created_at)}</span>
              </div>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                color: '#334155',
                wordBreak: 'break-word'
              }}>
                {p.content}
              </p>
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
        ))}
      </div>

      {/* ✍️ 投稿フォーム */}
      <form onSubmit={handlePost} style={{
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1.5px solid #f1f5f9',
        overflow: 'hidden',
        boxSizing: 'border-box',
        width: '100%', maxWidth: '100%' }}>
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
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px', textAlign: 'right' }}>
          {inputText.length}/50
        </div>
      </form>
    </div>
  );
};

export default SquareTimeline;
