import React from 'react';
import AnimatedCounter from './AnimatedCounter';

const SiteConceptSection = ({ user, totalVotes = 0, onLogin }) => (
  <div className="site-concept-card" style={{
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    borderRadius: '28px',
    padding: '36px',
    marginBottom: '32px',
    border: 'none',
    boxShadow: '0 20px 50px rgba(99, 102, 241, 0.2)',
    textAlign: 'center',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden'
  }}>
    <div style={{ position: 'relative', zIndex: 1 }}>
      <h2 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '16px', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        3秒で本音が言える、<br />みんなの意見がすぐ分かる！ 🚀
      </h2>
      <p style={{ fontSize: '1.1rem', opacity: 0.95, marginBottom: '28px', lineHeight: '1.6' }}>
        気になる話題に1タップで投票。匿名だから安心。<br />
        {totalVotes > 0 && <span style={{ fontWeight: 'bold', borderBottom: '2px solid #fff' }}>現在 <AnimatedCounter value={totalVotes} /> 件の投票が集まっています！🔥</span>}
      </p>
      
      {!user && (
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '12px' }}>✨ ログインして今すぐ参加らび！</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <li>✅ 投票後すぐ結果が見れる</li>
            <li>✅ 自分の意見をコメントできる</li>
            <li>✅ 面白いアンケートを作れる</li>
          </ul>
          <button onClick={onLogin} className="premium-login-btn" style={{
            background: '#fff', color: '#6366f1', padding: '12px 32px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', cursor: 'pointer'
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
