import React, { useState } from 'react';

// 🌟 初期表示用の温かいサンプルつぶやき
const INITIAL_POSTS = [
  {
    id: 1,
    name: 'らび🐰',
    handle: 'rabi_square',
    avatar: '🐰',
    time: 'たった今',
    content: '広場へようこそらび〜！みんなの投票コメント、毎日楽しく読んでるらび！🥕✨',
    likes: 5,
    isLiked: false
  },
  {
    id: 2,
    name: '旅のゲーマー',
    handle: 'retro_fan',
    avatar: '🎮',
    time: '5分前',
    content: 'レトロゲームのUSB-C変換コード、さっそく投票してきた！便利そう〜',
    likes: 3,
    isLiked: false
  },
  {
    id: 3,
    name: 'のんびり猫',
    handle: 'cat_lover',
    avatar: '🐱',
    time: '18分前',
    content: '今日もおつかれさまです☕ のんびりアンケート巡り中…！',
    likes: 7,
    isLiked: false
  }
];

const AVATARS = ['🐰', '🐱', '🐶', '🐥', '🦊', '🐼', '🎮', '☕'];

const SquareTimeline = () => {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [inputText, setInputText] = useState('');
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🐰');
  const [isPosting, setIsPosting] = useState(false);

  // 💖 いいねを押す
  const handleLike = (id) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          isLiked: !p.isLiked
        };
      }
      return p;
    }));
  };

  // 🚀 つぶやきを投稿する
  const handlePost = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsPosting(true);
    const newPost = {
      id: Date.now(),
      name: name.trim() || '名無しの広場民',
      handle: 'square_user',
      avatar: selectedAvatar,
      time: 'たった今',
      content: inputText.trim(),
      likes: 0,
      isLiked: false
    };

    setTimeout(() => {
      setPosts(prev => [newPost, ...prev]);
      setInputText('');
      setIsPosting(false);
    }, 200);
  };

  return (
    <div className="sidebar-section-card timeline-card" style={{
      marginBottom: '24px',
      border: '1px solid #e2e8f0',
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      position: 'relative',
      overflow: 'hidden'
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
            boxShadow: '0 0 6px #10b981'
          }}></span>
          リアルタイム
        </div>
      </div>

      {/* 📜 タイムライン一覧（スクロールエリア） */}
      <div style={{
        maxHeight: '280px',
        overflowY: 'auto',
        paddingRight: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        scrollbarWidth: 'thin'
      }}>
        {posts.map(p => (
          <div key={p.id} style={{
            display: 'flex',
            gap: '10px',
            padding: '10px 12px',
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #edf2f7',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}>
            {/* アバター */}
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0
            }}>
              {p.avatar}
            </div>

            {/* 本文エリア */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#1e293b' }}>{p.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>・{p.time}</span>
              </div>
              <p style={{
                margin: '0 0 6px 0',
                fontSize: '0.85rem',
                lineHeight: '1.45',
                color: '#334155',
                wordBreak: 'break-word'
              }}>
                {p.content}
              </p>

              {/* リアクション */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleLike(p.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    color: p.isLiked ? '#e11d48' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff1f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <span>{p.isLiked ? '❤️' : '🤍'}</span>
                  <span>{p.likes}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✍️ つぶやき投稿フォーム */}
      <form onSubmit={handlePost} style={{
        marginTop: '14px',
        paddingTop: '12px',
        borderTop: '1.5px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
          {/* アバター選択 */}
          <select
            value={selectedAvatar}
            onChange={e => setSelectedAvatar(e.target.value)}
            style={{
              padding: '4px 6px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '1rem',
              background: '#ffffff',
              cursor: 'pointer'
            }}
            title="アイコンを選ぶ"
          >
            {AVATARS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* お名前入力 */}
          <input
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
              fontSize: '0.8rem',
              outline: 'none',
              background: '#ffffff'
            }}
          />
        </div>

        {/* ひとこと入力欄 */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="いまどうしてる？（50字まで）"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            maxLength={50}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
              background: '#ffffff'
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isPosting}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: 'none',
              background: inputText.trim() ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#cbd5e1',
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>送信</span>
            <span>🕊️</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SquareTimeline;
