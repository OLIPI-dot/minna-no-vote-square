import React, { useState } from 'react';
import CategoryEyecatch from './CategoryEyecatch';

const RecommendedSection = ({ surveys, navigateTo, layout = 'scroll' }) => {
  const [brokenImages, setBrokenImages] = useState(new Set());
  if (!surveys || surveys.length === 0) return null;

  return (
    <div className="recommended-section" style={{
      marginBottom: '40px',
      padding: '24px',
      background: 'linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%)',
      borderRadius: '28px',
      border: '1px solid #f0e7ff',
      animation: 'fadeInRecommend 0.8s ease'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '1.6rem' }}>🐰</span>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#4c1d95', margin: 0 }}>
          あなたにぴったりかも <span style={{ fontSize: '0.8rem', fontWeight: 'normal', opacity: 0.7, marginLeft: '8px', whiteSpace: 'nowrap' }}>おすすめ</span>
        </h2>
      </div>

      <div className={layout === 'grid' ? "recommended-grid-container" : "recommended-scroll-container"} style={{
        display: layout === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'none',
        overflowX: layout === 'grid' ? 'visible' : 'auto',
        gap: '12px',
        paddingBottom: '16px',
        WebkitOverflowScrolling: layout === 'grid' ? 'auto' : 'touch',
        scrollSnapType: layout === 'grid' ? 'none' : 'x proximity'
      }}>
        {surveys.map(s => {
          let thumb = null;
          if (s.image_url) {
            const parts = s.image_url.split(',')[0].trim();
            if (parts.startsWith('yt:')) thumb = `https://img.youtube.com/vi/${parts.substring(3)}/mqdefault.jpg`;
            else if (!parts.startsWith('nico:')) thumb = parts;
          }

          // 💬 ガヤ（コメント）タグを探す
          const commentTag = s.tags?.find(t => String(t).startsWith('comment:'));
          const pickupComment = commentTag ? commentTag.replace('comment:', '') : null;

          return (
            <div 
              key={s.id} 
              className="rec-card" 
              onClick={() => navigateTo('details', s)}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: layout === 'grid' ? 'auto' : '200px',
                flex: layout === 'grid' ? 'auto' : '0 0 200px',
                scrollSnapAlign: layout === 'grid' ? 'none' : 'start',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
              }}
            >
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                {!thumb || brokenImages.has(s.id) ? (
                  <CategoryEyecatch category={s.category} />
                ) : (
                  <img 
                    src={thumb} 
                    alt="" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#f9fafb', position: 'relative', zIndex: 2 }} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      setBrokenImages(prev => new Set([...prev, s.id]));
                    }}
                  />
                )}
                
                {/* 💬 ガヤ吹き出しオーバーレイ */}
                {pickupComment && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    zIndex: 3,
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    maxWidth: '85%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    💬 {pickupComment}
                  </div>
                )}
              </div>
              <div>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.88rem', 
                  lineHeight: '1.4',
                  height: '2.8em',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  color: '#1e293b'
                }}>
                  {s.title}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>🗳️ {s.total_votes || 0}票</span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    color: '#8b5cf6', 
                    fontWeight: '800', 
                    background: '#f3e8ff', 
                    padding: '2px 6px', 
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '60px'
                  }}>{s.category}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .recommended-scroll-container::-webkit-scrollbar { height: 14px; }
        .recommended-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .recommended-scroll-container::-webkit-scrollbar-thumb { 
          background: #cbd5e1; 
          border-radius: 10px; 
          border: 2px solid #f1f5f9;
          transition: all 0.3s;
        }
        .recommended-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .rec-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 24px rgba(139, 92, 246, 0.15);
          border-color: #8b5cf6;
        }
        @keyframes fadeInRecommend {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RecommendedSection;
