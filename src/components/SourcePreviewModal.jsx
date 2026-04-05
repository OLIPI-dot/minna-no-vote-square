import React from 'react';

const SourcePreviewModal = ({ isOpen, onClose, url, title }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>
      
      <div style={{
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '1000px',
        height: '90vh',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)'
      }}>
        {/* Header 🏷️ */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(90deg, #f8fafc, #f1f5f9)',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ flex: 1, marginRight: '16px', overflow: 'hidden' }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1rem', 
              color: '#1e293b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {title || 'ニュースのプレビュー'}
            </h3>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              {url}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                backgroundColor: '#7c3aed',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
            >
              <span>🚀</span> 別タブで開く
            </a>
            
            <button 
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Area (Iframe) 🖼️ */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#fdfdfd' }}>
          <iframe 
            src={url} 
            title="Source Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
          {/* Note for restricted sites ⚠️ */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            color: '#64748b',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            ※ Yahoo!ニュースなどは、セキュリティ制限によりここで表示できない場合がありますらび。💧
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourcePreviewModal;
