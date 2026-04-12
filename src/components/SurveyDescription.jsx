import React, { useState } from 'react';
import SourcePreviewModal from './SourcePreviewModal';

const SurveyDescription = ({ description, renderCommentContent, isTimeUp }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  if (!description) return null;

  // 🛡️ サイト内表示（iframe）が禁止されているドメインのリストらび！
  const isIframeRestricted = (url) => {
    if (!url) return true;
    const restrictedDomains = [
      'yahoo.co.jp',
      'famitsu.com',
      '4gamer.net',
      'gamespark.jp',
      'automaton-media.com',
      'youtube.com',
      'ign.com',
      'kai-you.net',
      'mdpr.jp',
      'natalie.mu',
      'mantan-web.jp',
      'phileweb.com',
      'impress.co.jp',
      'dengekionline.com',
      'denfaminicogamer.jp'
    ];
    return restrictedDomains.some(domain => url.includes(domain));
  };

  // 🔗 説明文の中からリンクを救出するらび！ [テキスト](URL) 形式を最優先、なければ生のURLを探すよ。
  const mdMatch = description.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
  const rawMatch = description.match(/(https?:\/\/[^\s)]+)/);
  
  const displayLink = mdMatch 
    ? { text: mdMatch[1], url: mdMatch[2] } 
    : (rawMatch ? { text: '出典元（詳細を見る）', url: rawMatch[0] } : null);
  
  const isRestricted = displayLink ? isIframeRestricted(displayLink.url) : false;

  // 📝 らびのコメントを抽出して装飾するらび！
  const labiCommentMatch = description.match(/🐰 \*\*らびの視点：\*\*([\s\S]*?)(?=---\n|\[\[|$)/);
  const labiComment = labiCommentMatch ? labiCommentMatch[1].trim() : null;

  // 🧩 秘密の答え（SECRET_ANSWER）を救出するらび！
  const secretAnswerMatch = description.match(/\[\[SECRET_ANSWER:([\s\S]*?)\]\]/);
  const secretAnswer = secretAnswerMatch ? secretAnswerMatch[1].trim() : null;
  
  // らびのコメントを除いた後の本文（および出典元URLの抽出）
  let cleanBody = description
    .replace(/🐰 \*\*らびの視点：\*\*[\s\S]*?(---\n|\[\[|$)/, '') // らびのコメントを削除
    .replace(/\[\[SECRET_ANSWER:[\s\S]*?\]\]/g, '')               // 秘密の答えを削除
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '')         // リンク形式を削除
    .replace(/https?:\/\/[^\s)]+/g, '')                            // 生URLを削除
    .trim();

  return (
    <div className="survey-description-container" style={{
      margin: '0 auto 50px auto',
      maxWidth: '1100px',
      position: 'relative',
    }}>
      {/* プレミアムなラベル 🏷️ */}
      <div style={{
        position: 'absolute',
        top: '-16px',
        left: '40px',
        background: 'linear-gradient(135deg, #FF6B95, #7c3aed)',
        color: 'white',
        padding: '6px 20px',
        borderRadius: '30px',
        fontSize: '0.85rem',
        fontWeight: '900',
        zIndex: 5,
        boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        letterSpacing: '0.08em'
      }}>
        <span style={{ fontSize: '1.2rem' }}>💎</span>
        <span>解説 / ニュース解説</span>
      </div>

      <div className="survey-description-box" style={{
        fontSize: '1.05rem',
        color: '#334155',
        lineHeight: '2',
        letterSpacing: '0.02em',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '28px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05)',
        whiteSpace: 'pre-wrap',
        textAlign: 'justify',
        position: 'relative',
        padding: '40px',
        fontFamily: "'Inter', 'Noto Sans JP', sans-serif"
      }}>
        {/* 🐰 らびの吹き出しエリア（独自コンテンツ強調！） */}
        {labiComment && (
          <div style={{
            background: '#fff5f7',
            padding: '25px',
            borderRadius: '24px',
            marginBottom: '30px',
            border: '2px solid #ffccd5',
            position: 'relative',
            fontSize: '1.1rem',
            color: '#be185d',
            boxShadow: 'inset 0 2px 10px rgba(255,182,193,0.2)'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>🐰</span>
              <span>守護霊「らび」のコメント</span>
            </div>
            {labiComment}
            <div style={{
              position: 'absolute', bottom: '-12px', left: '40px', width: '24px', height: '24px',
              background: '#fff5f7', borderRight: '2px solid #ffccd5', borderBottom: '2px solid #ffccd5',
              transform: 'rotate(45deg)'
            }} />
          </div>
        )}

        {/* 🧩 秘密の答えエリア（クイズ・なぞなぞ機能！） */}
        {secretAnswer && (
          <div style={{
            background: isTimeUp ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' : '#f8fafc',
            padding: '30px',
            borderRadius: '24px',
            marginBottom: '30px',
            border: isTimeUp ? '3px solid #22c55e' : '3px dashed #cbd5e1',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {!isTimeUp ? (
              <div style={{ color: '#64748b' }}>
                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '10px' }}>🔐</span>
                <strong style={{ fontSize: '1.2rem', color: '#475569' }}>正解は締切後に発表されるらび！</strong><br/>
                それまで、みんな本音で投票してほしいらびっ！carrot!
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 1s ease-out' }}>
                <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>🎉 正解発表！らび！！</span>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#15803d', lineHeight: '1.4' }}>
                  {secretAnswer}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 本文 💡 */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1, 
          marginBottom: displayLink ? '32px' : '0',
          color: '#334155'
        }}>
          {cleanBody}
        </div>

        {/* 🔗 スマート・ソースボタン */}
        {displayLink && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => isRestricted ? window.open(displayLink.url, '_blank') : setIsPreviewOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 32px',
                background: isRestricted 
                  ? 'linear-gradient(135deg, #475569, #1e293b)' // 外部用は少し落ち着いた色に
                  : 'linear-gradient(135deg, #7c3aed, #6366f1)', // 内部用は鮮やか、らび！
                borderRadius: '18px',
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                textDecoration: 'none',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer',
                border: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
              }}
            >
              <span>{isRestricted ? '🚀' : '🌐'}</span>
              <span>
                {isRestricted ? '出典サイトで詳しく読む（外部）' : 'このサイト内でサクッと読む'}
              </span>
              <span style={{ fontSize: '1.2em' }}>›</span>
            </button>
          </div>
        )}
      </div>

      {/* 🖼️ アプリ内プレビューモーダル（許可サイトのみ） */}
      {displayLink && !isRestricted && (
        <SourcePreviewModal 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          url={displayLink.url} 
          title={cleanBody.substring(0, 30) + '...'} 
        />
      )}
    </div>
  );
};

export default SurveyDescription;
