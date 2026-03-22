import React, { useState, useEffect } from 'react';

const TrendingHeadline = ({ surveys, navigateTo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // アンケートリストが変わったらインデックスをリセット
  useEffect(() => {
    setCurrentIndex(0);
  }, [surveys]);

  // 自動スライド機能（5秒おき）
  useEffect(() => {
    if (!surveys || surveys.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 6000); // ちょっとゆったりめの6秒にするらび！

    return () => clearInterval(interval);
  }, [surveys, currentIndex]);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % surveys.length);
      setIsFading(false);
    }, 400); // フェードアウトの時間に合わせるらび
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + surveys.length) % surveys.length);
      setIsFading(false);
    }, 400);
  };

  if (!surveys || surveys.length === 0) return null;

  const s = surveys[currentIndex];
  if (!s) return null;

  // 画像URLの解決
  let thumbSrc = null;
  if (s.image_url) {
    const entries = s.image_url.split(',').map(v => v.trim()).filter(Boolean);
    const yt = entries.find(v => v.startsWith('yt:'));
    const nico = entries.find(v => v.startsWith('nico:'));
    if (yt) thumbSrc = `https://img.youtube.com/vi/${yt.substring(3)}/hqdefault.jpg`;
    else if (nico) thumbSrc = `https://snapshot.cdn.nicovideo.jp/snapshots/i/${nico.substring(5)}`;
    else if (entries[0]) thumbSrc = entries[0];
  }

  return (
    <div className="trending-headline-container">
      <div 
        className={`trending-headline-card ${isFading ? 'fading' : ''}`}
        onClick={() => navigateTo('details', s)}
      >
        {/* 背景画像（オーバーレイ付き） */}
        <div className="headline-bg-wrapper">
          {thumbSrc ? (
            <img src={thumbSrc} alt="" className="headline-bg-image" key={s.id} />
          ) : (
            <div className={`headline-bg-placeholder cat-${s.category || 'その他'}`} key={s.id}></div>
          )}
          <div className="headline-overlay"></div>
        </div>

        {/* コンテンツエリア */}
        <div className="headline-content">
          <div className="headline-labels">
            <span className="trending-badge">👑 今、広場で一番アツい！</span>
            <span className="headline-category">#{s.category}</span>
          </div>

          <h2 className="headline-title">{s.title}</h2>

          <div className="headline-stats">
            <div className="stat-unit">
              <span className="stat-icon">🗳️</span>
              <span className="stat-value">{s.total_votes || 0}</span>
              <span className="stat-label">票</span>
            </div>
            <div className="stat-unit">
              <span className="stat-icon">👁️</span>
              <span className="stat-value">{s.view_count || 0}</span>
              <span className="stat-label">View</span>
            </div>
          </div>

          <div className="headline-action">
            <span className="action-btn">投票して参加する ✍️</span>
          </div>
        </div>

        {/* スライド操作ボタン（左右） */}
        {surveys.length > 1 && (
          <div className="headline-navigation">
            <button className="nav-btn prev" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>❮</button>
            <button className="nav-btn next" onClick={(e) => { e.stopPropagation(); handleNext(); }}>❯</button>
          </div>
        )}
      </div>

      {/* ドットインジケーター */}
      {surveys.length > 1 && (
        <div className="headline-dots">
          {surveys.map((_, i) => (
            <div 
              key={i} 
              className={`dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setIsFading(true);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setIsFading(false);
                }, 400);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingHeadline;
