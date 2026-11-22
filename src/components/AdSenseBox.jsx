import React, { useState, useEffect } from 'react';

const MOSHIMO_RAKUTEN_A_ID = '5913984';
const MOSHIMO_RAKUTEN_P_ID = '54';
const MOSHIMO_RAKUTEN_PC_ID = '54';
const MOSHIMO_RAKUTEN_DOKODEMO_PL_ID = '616';
const MOSHIMO_RAKUTEN_TEXT_PL_ID = '621';
const MOSHIMO_RAKUTEN_EASYLINK_PL_ID = '27059';

const buildMoshimoRakutenSearchUrl = (keyword) => {
  const targetUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
  return `https://af.moshimo.com/af/c/click?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${MOSHIMO_RAKUTEN_DOKODEMO_PL_ID}&url=${encodeURIComponent(targetUrl)}`;
};

const buildMoshimoRakutenItemUrl = (targetUrl) => {
  return `https://af.moshimo.com/af/c/click?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${MOSHIMO_RAKUTEN_EASYLINK_PL_ID}&url=${encodeURIComponent(targetUrl)}`;
};

// 🎁 かんたんリンク公式データ（増やすだけで自動でランダム表示されるらび！）
const FEATURED_RAKUTEN_ITEMS = [
  {
    id: 'PY9l2',
    title: '【送料無料】フルタ製菓 チョコエッグ キッズプラス にじさんじ第2弾 10個入BOX',
    shortLabel: 'にじさんじ食玩',
    badge: '送料無料',
    imageUrl: 'https://thumbnail.image.rakuten.co.jp/@0_mall/dagasi/cabinet/09212374/12334395/imgrc0142652827.jpg',
    targetUrl: 'https://item.rakuten.co.jp/dagasi/sm-4902501270240/',
    rabiNote: 'にじさんじ第2弾のチョコエッグ10個BOX！送料無料でまとめ買いできるから、推しが出るかワクワクしながら開けられるらび ▸',
    tags: ['にじさんじ', 'チョコエッグ']
  }
];

const MOSHIMO_RAKUTEN_TOP_URL = `https://af.moshimo.com/af/c/click?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${MOSHIMO_RAKUTEN_TEXT_PL_ID}`;

const AdSenseBox = ({ slot, format = 'auto', affiliateType = null, tags = [], title = '', category = '' }) => {
  const [isAnimateHeart, setIsAnimateHeart] = useState(false);
  const [featuredItem] = useState(() => {
    const idx = Math.floor(Math.random() * FEATURED_RAKUTEN_ITEMS.length);
    return FEATURED_RAKUTEN_ITEMS[idx];
  });

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

  const useFeaturedProduct = Boolean(featuredItem) && (isSidebar || !primaryKeyword);
  const impressionPlId = useFeaturedProduct
    ? MOSHIMO_RAKUTEN_EASYLINK_PL_ID
    : (primaryKeyword ? MOSHIMO_RAKUTEN_DOKODEMO_PL_ID : MOSHIMO_RAKUTEN_TEXT_PL_ID);
  const impressionUrl = `https://i.moshimo.com/af/i/impression?a_id=${MOSHIMO_RAKUTEN_A_ID}&p_id=${MOSHIMO_RAKUTEN_P_ID}&pc_id=${MOSHIMO_RAKUTEN_PC_ID}&pl_id=${impressionPlId}`;

  return (
    <div className="rabi-recommend-wrapper" style={{ width: '100%' }}>
      <div className="rabi-recommend-card" style={{
        position: 'relative',
        background: isSidebar
          ? 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 52%, #faf5ff 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #fffbeb 52%, #fdf2f8 100%)',
        border: isSidebar ? '2px solid #fbcfe8' : '2px solid #fcd34d',
        borderRadius: '22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSidebar ? '28px 14px 18px 14px' : '16px 16px',
        color: '#475569',
        fontSize: '0.9rem',
        boxShadow: isSidebar
          ? '0 8px 24px rgba(236, 72, 153, 0.08)'
          : '0 8px 24px rgba(245, 158, 11, 0.10)',
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
        ) : isSidebar ? (
          <>
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              fontSize: '0.66rem',
              fontWeight: '800',
              color: '#9d174d',
              background: '#fce7f3',
              border: '1px solid #f9a8d4',
              borderRadius: '999px',
              padding: '1px 8px',
              letterSpacing: '0.04em',
              zIndex: 11
            }}>
              PR
            </span>
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '560px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: '900',
                color: '#be185d',
                marginBottom: '10px'
              }}>
                <span>🛍️</span>
                <span>らびたん注目アイテム！</span>
              </div>

              {featuredItem && (
                <a
                  href={buildMoshimoRakutenItemUrl(featuredItem.targetUrl)}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{
                    display: 'block',
                    width: '100%',
                    background: '#ffffff',
                    borderRadius: '14px',
                    border: '1.5px solid #fbcfe8',
                    padding: '10px',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.08)'
                  }}
                >
                  <img
                    src={featuredItem.imageUrl}
                    alt={featuredItem.title}
                    loading="lazy"
                    style={{
                      width: '100%',
                      maxHeight: '140px',
                      objectFit: 'contain',
                      display: 'block',
                      margin: '0 auto',
                      borderRadius: '8px'
                    }}
                  />
                </a>
              )}

              <p style={{
                margin: '0 0 12px 0',
                fontSize: '0.78rem',
                color: '#334155',
                lineHeight: '1.5',
                fontWeight: '800'
              }}>
                {featuredItem ? featuredItem.title : 'トレンドの推しグッズや新作ゲーム・コミックを楽天市場でのぞいてみようらび🐰🥕'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <a
                  href={featuredItem ? buildMoshimoRakutenItemUrl(featuredItem.targetUrl) : MOSHIMO_RAKUTEN_TOP_URL}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    background: 'linear-gradient(135deg, #e11d48, #ec4899)',
                    color: '#ffffff',
                    borderWidth: '1.5px 1.5px 4px 1.5px',
                    borderStyle: 'solid',
                    borderColor: '#f43f5e #f43f5e #9f1239 #f43f5e',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: '900',
                    fontSize: '0.82rem',
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
                  <span>楽天市場で見る ✨</span>
                </a>
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
          </>
        ) : (
          <>
            <span style={{
              position: 'absolute',
              top: '10px',
              right: '14px',
              fontSize: '0.68rem',
              fontWeight: '900',
              color: '#9d174d',
              background: '#fce7f3',
              border: '1px solid #f9a8d4',
              borderRadius: '999px',
              padding: '2px 9px',
              letterSpacing: '0.04em',
              zIndex: 11
            }}>
              PR
            </span>

            <a
              href={useFeaturedProduct
                ? buildMoshimoRakutenItemUrl(featuredItem.targetUrl)
                : (primaryKeyword ? buildMoshimoRakutenSearchUrl(primaryKeyword) : MOSHIMO_RAKUTEN_TOP_URL)}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              referrerPolicy="no-referrer-when-downgrade"
              aria-label={useFeaturedProduct ? featuredItem.title : '楽天市場で関連アイテムをチェック'}
              className="rabi-infeed-wrap"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                textAlign: 'left',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 10
              }}
            >
              <div className="rabi-infeed-top" style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '14px',
                width: '100%'
              }}>
                {/* 📸 左サムネイル（スマホでも記事カードと同じ左配置！） */}
                <div
                  className="rabi-infeed-thumb"
                  style={{
                    position: 'relative',
                    flex: '0 0 auto',
                    width: '148px',
                    height: '98px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: useFeaturedProduct
                      ? '#ffffff'
                      : 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 52%, #e0f2fe 100%)',
                    border: '1.5px solid #f9a8d4',
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: useFeaturedProduct ? '4px' : '0',
                    boxSizing: 'border-box'
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    top: '5px',
                    left: '5px',
                    background: 'rgba(255, 255, 255, 0.94)',
                    color: '#be185d',
                    fontSize: '0.62rem',
                    fontWeight: '900',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
                    zIndex: 2
                  }}>
                    🛍️ 楽天市場
                  </span>

                  {useFeaturedProduct ? (
                    <img
                      src={featuredItem.imageUrl}
                      alt={featuredItem.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <>
                      <img
                        src="/favicon-144x144.png"
                        alt="らびたん"
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          border: '2px solid #f472b6',
                          objectFit: 'cover',
                          background: '#fff',
                          boxShadow: '0 3px 10px rgba(236, 72, 153, 0.22)',
                          marginBottom: '4px'
                        }}
                      />

                      <span style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: '6px',
                        right: '6px',
                        background: 'rgba(15, 23, 42, 0.72)',
                        color: '#ffffff',
                        fontSize: '0.64rem',
                        fontWeight: '800',
                        padding: '2px 6px',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textAlign: 'center'
                      }}>
                        💬 {primaryKeyword ? `${primaryKeyword}…` : '推しグッズ…'}
                      </span>
                    </>
                  )}
                </div>

                {/* 📝 右側：他の記事と同じ構成（タイトル＋バッジ＋ステータス行） */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <div
                    className="rabi-infeed-title"
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: '900',
                      color: '#1e293b',
                      lineHeight: '1.4',
                      paddingRight: '38px'
                    }}
                  >
                    {useFeaturedProduct
                      ? featuredItem.title
                      : (primaryKeyword
                        ? `「${primaryKeyword}」の関連グッズ・本を楽天市場でチェック！`
                        : 'いま話題の推しグッズ・新作ゲーム・コミックを楽天市場でチェック！')}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      PR
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#15803d',
                      background: '#dcfce7',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      🛍️ 楽天市場
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#0369a1',
                      background: '#e0f2fe',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      🐰 {useFeaturedProduct && featuredItem.badge ? featuredItem.badge : 'おすすめ'}
                    </span>
                    {(useFeaturedProduct ? featuredItem.tags : extraKeywords).map((kw, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          color: '#6d28d9',
                          background: '#f5f3ff',
                          border: '1px solid #ddd6fe',
                          padding: '1px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>

                  {/* 📊 記事カードとお揃いのミニステータス装飾行 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: '#64748b',
                    marginTop: '2px'
                  }}>
                    <span>🗳️ 214</span>
                    <span>👁️ 2,385</span>
                    <span>👍 67</span>
                    <span>💬 24</span>
                  </div>
                </div>
              </div>

              {/* 💡 下段：記事カードとお揃いの全幅クリーム説明ボックス */}
              <div style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fdf2f8 100%)',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '7px 11px',
                fontSize: '0.79rem',
                lineHeight: '1.5',
                color: '#475569',
                fontWeight: '600'
              }}>
                <span style={{ color: '#be185d', fontWeight: '900' }}>💡 らびたんおすすめ！</span>{' '}
                {useFeaturedProduct
                  ? featuredItem.rabiNote
                  : (primaryKeyword
                    ? `いま注目されている「${primaryKeyword}」の関連アイテムや売れ筋ランキングを楽天市場でサクッと探せるよ ▸`
                    : 'みんなが気になっているトレンドアイテムや人気ランキングを楽天市場でのぞいてみようらび ▸')}
              </div>
            </a>

            <style>{`
              @media (max-width: 600px) {
                .rabi-infeed-top {
                  gap: 10px !important;
                  align-items: flex-start !important;
                }
                .rabi-infeed-thumb {
                  width: 104px !important;
                  height: 92px !important;
                }
                .rabi-infeed-title {
                  font-size: 0.88rem !important;
                  padding-right: 34px !important;
                }
              }
            `}</style>

            <img
              src={impressionUrl}
              width="1"
              height="1"
              alt=""
              style={{ border: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              loading="lazy"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdSenseBox;
