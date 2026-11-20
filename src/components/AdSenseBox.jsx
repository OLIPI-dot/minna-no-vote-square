import React, { useState, useEffect } from 'react';

const MOSHIMO_RAKUTEN_A_ID = '5913984';
const MOSHIMO_RAKUTEN_P_ID = '54';
const MOSHIMO_RAKUTEN_PC_ID = '54';
const MOSHIMO_RAKUTEN_DOKODEMO_PL_ID = '616';
const MOSHIMO_RAKUTEN_TEXT_PL_ID = '621';

const buildMoshimoRakutenSearchUrl = (keyword) => {
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
  return `https://af.moshimo.com/af/c/click?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${MOSHIMO_RAKUTEN_DOKODEMO_PL_ID}&url=${encodeURIComponent(targetUrl)}`;
};

const MOSHIMO_RAKUTEN_TOP_URL = `https://af.moshimo.com/af/c/click?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${MOSHIMO_RAKUTEN_TEXT_PL_ID}`;

const AdSenseBox = ({ slot, format = 'auto', affiliateType = null, tags = [], title = '', category = '' }) => {
  const [isAnimateHeart, setIsAnimateHeart] = useState(false);

  // 🏷️ 記事のタグから楽天市場で検索しやすいキーワードを抽出するらび！
  const cleanTags = (Array.isArray(tags) ? tags : [])
    .map(t => String(t || '').trim())
    .filter(t => t && !t.startsWith('_STAMP:') && !t.startsWith('comment:'))
    .map(t => (t.startsWith('[L]') ? t.substring(3).trim() : t))
    .filter(t => t.length >= 2 && t.length <= 16);

  const primaryKeyword = cleanTags[0] || '';
  const extraKeywords = cleanTags.slice(1, 3);
  const isSidebar = String(slot || '').includes('sidebar');

  const handleSupport = () => {
    setIsAnimateHeart(true);
    setTimeout(() => setIsAnimateHeart(false), 600);
    window.open('https://ofuse.me/olipi', '_blank');
  };
  
  useEffect(() => {
    // 🚀 TBT大幅改善: AdSense読み込みを 3000ms 遅延させて初期表示のJSブロックを回避するらび！
    const timerId = setTimeout(() => {
      const initAd = () => {
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
      };
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        initAd(); 
      } else if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
        const script = document.createElement('script');
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9429738476925701";
        script.async = true; script.crossOrigin = "anonymous";
        script.onload = initAd;
        document.head.appendChild(script);
      } else {
        initAd();
      }
    }, 3000);

    return () => clearTimeout(timerId);
  }, []);

  const impressionPlId = primaryKeyword ? MOSHIMO_RAKUTEN_DOKODEMO_PL_ID : MOSHIMO_RAKUTEN_TEXT_PL_ID;
  const impressionUrl = `https://i.moshimo.com/af/i/impression?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${impressionPlId}`;

  return (
    <div className="rabi-recommend-wrapper" style={{ width: '100%' }}>
      <div className="rabi-recommend-card" style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 52%, #faf5ff 100%)',
        border: '2px solid #fbcfe8',
        borderRadius: '22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSidebar ? '18px 14px' : '22px 20px',
        color: '#475569',
        fontSize: '0.9rem',
        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.08)',
        width: '100%',
        boxSizing: 'border-box',
        textAlign: 'center',
        transition: 'all 0.25s ease'
      }}>
        {affiliateType === 'ofuse' ? (
          <div className="affiliate-content" style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💖</div>
            <div style={{ fontWeight: 'bold', color: '#db2777' }}>らび＆おりぴを応援！</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>いつも広場を使ってくれてありがとう！<br />100円から応援できるらび🥕</div>
            <button 
              className="support-heart-btn" 
              onClick={handleSupport}
              aria-label="このアンケートを応援する"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
                WebkitTapHighlightColor: 'transparent',
                marginTop: '12px'
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.8)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div 
                className={`support-heart-icon ${isAnimateHeart ? 'pop' : ''}`}
                style={{ fontSize: '1.8rem', color: '#ff4b5c', filter: 'drop-shadow(0 2px 4px rgba(255,75,92,0.2))' }}
              >
                ❤️
              </div>
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '560px' }}>
            <span style={{
              position: 'absolute',
              top: isSidebar ? '-8px' : '-10px',
              right: isSidebar ? '-4px' : '-6px',
              fontSize: '0.68rem',
              fontWeight: '800',
              color: '#9d174d',
              background: '#fce7f3',
              border: '1px solid #f9a8d4',
              borderRadius: '999px',
              padding: '1px 8px',
              letterSpacing: '0.04em'
            }}>
              PR
            </span>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: isSidebar ? '0.82rem' : '0.92rem',
              fontWeight: '900',
              color: '#be185d',
              marginBottom: '6px'
            }}>
              <span>🛍️</span>
              <span>
                {primaryKeyword
                  ? `「${primaryKeyword}」の関連グッズ・本をチェック！`
                  : '話題のグッズ・ゲーム・本を楽天市場でチェック！'}
              </span>
            </div>

            <p style={{
              margin: '0 0 14px 0',
              fontSize: isSidebar ? '0.76rem' : '0.83rem',
              color: '#64748b',
              lineHeight: '1.55',
              fontWeight: '600'
            }}>
              {primaryKeyword
                ? `いま話題の「${primaryKeyword}」関連アイテムを楽天市場で探せるよ🐰🥕`
                : 'トレンドの推しグッズや新作ゲーム・コミックを楽天市場でのぞいてみようらび🐰🥕'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <a
                href={primaryKeyword ? buildMoshimoRakutenSearchUrl(primaryKeyword) : MOSHIMO_RAKUTEN_TOP_URL}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                referrerPolicy="no-referrer-when-downgrade"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: isSidebar ? '9px 16px' : '11px 24px',
                  background: 'linear-gradient(135deg, #e11d48, #ec4899)',
                  color: '#ffffff',
                  borderWidth: '1.5px 1.5px 4px 1.5px',
                  borderStyle: 'solid',
                  borderColor: '#f43f5e #f43f5e #9f1239 #f43f5e',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  fontWeight: '900',
                  fontSize: isSidebar ? '0.82rem' : '0.92rem',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.24)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 7px 18px rgba(225, 29, 72, 0.32)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(225, 29, 72, 0.24)';
                }}
              >
                <span>🛒</span>
                <span>{primaryKeyword ? `楽天市場で「${primaryKeyword}」を探す ✨` : '楽天市場で人気アイテムを見る ✨'}</span>
              </a>

              {!isSidebar && extraKeywords.map((kw, i) => (
                <a
                  key={i}
                  href={buildMoshimoRakutenSearchUrl(kw)}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
                    color: '#6d28d9',
                    borderWidth: '1.5px 1.5px 3px 1.5px',
                    borderStyle: 'solid',
                    borderColor: '#ddd6fe #ddd6fe #a78bfa #ddd6fe',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    transition: 'transform 0.18s ease'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  🔍 #{kw}
                </a>
              ))}
            </div>

            <img
              src={impressionUrl}
              width="1"
              height="1"
              alt=""
              style={{ border: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSenseBox;
