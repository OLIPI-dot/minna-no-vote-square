import React from 'react';

const RiddleSquareView = ({
  surveys,
  isLoading,
  navigateTo,
  formatWithDay,
  CATEGORY_ICON_STYLE,
  user
}) => {
  return (
    <div className="riddle-square-container" style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      minHeight: '100vh',
      borderRadius: '32px'
    }}>
      {/* 🔮 ヘッダーエリア */}
      <div className="riddle-header" style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '40px 20px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 20px 40px rgba(124, 58, 237, 0.1)'
      }}>
        <h2 style={{
          fontSize: '2.4rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #7c3aed, #db2777)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '15px'
        }}>
          🧩 なぞなぞ ＆ クイズ広場 ❓
        </h2>
        <p style={{ color: '#6d28d9', fontSize: '1.1rem', fontWeight: 'bold' }}>
          頭を柔らかくして挑戦！らびと一緒に謎解きを楽しもう！🐰🥕
        </p>
      </div>

      {/* 📋 リストエリア */}
      <div className="riddle-list" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px', gridColumn: '1 / -1' }}>
            <p style={{ color: '#7c3aed', fontWeight: 'bold' }}>魔法でデータを集めてるよ...🐰✨</p>
          </div>
        ) : (
          surveys.map(s => {
            const catStyle = CATEGORY_ICON_STYLE[s.category] || CATEGORY_ICON_STYLE['その他'];
            const isEnded = s.deadline && new Date(s.deadline) < new Date();
            
            // サムネイルの決定
            let thumb = s.category === 'なぞなぞ' ? '/nazo_category_thumb_1775995526516.png' : '/quiz_category_thumb_1775995582680.png';
            if (s.image_url && !s.image_url.startsWith('yt:') && !s.image_url.startsWith('nico:')) {
              thumb = s.image_url.split(',')[0].trim();
            }

            return (
              <div 
                key={s.id}
                className="riddle-card"
                onClick={() => navigateTo('details', s)}
                style={{
                  background: 'white',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  boxShadow: '0 10px 25px rgba(124, 58, 237, 0.08)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.borderColor = '#7c3aed88';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.15)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(124, 58, 237, 0.08)';
                }}
              >
                {/* サムネイル部分 */}
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img src={thumb} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', top: '15px', right: '15px',
                    padding: '6px 14px', borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    color: catStyle.color, fontWeight: 'bold', fontSize: '0.85rem',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}>
                    <span>{catStyle.icon}</span>
                    <span>{s.category}</span>
                  </div>
                  {isEnded && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.2rem'
                    }}>
                      終了済み扉 🗝️
                    </div>
                  )}
                </div>

                {/* コンテンツ部分 */}
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontSize: '1.25rem', fontWeight: '900', color: '#1e293b',
                    marginBottom: '12px', lineHeight: '1.4'
                  }}>
                    {s.title}
                  </h3>
                  <div style={{ 
                    fontSize: '0.9rem', color: '#64748b', 
                    flex: 1, marginBottom: '20px',
                    display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {s.description || 'どんな問題かな？詳細をチェック！'}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid #f1f5f9', paddingTop: '15px'
                  }}>
                    <div style={{ display: 'flex', gap: '15px', color: '#94a3b8', fontSize: '0.85rem' }}>
                      <span>🗳️ {s.total_votes || 0} 票</span>
                      <span>💬 {s.comment_count || 0}</span>
                    </div>
                    <span style={{ 
                      fontSize: '0.8rem', color: '#7c3aed', fontWeight: 'bold',
                      background: '#f5f3ff', padding: '4px 10px', borderRadius: '8px'
                    }}>
                      {formatWithDay(s.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🏜️ 空っぽメッセージ */}
      {!isLoading && surveys.length === 0 && (
        <div style={{ textAlign: 'center', padding: '100px', opacity: 0.6 }}>
          <span style={{ fontSize: '4rem' }}>🏜️</span>
          <p style={{ marginTop: '20px', fontWeight: 'bold' }}>まだなぞなぞがないみたい...。おりぴさん、作っちゃう？🐰🥕</p>
        </div>
      )}
    </div>
  );
};

export default RiddleSquareView;
