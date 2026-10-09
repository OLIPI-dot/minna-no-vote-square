import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

const EmbedView = ({ surveyId }) => {
  const [survey, setSurvey] = useState(null);
  const [options, setOptions] = useState([]);
  const [votedOption, setVotedOption] = useState(localStorage.getItem(`voted_survey_${surveyId}`));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurvey = async () => {
      const { data: s } = await supabase.from('surveys').select('*').eq('id', surveyId).single();
      const { data: opts } = await supabase.from('options').select('*').eq('survey_id', surveyId).order('id');
      if (s) setSurvey(s);
      if (opts) setOptions(opts);
      setLoading(false);
    };
    fetchSurvey();
  }, [surveyId]);

  const handleVote = async (optId) => {
    if (votedOption) return;
    
    // 楽観的UI更新
    setVotedOption(String(optId));
    localStorage.setItem(`voted_survey_${surveyId}`, String(optId));
    
    const updatedOptions = options.map(o => o.id === optId ? { ...o, votes: o.votes + 1 } : o);
    setOptions(updatedOptions);
    setSurvey(prev => ({ ...prev, total_votes: (prev.total_votes || 0) + 1 }));

    confetti({ particleCount: 100, spread: 60, origin: { y: 0.8 }, zIndex: 9999 });

    // DB反映
    await supabase.rpc('increment_survey_vote', { survey_id_arg: surveyId, option_id_arg: optId });
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>読み込み中...🐰</div>;
  if (!survey) return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>アンケートが見つかりません。</div>;

  const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);
  const maxVotes = Math.max(...options.map(o => o.votes || 0), 1);

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif', margin: 0, padding: 0, background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', flex: 1 }}>
        <h2 style={{ fontSize: '1.1rem', color: '#1e293b', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          {survey.title}
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {options.map(opt => {
            const isVoted = votedOption === String(opt.id);
            const percent = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
            const isTop = opt.votes === maxVotes && totalVotes > 0;
            
            return (
              <div 
                key={opt.id} 
                onClick={() => handleVote(opt.id)}
                style={{
                  position: 'relative',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${isVoted ? '#3b82f6' : '#e2e8f0'}`,
                  background: isVoted ? '#eff6ff' : '#f8fafc',
                  cursor: votedOption ? 'default' : 'pointer',
                  overflow: 'hidden',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                {/* 背景のパーセンテージバー */}
                {votedOption && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    width: `${percent}%`,
                    background: isTop ? '#bfdbfe' : '#e2e8f0',
                    opacity: 0.5,
                    zIndex: 0,
                    transition: 'width 0.5s ease-out'
                  }} />
                )}
                
                <span style={{ position: 'relative', zIndex: 1, fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>
                  {opt.name} {isVoted && '✅'}
                </span>
                
                {votedOption && (
                  <span style={{ position: 'relative', zIndex: 1, fontWeight: 'bold', color: isTop ? '#2563eb' : '#64748b' }}>
                    {percent}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '10px 16px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>総投票数: {totalVotes}票</span>
        <a 
          href={`${window.location.origin}/s/${surveyId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          みんアケで詳しく見る 🐰
        </a>
      </div>
    </div>
  );
};

export default EmbedView;
