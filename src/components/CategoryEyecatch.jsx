import React from 'react';
import { CATEGORY_ICON_STYLE } from '../constants';

const CategoryEyecatch = ({ category, style = {} }) => {
  const catName = category?.trim() || "その他";
  const catStyle = CATEGORY_ICON_STYLE[catName] || CATEGORY_ICON_STYLE['その他'];
  
  const enName = {
    "ニュース": "NEWS",
    "話題": "TRENDING",
    "エンタメ": "ENTERTAIN",
    "芸能": "SHOWBIZ",
    "レビュー": "REVIEW",
    "コラム": "COLUMN",
    "ネタ": "FUNNY",
    "ゲーム": "GAME",
    "クイズ": "QUIZ",
    "なぞなぞ": "RIDDLE",
    "らび": "LABI",
    "その他": "OTHER",
    "マイアンケート": "MINE"
  }[catName] || "OTHER";

  return (
    <div className="category-eyecatch no-image-fallback" style={{
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
      background: `linear-gradient(135deg, ${catStyle.color || '#94a3b8'} 0%, #1e293b 150%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      borderRadius: 'inherit',
      ...style
    }}>
      <div style={{ 
        fontSize: '2.5rem', 
        marginBottom: '4px', 
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{ fontSize: '0.85em' }}>🐰</span>
        <span>{catStyle.icon}</span>
      </div>
      <div style={{ 
        fontSize: '1rem', 
        fontWeight: '900', 
        color: 'rgba(255, 255, 255, 0.95)', 
        letterSpacing: '0.1em',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        fontFamily: '"Arial Black", "Impact", sans-serif'
      }}>
        {enName}
      </div>
    </div>
  );
};

export default CategoryEyecatch;
