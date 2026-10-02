import React, { useState, useEffect } from 'react';

const WatermarkLogo = ({ onClick }) => {
  const [sparkles, setSparkles] = useState([]);

  const handleClick = (e) => {
    // Generate 6-8 random sparkles/carrots/hearts
    const count = Math.floor(Math.random() * 3) + 6;
    const emojis = ['✨', '🥕', '✨', '🐰', '⭐', '💖', '💗']; // ✨ appears more often
    
    const newSparkles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: (Math.random() - 0.5) * 80, // spread range -40px to 40px
      y: (Math.random() - 0.5) * 80, 
      size: Math.random() * 0.8 + 0.6, // random size 0.6rem to 1.4rem
      rotation: Math.random() * 360 // random initial rotation
    }));

    setSparkles(prev => [...prev, ...newSparkles]);
    
    // Trigger the original navigation action
    if (onClick) onClick(e);
  };

  // Clean up sparkles after animation
  useEffect(() => {
    if (sparkles.length > 0) {
      const timer = setTimeout(() => {
        setSparkles([]); // Reset to prevent memory leaks
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sparkles]);

  return (
    <div 
      className="watermark-logo"
      onClick={handleClick}
    >
      <span className="watermark-logo-text">みんアケ</span>
      <span className="watermark-logo-icon">🐰🥕</span>

      {/* Render Sparkles */}
      {sparkles.map(s => (
        <span
          key={s.id}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            pointerEvents: 'none',
            fontSize: `${s.size}rem`,
            animation: `sparkleAnim 0.8s forwards ease-out`,
            // Set CSS variables so keyframes know where to go
            '--tx': `${s.x}px`,
            '--ty': `${s.y}px`,
            '--rot': `${s.rotation}deg`
          }}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
};

export default WatermarkLogo;
