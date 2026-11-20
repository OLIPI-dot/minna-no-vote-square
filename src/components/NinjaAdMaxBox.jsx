import React from 'react';

const NINJA_ADMAX_SRC = 'https://adm.shinobi.jp/s/d7633f1399dbdfd1f5cb0214e11df16e';

const NINJA_ADMAX_SRCDOC = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 300px;
      height: 250px;
      overflow: hidden;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <script src="${NINJA_ADMAX_SRC}"></script>
</body>
</html>`;

const NinjaAdMaxBox = () => {
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
            height: '250px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: '10px'
          }}
        >
          <iframe
            title="スポンサーリンク"
            srcDoc={NINJA_ADMAX_SRCDOC}
            width="300"
            height="250"
            scrolling="no"
            frameBorder="0"
            referrerPolicy="no-referrer-when-downgrade"
            loading="lazy"
            style={{
              border: 'none',
              width: '300px',
              height: '250px',
              display: 'block',
              overflow: 'hidden'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NinjaAdMaxBox;
