import React from 'react';
import AnimatedCounter from './AnimatedCounter';

const scrollToSurveys = () => {
  const el = document.getElementById('survey-list-header-anchor') || document.querySelector('.search-container');
  if (el) {
    const y = el.getBoundingClientRect().top + window.pageYOffset - 16;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
};

const SiteConceptSection = ({ user, totalVotes = 0, onLogin }) => (
  <div className="site-concept-card" style={{
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    borderRadius: '28px',
    padding: '32px 24px',
    marginBottom: '32px',
    border: 'none',
    boxShadow: '0 20px 50px rgba(99, 102, 241, 0.2)',
    textAlign: 'center',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '12px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        3秒で本音が言える、<br />みんなの意見がすぐ分かる！ 🚀
      </h2>
      <p style={{ fontSize: '1.08rem', opacity: 0.96, marginBottom: '20px', lineHeight: '1.6' }}>
        気になる話題に<strong>ログイン不要・1タップ</strong>で匿名投票！<br />
        {totalVotes > 0 && (
          <span
            onClick={scrollToSurveys}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && scrollToSurveys()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '12px',
              padding: '6px 18px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.38)',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, background 0.2s ease'
            }}
          >
            <span className="vote-badge-fire">🔥</span> 現在
            <span key={totalVotes} className="vote-badge-pop">
              <span className="vote-badge-number" style={{ fontSize: '1.3rem', fontWeight: '900', lineHeight: 1 }}>
                <AnimatedCounter value={totalVotes} />
              </span>
            </span>
            件の投票が集まっています！
          </span>
        )}
      </p>

      {/* 👇 下の記事一覧へスーッとスクロールするメイン導線ボタン */}
      <div style={{ marginBottom: !user ? '22px' : '8px' }}>
        <button
          type="button"
          onClick={scrollToSurveys}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, #fde047 0%, #f59e0b 100%)',
            color: '#78350f',
            padding: '14px 32px',
            borderRadius: '999px',
            fontWeight: '900',
            fontSize: '1.08rem',
            border: '2px solid #ffffff',
            boxShadow: '0 10px 25px rgba(245, 158, 11, 0.38)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            animation: 'scrollBtnFloat 2.2s ease-in-out infinite'
          }}
        >
          <span>👇 今すぐアンケートを見て投票する</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(120, 53, 15, 0.14)',
            fontSize: '0.95rem',
            fontWeight: '900'
          }}>↓</span>
        </button>
        <style>{`
          @keyframes scrollBtnFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(4px); }
          }
        `}</style>
      </div>
      
      {!user && (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '0.92rem' }}>✨ 自分でアンケートを作りたい・マイページを使う方はこちら</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0', fontSize: '0.84rem', display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', opacity: 0.92 }}>
            <li>✅ 面白いアンケートを作れる</li>
            <li>✅ みんクエ（RPG・ガチャ）で遊べる</li>
          </ul>
          <button onClick={onLogin} className="premium-login-btn" style={{
            background: '#fff', color: '#6366f1', padding: '10px 26px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.96rem', border: 'none', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', cursor: 'pointer'
          }}>
            Googleでログインして参加 🐰💎
          </button>
        </div>
      )}
      
      {user && (
        <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          💡 気になる話題を見つけたら、どんどん投票してみようらびっ！
        </div>
      )}
    </div>
  </div>
);

export default SiteConceptSection;
