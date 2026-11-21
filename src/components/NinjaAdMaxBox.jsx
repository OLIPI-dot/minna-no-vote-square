import React, { useEffect, useRef } from 'react';

const ADMAX_TAG_ID = 'd7633f1399dbdfd1f5cb0214e11df16e';
const ADMAX_CONTAINER_ID = `admax-banner-${ADMAX_TAG_ID}`;

const NinjaAdMaxBox = () => {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // 🥷 忍者AdMax公式スクリプト (s.js) をReact SPAでもdocument.writeなしで安全に描画するらび！
    // 掲載確認用エンドポイント (/s/TAG_ID) にも正規のリファラ付きでアクセス通知を送る
    fetch(`https://adm.shinobi.jp/s/${ADMAX_TAG_ID}`, {
      mode: 'no-cors',
      referrerPolicy: 'no-referrer-when-downgrade'
    }).catch(() => {});

    window.admaxbanner = {
      admax_id: ADMAX_CONTAINER_ID,
      tag_id: ADMAX_TAG_ID,
      type: 'b',
      width: 300,
      height: 250
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.src = 'https://adm.shinobi.jp/st/s.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      loadedRef.current = false;
    };
  }, []);

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
            id={ADMAX_CONTAINER_ID}
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default NinjaAdMaxBox;
