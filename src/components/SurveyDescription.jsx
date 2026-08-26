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

  // ⚡ 要約カード（SUMMARY）を抽出するらび！
  const summaryTagMatch = description.match(/\[\[SUMMARY:([\s\S]*?)\]\]/);
  let summaryPoints = [];
  if (summaryTagMatch) {
    summaryPoints = summaryTagMatch[1].trim().split('\n').map(s => s.replace(/^[-・•]\s*/, '').trim()).filter(Boolean);
  }

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
    .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')                     // 要約タグを削除
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '')         // リンク形式を削除
    .replace(/https?:\/\/[^\s)]+/g, '')                            // 生URLを削除
    .trim();

  // ⚡ SUMMARY タグがない場合は本文から自動抽出するらび！（超柔軟＆詳細版！）
  if (summaryPoints.length === 0 && cleanBody) {
    // 1. まず見出しや出典を除いたテキスト行を抽出
    const rawLines = cleanBody.split('\n')
      .map(l => l.trim().replace(/^###\s*/, '').replace(/^[-・•]\s*/, ''))
      .filter(l => l.length > 0 && !l.startsWith('（出典'));

    // 2. 各行から文（。や！）を抽出、先頭の「2 」などの不要な数字プレフィックスをお掃除
    const extracted = [];
    for (const line of rawLines) {
      if (extracted.length >= 5) break;
      const sentences = line.match(/[^。！]+[。！]?/g) || [line];
      for (const s of sentences) {
        let trimmedS = s.trim()
          .replace(/^[\d①-⑨一-九]+[.\s、・]/, '') // 「2 噂まとめ」や「1. 」の先頭数字を綺麗にお掃除！
          .replace(/^###\s*/, '')
          .replace(/^[-・•]\s*/, '');

        if (trimmedS.length >= 10 && !trimmedS.includes('出典：')) {
          const formatted = trimmedS.length > 130 ? trimmedS.substring(0, 128) + '…' : trimmedS;
          if (!extracted.includes(formatted)) {
            extracted.push(formatted);
            if (extracted.length >= 5) break;
          }
        }
      }
    }

    // 3. もし取れなかった場合の緊急救済
    if (extracted.length === 0 && cleanBody.length > 0) {
      const shortSnippet = cleanBody.replace(/\s+/g, ' ').trim();
      extracted.push(shortSnippet.length > 130 ? shortSnippet.substring(0, 128) + '…' : shortSnippet);
    }

    summaryPoints = extracted;
  }

  // 🧹 既存の[[SUMMARY:...]]タグ内でも先頭数字があれば綺麗にするらび！
  summaryPoints = summaryPoints.map(p => p.replace(/^[\d①-⑨一-九]+[.\s、・]/, '').trim());

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
        {/* ⚡ 要約・注目ポイントカード (目を引くリッチデザイン＆高ジャンプ率！) */}
        {summaryPoints.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #f0fdf4 100%)',
            borderRadius: '24px',
            padding: '26px 30px',
            marginBottom: '35px',
            border: '2px solid #e9d5ff',
            boxShadow: '0 12px 32px rgba(168, 85, 247, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 背景のキラキラアクセント */}
            <div style={{
              position: 'absolute',
              top: '-40px',
              right: '-30px',
              width: '160px',
              height: '160px',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              position: 'relative',
              zIndex: 1
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                color: 'white',
                padding: '6px 18px',
                borderRadius: '30px',
                fontSize: '0.88rem',
                fontWeight: '900',
                letterSpacing: '0.08em',
                boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>⚡ 要約・注目ポイント</span>
              <span style={{ fontSize: '0.78rem', color: '#9333ea', fontWeight: 'bold', opacity: 0.8 }}>30秒でサクッと把握！</span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              {summaryPoints.map((point, idx) => {
                // 💡 カギカッコや数字などのキーフレーズにハイライト色をつけて「ジャンプ率」を高めるらび！
                const parts = point.split(/(「[^」]+」|【[^】]+】|\b\d+[月日万億円個件台%]?\b)/g);
                return (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    marginBottom: idx < summaryPoints.length - 1 ? '16px' : '0',
                    fontSize: '1.02rem',
                    color: '#1e293b',
                    lineHeight: '1.75',
                    fontWeight: '500'
                  }}>
                    <span style={{
                      flex: '0 0 auto',
                      width: '28px',
                      height: '28px',
                      background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      marginTop: '2px',
                      boxShadow: '0 3px 10px rgba(236, 72, 153, 0.3)'
                    }}>{idx + 1}</span>
                    <span style={{ whiteSpace: 'normal', width: '100%' }}>
                      {parts.map((part, pIdx) => {
                        const isQuote = part.startsWith('「') || part.startsWith('【');
                        const isNumber = /^\d+[月日万億円個件台%]?$/.test(part);
                        if (isQuote) {
                          return <strong key={pIdx} style={{ color: '#6b21a8', fontWeight: '900', background: 'rgba(168, 85, 247, 0.1)', padding: '1px 6px', borderRadius: '6px', margin: '0 2px' }}>{part}</strong>;
                        }
                        if (isNumber) {
                          return <strong key={pIdx} style={{ color: '#be185d', fontWeight: '900' }}>{part}</strong>;
                        }
                        return part;
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

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
                <strong style={{ fontSize: '1.2rem', color: '#475569' }}>正解は締切後に発表されるらび！</strong><br />
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

        {/* 本文 💡 (簡易マークダウンパースで見出しと段落をオシャレに装飾) */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          marginBottom: displayLink ? '32px' : '0',
          color: '#334155'
        }}>
          {cleanBody ? cleanBody.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={idx} style={{ height: '1em' }} />;

            // 見出し行 (### 📢 ...)
            if (trimmed.startsWith('###')) {
              const headingText = trimmed.replace(/^###\s*/, '');
              return (
                <h4 key={idx} className="desc-heading-classic" style={{
                  fontSize: '1.15rem',
                  color: '#1e293b',
                  fontWeight: '900',
                  marginTop: '32px',
                  marginBottom: '18px',
                  paddingLeft: '14px',
                  borderLeft: '4px solid #7c3aed',
                  backgroundImage: 'linear-gradient(90deg, rgba(124, 58, 237, 0.04), transparent)',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  borderRadius: '0 8px 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: '1.5'
                }}>
                  {headingText}
                </h4>
              );
            }

            // 通常の段落
            return (
              <p key={idx} className="desc-paragraph" style={{
                margin: '0 0 20px 0',
                lineHeight: '2.1',
                fontSize: '1.05rem',
                color: '#374151',
                textAlign: 'justify',
                letterSpacing: '0.03em',
                wordBreak: 'break-word'
              }}>
                {line}
              </p>
            );
          }) : null}
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
