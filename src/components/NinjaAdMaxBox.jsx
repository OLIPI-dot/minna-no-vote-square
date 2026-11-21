import React, { useEffect, useRef } from 'react';

const ADMAX_TAG_ID = 'd7633f1399dbdfd1f5cb0214e11df16e';

// 🥷 複数枠を同時に描画しても window.admaxbanner が競合しないよう順番に読み込むキュー
let admaxLoadQueue = Promise.resolve();
let hasPingedPlacement = false;

const NinjaAdMaxBox = ({ slotId = 'sidebar', variant = 'sidebar' }) => {
  const containerId = `admax-banner-${slotId}-${ADMAX_TAG_ID}`;
  const isInfeed = variant === 'infeed';
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    let isCancelled = false;
    let injectedScript = null;

    if (!hasPingedPlacement) {
      hasPingedPlacement = true;
      fetch(`https://adm.shinobi.jp/s/${ADMAX_TAG_ID}`, {
        mode: 'no-cors',
        referrerPolicy: 'no-referrer-when-downgrade'
      }).catch(() => {});
    }

    admaxLoadQueue = admaxLoadQueue.then(
      () =>
        new Promise((resolve) => {
          if (isCancelled || !document.getElementById(containerId)) {
            resolve();
            return;
          }

          window.admaxbanner = {
            admax_id: containerId,
            tag_id: ADMAX_TAG_ID,
            type: 'b',
            width: 300,
            height: 250
          };

          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.charset = 'utf-8';
          script.src = `https://adm.shinobi.jp/st/s.js?slot=${encodeURIComponent(slotId)}`;
          script.async = true;
          script.onload = () => setTimeout(resolve, 120);
          script.onerror = () => resolve();
          injectedScript = script;
          document.body.appendChild(script);
        })
    );

    return () => {
      isCancelled = true;
      if (injectedScript && injectedScript.parentNode) {
        injectedScript.parentNode.removeChild(injectedScript);
      }
      loadedRef.current = false;
    };
  }, [containerId, slotId]);

  if (isInfeed) {
    return (
      <div
        className="rabi-recommend-wrapper"
        style={{
          width: '100%',
          margin: '16px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          className="rabi-recommend-card"
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 52%, #fdf2f8 100%)',
            border: '2px solid #e9d5ff',
            borderRadius: '22px',
            padding: '16px 18px',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.08)',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '14px',
              fontSize: '0.68rem',
              fontWeight: '900',
              color: '#6d28d9',
              background: '#f3e8ff',
              border: '1px solid #d8b4fe',
              borderRadius: '999px',
              padding: '2px 9px',
              letterSpacing: '0.04em',
              zIndex: 11
            }}
          >
            PR
          </span>

          <div
            className="rabi-admax-infeed-inner"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '18px',
              width: '100%',
              textAlign: 'left'
            }}
          >
            {/* 📺 左側：300x250 スポンサー広告フレーム */}
            <div
              style={{
                flex: '0 0 auto',
                width: '300px',
                maxWidth: '100%',
                minHeight: '250px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: '14px',
                border: '1.5px solid #e9d5ff',
                background: '#ffffff',
                boxShadow: '0 3px 10px rgba(139, 92, 246, 0.08)'
              }}
            >
              <div
                id={containerId}
                style={{ display: 'inline-block', width: '300px', height: '250px' }}
              />
            </div>

            {/* 📝 右側：記事カード風の案内エリア */}
            <div
              className="rabi-admax-infeed-info"
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingRight: '38px'
                }}
              >
                <img
                  src="/favicon-144x144.png"
                  alt="らびたん"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid #f472b6',
                    objectFit: 'cover',
                    background: '#fff',
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: '0.96rem',
                    fontWeight: '900',
                    color: '#4c1d95',
                    lineHeight: '1.4'
                  }}
                >
                  スポンサーからのピックアップ ✨
                </span>
              </div>

              <div
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fdf2f8 100%)',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                  lineHeight: '1.55',
                  color: '#475569',
                  fontWeight: '600'
                }}
              >
                <span style={{ color: '#be185d', fontWeight: '900' }}>💡 らびたんより</span>{' '}
                いつも「みんアケ」に遊びにきてくれてありがとうらび！気になったものがあれば、ぜひチェックしてみてね🥕
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: '#6d28d9',
                    background: '#f5f3ff',
                    border: '1px solid #ddd6fe',
                    padding: '3px 10px',
                    borderRadius: '999px'
                  }}
                >
                  📢 スポンサー枠
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: '#be185d',
                    background: '#fdf2f8',
                    border: '1px solid #fbcfe8',
                    padding: '3px 10px',
                    borderRadius: '999px'
                  }}
                >
                  🐰 広場応援
                </span>
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 680px) {
              .rabi-admax-infeed-inner {
                flex-direction: column !important;
                align-items: center !important;
                gap: 12px !important;
              }
              .rabi-admax-infeed-info {
                width: 100% !important;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rabi-recommend-wrapper"
      style={{
        width: '100%',
        marginTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
          border: '1.5px solid #e9d5ff',
          borderRadius: '20px',
          padding: '24px 10px 12px 10px',
          boxShadow: '0 6px 18px rgba(139, 92, 246, 0.07)',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '10px',
            fontSize: '0.64rem',
            fontWeight: '800',
            color: '#6d28d9',
            background: '#f3e8ff',
            border: '1px solid #d8b4fe',
            borderRadius: '999px',
            padding: '1px 7px',
            letterSpacing: '0.04em'
          }}
        >
          PR
        </span>
        <div
          style={{
            width: '300px',
            maxWidth: '100%',
            minHeight: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '10px'
          }}
        >
          <div
            id={containerId}
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default NinjaAdMaxBox;
