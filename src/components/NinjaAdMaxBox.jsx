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
          margin: '0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          className="rabi-recommend-card"
          style={{
            position: 'relative',
            background: '#ffffff',
            border: '1px solid #e9d5ff',
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            transition: 'all 0.25s ease'
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '12px',
              right: '14px',
              fontSize: '0.68rem',
              fontWeight: '800',
              color: '#94a3b8',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '1px 7px',
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
              gap: '16px',
              width: '100%',
              textAlign: 'left'
            }}
          >
            {/* 📺 左側：記事サムネと同じ162px幅に揃えてタイトル開始位置をピタッと一致させる (スマホは原寸中央) */}
            <div
              className="rabi-admax-thumb-box"
              style={{
                flex: '0 0 auto',
                width: '162px',
                height: '135px',
                overflow: 'hidden',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                position: 'relative'
              }}
            >
              <div
                className="rabi-admax-scale-wrap"
                style={{
                  width: '300px',
                  height: '250px',
                  transform: 'scale(0.54)',
                  transformOrigin: 'top left'
                }}
              >
                <div
                  id={containerId}
                  style={{ display: 'inline-block', width: '300px', height: '250px' }}
                />
              </div>
            </div>

            {/* 📝 右側：記事カード(.survey-item-card)と完全にお揃いのレイアウト */}
            <div
              className="rabi-admax-infeed-info"
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div
                style={{
                  fontSize: '0.98rem',
                  fontWeight: '800',
                  color: '#0f172a',
                  lineHeight: '1.45',
                  paddingRight: '42px'
                }}
              >
                スポンサーからのピックアップ情報
              </div>

              <div
                style={{
                  background: 'linear-gradient(90deg, #faf5ff 0%, #fdf2f8 60%, #fffbeb 100%)',
                  border: '1px solid #e9d5ff',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  lineHeight: '1.5',
                  color: '#334155',
                  fontWeight: '600'
                }}
              >
                <span style={{ color: '#5b21b6', fontWeight: '800', marginRight: '4px' }}>💡 らびたんより</span>
                いつも「みんアケ」に遊びにきてくれてありがとうらび！気になったものがあれば、ぜひチェックしてみてね🥕
                <span style={{ color: '#7c3aed', fontWeight: '800', marginLeft: '3px' }}>▸</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  PR
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: '#15803d',
                    background: '#dcfce7',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  スポンサー
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: '#0369a1',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '6px'
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
              .rabi-admax-thumb-box {
                width: 300px !important;
                max-width: 100% !important;
                height: 250px !important;
              }
              .rabi-admax-scale-wrap {
                transform: none !important;
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
