import React, { useState, useEffect } from 'react';

const AdSenseBox = ({ slot, format = 'auto', affiliateType = null }) => {
  // 🥕 おりぴさんの特別な紹介ID！
  const ASSOCIATE_ID = 'olipivote-22';

  // ✨ おすすめ商品リスト
  const RECOMMENDATIONS = [
    { title: '【第2類医薬品】 by Amazon 鼻炎スプレーN 30mL × 5本', url: 'https://amzn.to/4raqnTr', image: 'https://m.media-amazon.com/images/I/71uk-JC-T4L._AC_SX679_.jpg', icon: '👃', category: 'おりぴ医薬品' },
    { title: 'by Amazon キトサン加工綿棒 200本x10個', url: 'https://amzn.to/4slfYp4', image: 'https://m.media-amazon.com/images/I/71RDCcGMRkL._AC_SX679_PIbundle-10,TopRight,0,0_SH20_.jpg', icon: '🧹', category: 'おりぴ日用品' },
    { title: 'ソフトパックティッシュ (320枚 72パック入)', url: 'https://amzn.to/4b6ZPMN', image: 'https://m.media-amazon.com/images/I/71F-kSQlPGL._AC_SX679_PIbundle-72,TopRight,0,0_SH20_.jpg', icon: '🧻', category: 'おりぴ日用品' },
    { title: '山善 つっぱり式カーテンレール 3ポール', url: 'https://amzn.to/4ldgyCJ', image: 'https://m.media-amazon.com/images/I/610RqBHU+-S._AC_SY879_.jpg', icon: '🏠', category: 'おりぴ家具' },
    { title: 'オーディオテクニカ AT8705 マイクアーム ロープロファイル', url: 'https://amzn.to/4cqLvkJ', image: 'https://m.media-amazon.com/images/I/51vcPonquOL._AC_SY879_.jpg', icon: '🎙️', category: 'おりぴ音響機器' },
    { title: "D'Addario ダダリオ ブリッジピンプラー", url: 'https://amzn.to/4b3HArD', image: 'https://m.media-amazon.com/images/I/61iQnsDnENL._AC_SX679_.jpg', icon: '🎸', category: 'おりぴ楽器' },
    { title: 'アストロプロダクツ 充電式 グルーガン', url: 'https://amzn.to/4bnSVnP', image: 'https://m.media-amazon.com/images/I/61E4pp-RS5L._AC_SX679_.jpg', icon: '🛠️', category: 'おりぴ工具' },
    { title: '下村企販 バナナスタンド', url: 'https://amzn.to/4rfif4a', image: 'https://m.media-amazon.com/images/I/41SLnhzQXVL._AC_SY879_.jpg', icon: '🍌', category: 'おりぴキッチン' },
    { title: 'ブテナロック 足洗いソープ', url: 'https://amzn.to/4rVg8ni', image: 'https://m.media-amazon.com/images/I/51U5qFjDPOL._AC_SY879_.jpg', icon: '🧼', category: 'おりぴ生活' },
    { title: 'Logicool G ゲーミングヘッドセット', url: 'https://amzn.to/46HYQS0', image: 'https://m.media-amazon.com/images/I/71QEWj+ioXS._AC_SX679_.jpg', icon: '🎧', category: 'おりぴPC' },
    { title: '味の素 冷凍ギョーザ 1kg', url: 'https://amzn.to/4b9MxiU', image: 'https://m.media-amazon.com/images/I/81bIZEBVGqL._AC_SX1000_.jpg', icon: '🥟', category: 'おりぴ食品' },
    { title: 'UGREEN USB-C ケーブル 2M', url: 'https://amzn.to/40ekjhW', image: 'https://m.media-amazon.com/images/I/61DgZxJhEZL._AC_SY879_.jpg', icon: '🔌', category: 'おりぴPC' },
    { title: 'LISEN USB-C ケーブル 2M', url: 'https://amzn.to/4aQsQO4', image: 'https://m.media-amazon.com/images/I/81eeRU5gwtL._AC_SX679_.jpg', icon: '🔌', category: 'おりぴPC' },
    { title: 'Shark 自動ゴミ収集掃除機', url: 'https://amzn.to/4bgVp6q', image: 'https://m.media-amazon.com/images/I/51F7qXg9W+L._AC_SX679_.jpg', icon: '🧹', category: 'おりぴ家電' },
    { title: 'SONY 65インチ 4Kブラビア', url: 'https://amzn.to/3N15HiU', image: 'https://m.media-amazon.com/images/I/61N0XNFinyL._AC_SY879_.jpg', icon: '📺', category: 'おりぴ家電' },
    { title: 'by Amazon エナジードリンク', url: 'https://amzn.to/4rVsb47', image: 'https://m.media-amazon.com/images/I/81YLVVDtZRL._AC_SX679_.jpg', icon: '⚡', category: 'おりぴ飲物' }
  ];

  const [rec, setRec] = useState(() => RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)]);
  const [isAnimateHeart, setIsAnimateHeart] = useState(false);

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

  return (
    <div className="adsense-container-wrapper">
      <div className="ads-placeholder" style={{
        background: 'linear-gradient(135deg, #fff5f7 0%, #ffffff 100%)',
        border: '3px dashed #ec4899', borderRadius: '24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '28px', color: '#64748b', fontSize: '0.9rem',
        boxShadow: '0 10px 40px rgba(236, 72, 153, 0.12)',
        width: '100%',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
                marginTop: '12px' // Added to maintain similar spacing as original link
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
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>✨</div>
            <div style={{ fontWeight: 'bold' }}>スポンサー枠</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '4px' }}>広場を一緒に盛り上げてくれる<br />スポンサーさんを募集中です！✨</div>
          </div>
        )}
      </div>
      <ins className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-9429738476925701"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdSenseBox;
