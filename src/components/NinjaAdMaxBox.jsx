import React, { useEffect, useRef } from 'react';

const ADMAX_ID = 'd7633f1399dbdfd1f5cb0214e11df16e';

const NinjaAdMaxBox = () => {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    window.admaxads = window.admaxads || [];
    if (!window.admaxads.some((ad) => ad.admax_id === ADMAX_ID)) {
      window.admaxads.push({ admax_id: ADMAX_ID, type: 'banner' });
    }

    const script = document.createElement('script');
    script.src = 'https://adm.shinobi.jp/st/t.js';
    script.charset = 'utf-8';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.__admax_render__ = undefined;
      window.__admax_tag__ = undefined;
      window.admaxads = [];
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
            className="admax-ads"
            data-admax-id={ADMAX_ID}
            style={{ display: 'inline-block', width: '300px', height: '250px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default NinjaAdMaxBox;
