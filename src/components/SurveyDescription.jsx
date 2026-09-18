import React, { useState, useRef } from 'react';
import SourcePreviewModal from './SourcePreviewModal';

const SurveyDescription = ({ description, renderCommentContent, isTimeUp, children }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentTopRef = useRef(null);

  const handleToggle = () => {
    if (isExpanded) {
      // 閉じる時は、まず本文の先頭（アンケート投票枠付近）へスクロールさせる
      contentTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setIsExpanded(!isExpanded);
  };

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

  // ⚡ 要約カード（SUMMARY）を抽出するらび！JSON形式と従来のテキスト形式の両方に対応
  const summaryTagMatch = description.match(/\[\[SUMMARY:([\s\S]*?)\]\]/);
  let summaryJson = null;
  let summaryPoints = [];
  if (summaryTagMatch) {
    const rawSummary = summaryTagMatch[1].trim();
    try {
      const parsed = JSON.parse(rawSummary);
      if (parsed && (parsed.point1_desc || parsed.point1_title)) {
        // 🛡️ 重複バグ防止: point1_descの先頭がpoint1_titleと同じ場合は削除
        if (parsed.point1_title && parsed.point1_desc && parsed.point1_desc.startsWith(parsed.point1_title)) {
          parsed.point1_desc = parsed.point1_desc.substring(parsed.point1_title.length).replace(/^[:：\s]+/, '').trim();
        }
        if (parsed.point2_title && parsed.point2_desc && parsed.point2_desc.startsWith(parsed.point2_title)) {
          parsed.point2_desc = parsed.point2_desc.substring(parsed.point2_title.length).replace(/^[:：\s]+/, '').trim();
        }

        // 🔄 point2が空の場合、本文から2つ目のポイントを自動補完
        if (!parsed.point2_desc || parsed.point2_desc.trim() === '') {
          const bodyForExtract = description
            .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')
            .replace(/\[\[SECRET_ANSWER:[\s\S]*?\]\]/g, '')
            .replace(/🐰 \*\*らびの視点：\*\*[\s\S]*?(?=\n\n|$)/, '')
            .replace(/\[続き[をに]読む\]\(https?:\/\/[^\s)]+\)/g, '')
            .replace(/[\(（]\s*出典[\s\S]*?[\)）]/g, '')
            .trim();
          const sentences = bodyForExtract
            .split(/[。！\n]+/)
            .map(s => s.trim())
            .filter(s => s.length >= 20 && !s.includes('JavaScript') && !s.includes('出典') && !s.includes('続きを読む'));
          // point1_descと重複しない2番目の文を探す
          const p2Candidate = sentences.find(s => 
            s !== parsed.point1_desc && 
            !parsed.point1_desc?.includes(s) && 
            !s.includes(parsed.point1_desc || '')
          );
          if (p2Candidate) {
            parsed.point2_title = 'ここにも注目';
            parsed.point2_desc = p2Candidate.length > 100 ? p2Candidate.substring(0, 100) + '…' : p2Candidate;
          }
        }

        summaryJson = parsed;
      }
    } catch (e) {
      // JSON形式でない場合はフォールバックとしてテキスト分割
    }

    if (!summaryJson) {
      summaryPoints = rawSummary
        .split('\n')
        .map(s => s.replace(/^[-・•]\s*/, '').replace(/^([1-9]|[\u2460-\u2468]|[①-⑨])(?![0-9])[.\s、・]?/, '').trim())
        .filter(Boolean);
    }
  }

  // 📝 らびのコメントを抽出して装飾するらび！
  const labiCommentMatch = description.match(/🐰 \*\*らびの視点：\*\*([\s\S]*?)(?=---\n|\[\[|\n\n（出典|\n\n\[続きを読む|$)/);
  let labiComment = labiCommentMatch ? labiCommentMatch[1].trim() : null;
  if (labiComment) {
    labiComment = labiComment
      .replace(/[\(（]\s*出典\s*[:：][^\)）\n]+[\)）]?/gi, '')
      .replace(/\[続き[をに]読む\]\(https?:\/\/[^\s)]+\)/g, '')
      .replace(/https?:\/\/[^\s)]+/g, '')
      .replace(/続き[をに]読む/g, '')
      .trim();
  }

  // 🧩 秘密の答え（SECRET_ANSWER）を救出するらび！
  const secretAnswerMatch = description.match(/\[\[SECRET_ANSWER:([\s\S]*?)\]\]/);
  const secretAnswer = secretAnswerMatch ? secretAnswerMatch[1].trim() : null;

  // らびのコメントを除いた後の本文（および出典元URLの抽出）
  let cleanBody = description
    .replace(/🐰 \*\*らびの視点：\*\*[\s\S]*?(?=\n\n|\r\n\r\n|$)/, '') // らびの視点文を削除
    .replace(/\[\[SECRET_ANSWER:[\s\S]*?\]\]/g, '')               // 秘密の答えを削除
    .replace(/\[\[SUMMARY:[\s\S]*?\]\]/g, '')                     // 要約タグを削除
    .replace(/\[続き[をに]読む\]\(https?:\/\/[^\s)]+\)/g, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1')        // その他のリンク形式はテキスト部分を残す
    .trim();

  // 🧹 ニュースサイト特有のナビゲーションメニュー結合ゴミ文字列およびメタ表現（出典・続きを読む等）の置換除去
  cleanBody = cleanBody
    .replace(/マイページ\s*購入履歴[\s\S]*?現在JavaScriptが無効になっています/g, '')
    .replace(/マイページ\s*購入履歴[\s\S]*?トピックス一覧/g, '')
    .replace(/(マイページ|購入履歴|トップ速報|ライブエキスパート|みんなの意見|トピックス一覧|有料主要|国内国際経済|エンタメスポーツ|IT科学|現在JavaScriptが無効)[^。！\n]{15,}/g, '')
    .replace(/[\(（]\s*出典\s*[:：][^\)）\n]+[\)）]?/gi, '')
    .replace(/続き[をに]読む/g, '')
    .trim();

  // 🧹 システム系・ナビゲーション・メタゴミテキストの除去関数（判定基準の完全強化）
  const isGarbageText = (str) => {
    if (!str) return true;
    const s = str.trim();
    return (
      s.startsWith('(出典') ||
      s.startsWith('（出典') ||
      s.includes('出典：') ||
      s.includes('出典:') ||
      s.includes('続きを読む') ||
      s === '続きを読む' ||
      s.includes('JavaScriptが無効') ||
      s.includes('マイページ購入履歴') ||
      s.includes('トップ速報ライブ') ||
      s.includes('みんなの意見') ||
      s.includes('国内国際経済') ||
      s.includes('エンタメスポーツ') ||
      s.includes('IT科学ライフ') ||
      s.includes('トピックス一覧') ||
      s.includes('ライブエキスパート') ||
      (s.includes('マイページ') && s.includes('購入履歴')) ||
      (s.includes('有料主要') && s.includes('トピックス')) ||
      s === 'JavaScriptが無効です' ||
      s === 'マイページ' ||
      s === '購入履歴' ||
      s === 'トップ速報' ||
      s === '利用規約' ||
      s === 'ヘルプ' ||
      s.includes('JavaScriptを有効にしてご覧ください')
    );
  };

  // 🧹 「飯の言葉」「肉料理」「注目ポイント」「関連情報」などの別ニュースセクションを分離
  let mainBodyOnly = cleanBody
    .split(/(?=###\s*)/)
    .filter(section => {
      return !section.match(/###\s*(💬\s*飯の言葉|📢\s*肉料理|📢\s*注目ポイント|📖\s*関連情報|関連記事|ピックアップ|おすすめ)/);
    })
    .join('\n\n')
    .split('\n')
    .filter(line => !isGarbageText(line) && line.trim().length > 0)
    .join('\n')
    .trim();

  // 本文がメタ表現削除で実質空になったか確認
  if (mainBodyOnly && mainBodyOnly.replace(/[\(（]\s*出典[\s\S]*?[\)）]/g, '').replace(/続きを読む/g, '').trim().length === 0) {
    mainBodyOnly = '';
  }

  // 🧹 既存DBの[[SUMMARY:...]]タグ内をクリーンアップ
  if (summaryPoints.length > 0) {
    summaryPoints = summaryPoints.filter(pt => !isGarbageText(pt));
  }

  // ⚡ SUMMARY タグがない（または空になった）場合はメイン本文から文単位で自動抽出して要約カードを生成するらび！
  if (summaryPoints.length === 0 && mainBodyOnly) {
    const rawSentences = mainBodyOnly
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !isGarbageText(l));

    const extracted = [];
    for (const line of rawSentences) {
      if (extracted.length >= 6) break;
      const sList = line.split(/[。！\?\n]+/).filter(s => s.trim().length >= 8);
      for (const s of sList) {
        let trimmedS = s.trim()
          .replace(/^([1-9]|[\u2460-\u2468]|[①-⑨])(?![0-9])[.\s、・]?/, '')
          .replace(/^###\s*/, '')
          .replace(/^[-・•]\s*/, '');
        if (trimmedS.length >= 8 && !isGarbageText(trimmedS) && !extracted.includes(trimmedS)) {
          extracted.push(trimmedS);
          if (extracted.length >= 6) break;
        }
      }
    }

    // 古いフォールバック処理（1〜6の箇条書き自動抽出）を無効化
    // APIがコケた場合は要約カード自体を非表示にし、画面崩れを防ぐ
    // summaryPoints = extracted;
  }

  // 🧹 不要な「【写真を見る】」などのクリック不可タグをお掃除
  const cleanUnclickableTags = (str) => {
    return str
      .replace(/【(写真を見る|動画を見る|画像あり|写真|動画|別カット|関連画像|一覧|詳細を見る|画像|フォト|関連記事)】/g, '')
      .replace(/[\(（]\s*出典\s*[:：][^\)）\n]+[\)）]?/gi, '')
      .replace(/続きを読む/g, '')
      .replace(/^([1-9]|[\u2460-\u2468]|[①-⑨])(?![0-9])[.\s、・]?/, '')
      .trim();
  };

  summaryPoints = summaryPoints
    .map(cleanUnclickableTags)
    .filter(p => !isGarbageText(p) && p.length >= 5);

  // 要約カードを表示する判定（JSONまたは要約文があれば常に表示！）
  const showSummaryCard = Boolean(summaryJson || summaryPoints.length > 0);

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
        {showSummaryCard && (
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
              alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '20px',
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
                gap: '6px', whiteSpace: 'nowrap' }}>⚡ 要約・注目ポイント</span>
              <span style={{ fontSize: '0.78rem', color: '#9333ea', fontWeight: 'bold', opacity: 0.8 }}>30秒でサクッと把握！</span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              {summaryJson ? (
                // 🎯 JSONフォーマット対応：キー指定の堅牢な描画（文章の途中切れ・パース崩れゼロ！）
                <>
                  {/* 注目ポイント1 */}
                  {summaryJson.point1_desc && (
                    <li className="summary-point-item flex flex-col md:flex-row items-start gap-2 md:gap-[14px] text-[1.02rem] text-slate-800 leading-[1.75] font-medium" style={{ marginBottom: '16px' }}>
                      <div className="summary-point-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
                          boxShadow: '0 3px 10px rgba(236, 72, 153, 0.3)'
                        }}>1</span>
                        {summaryJson.point1_title && (
                          <span style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)',
                            color: '#6b21a8',
                            fontWeight: '800',
                            padding: '1px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e9d5ff',
                            fontSize: '0.92rem'
                          }}>
                            {summaryJson.point1_title}
                          </span>
                        )}
                      </div>
                      <span className="summary-point-text" style={{ whiteSpace: "normal" }}>
                        {summaryJson.point1_desc}
                      </span>
                    </li>
                  )}

                  {/* 注目ポイント2 */}
                  {summaryJson.point2_desc && (
                    <li className="summary-point-item flex flex-col md:flex-row items-start gap-2 md:gap-[14px] text-[1.02rem] text-slate-800 leading-[1.75] font-medium" style={{ marginBottom: '16px' }}>
                      <div className="summary-point-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
                          boxShadow: '0 3px 10px rgba(236, 72, 153, 0.3)'
                        }}>2</span>
                        {summaryJson.point2_title && (
                          <span style={{
                            display: 'inline-block',
                            background: 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)',
                            color: '#6b21a8',
                            fontWeight: '800',
                            padding: '1px 10px',
                            borderRadius: '8px',
                            border: '1px solid #e9d5ff',
                            fontSize: '0.92rem'
                          }}>
                            {summaryJson.point2_title}
                          </span>
                        )}
                      </div>
                      <span className="summary-point-text" style={{ whiteSpace: "normal" }}>
                        {summaryJson.point2_desc}
                      </span>
                    </li>
                  )}

                  {/* らびのひとこと */}
                  {summaryJson.rabi_comment && (
                    <li style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '16px',
                      padding: '14px 20px',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #fdf4ff 50%, #f0fdf4 100%)',
                      border: '1.5px solid #fed7aa',
                      boxShadow: '0 4px 14px rgba(251, 146, 60, 0.10)',
                      borderRadius: '20px',
                      fontSize: '0.98rem',
                      lineHeight: '1.6'
                    }}>
                      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🐰</span>
                      <span className="flex flex-col md:block gap-1 w-full" style={{ whiteSpace: "normal" }}>
                        <strong style={{
                          background: 'linear-gradient(90deg, #ea580c, #c026d3)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: '900',
                          marginRight: '8px'
                        }}>
                          らびのひとこと：
                        </strong>
                        <span style={{ color: '#431407', fontWeight: '600' }}>{summaryJson.rabi_comment}</span>
                      </span>
                    </li>
                  )}

                  {/* 専門用語の解説（ある場合のみ） */}
                  {summaryJson.keyword_title && summaryJson.keyword_desc && (
                    <li style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginTop: '16px',
                      padding: '12px 18px',
                      background: 'linear-gradient(135deg, rgba(243, 232, 255, 0.7) 0%, rgba(253, 244, 255, 0.7) 100%)',
                      border: '1.5px dashed #c084fc',
                      borderRadius: '16px',
                      fontSize: '0.92rem',
                      color: '#4c1d95',
                      lineHeight: '1.6'
                    }}>
                      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
                      <span style={{ whiteSpace: 'normal', width: '100%', fontWeight: '600' }}>
                        <span style={{ background: '#7e22ce', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem', marginRight: '6px' }}>
                          用語
                        </span>
                        <strong style={{ color: '#581c87' }}>{summaryJson.keyword_title}</strong>
                        <span style={{ color: '#7e22ce' }}>とは： </span>
                        <span style={{ color: '#334155', fontWeight: '500' }}>{summaryJson.keyword_desc}</span>
                      </span>
                    </li>
                  )}
                </>
              ) : (
                // 🔄 従来のテキスト配列形式に対するフォールバック
                (() => {
                  let pointCounter = 0;
                  return summaryPoints.map((point, idx) => {
                    // 🐰 らびのひとこと判定
                    const isLabiThought = /らびの(ひとこと|感想|視点)[：:]/.test(point);
                    if (isLabiThought) {
                      const thoughtText = point.replace(/^.*らびの(ひとこと|感想|視点)[：:]\s*/, '').replace(/^\*\*|\*\*$/g, '');
                      return (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: '16px',
                          padding: '14px 20px',
                          background: 'linear-gradient(135deg, #fff7ed 0%, #fdf4ff 50%, #f0fdf4 100%)',
                          border: '1.5px solid #fed7aa',
                          boxShadow: '0 4px 14px rgba(251, 146, 60, 0.10)',
                          borderRadius: '20px',
                          fontSize: '0.98rem',
                          lineHeight: '1.6'
                        }}>
                          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🐰</span>
                          <span className="flex flex-col md:block gap-1 w-full" style={{ whiteSpace: "normal" }}>
                            <strong style={{
                              background: 'linear-gradient(90deg, #ea580c, #c026d3)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              fontWeight: '900',
                              marginRight: '8px'
                            }}>
                              らびのひとこと：
                            </strong>
                            <span style={{ color: '#431407', fontWeight: '600' }}>{thoughtText}</span>
                          </span>
                        </li>
                      );
                    }

                    // 💡 用語解説（「〜とは：」を含む場合）の判定
                    const isGlossary = /とは[：:]/.test(point) || point.startsWith('💡');
                    if (isGlossary) {
                      const cleanGlossary = point.replace(/^💡\s*/, '').replace(/^\*\*|\*\*$/g, '');
                      const glossaryParts = cleanGlossary.split(/(とは[：:])/);
                      return (
                        <li key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginTop: '16px',
                          padding: '12px 18px',
                          background: 'linear-gradient(135deg, rgba(243, 232, 255, 0.7) 0%, rgba(253, 244, 255, 0.7) 100%)',
                          border: '1.5px dashed #c084fc',
                          borderRadius: '16px',
                          fontSize: '0.92rem',
                          color: '#4c1d95',
                          lineHeight: '1.6'
                        }}>
                          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>💡</span>
                          <span style={{ whiteSpace: 'normal', width: '100%', fontWeight: '600' }}>
                            {glossaryParts.length >= 3 ? (
                              <>
                                <span style={{ background: '#7e22ce', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.85rem', marginRight: '6px' }}>
                                  用語
                                </span>
                                <strong style={{ color: '#581c87' }}>{glossaryParts[0].replace(/\*\*/g, '')}</strong>
                                <span style={{ color: '#7e22ce' }}>{glossaryParts[1]} </span>
                                <span style={{ color: '#334155', fontWeight: '500' }}>{glossaryParts.slice(2).join('')}</span>
                              </>
                            ) : (
                              cleanGlossary
                            )}
                          </span>
                        </li>
                      );
                    }

                    // 通常の要約箇条書き
                    pointCounter++;
                    const currentNum = pointCounter;
                    const headingMatch = point.match(/^(?:\*\*)?[\[【]([^\]】]+)[\]】](?:\*\*)?[：:]\s*(.*)$/);
                    const headingText = headingMatch ? headingMatch[1].replace(/\*\*/g, '') : null;
                    const bodyText = headingMatch ? headingMatch[2] : point;
                    const parts = bodyText.split(/(「[^」]+」|【[^】]+】|\b\d+[月日万億円個件台%]?\b)/g);

                    return (
                      <li key={idx} className="flex flex-col md:flex-row items-start gap-2 md:gap-[14px] text-[1.02rem] text-slate-800 leading-[1.75] font-medium" style={{ marginBottom: idx < summaryPoints.length - 1 ? '16px' : '0' }}>
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
                        }}>{currentNum}</span>
                        <span className="flex flex-col md:block gap-1 w-full" style={{ whiteSpace: "normal" }}>
                          {headingText && (
                            <span className="block w-fit md:inline-block" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)',
                              color: '#6b21a8',
                              fontWeight: '800',
                              padding: '1px 10px',
                              borderRadius: '8px',
                              border: '1px solid #e9d5ff',
                              marginRight: '8px', marginBottom: '4px',
                              fontSize: '0.92rem'
                            }}>
                              {headingText}
                            </span>
                          )}
                          {parts.map((part, pIdx) => {
                            const isQuote = part.startsWith('「') || part.startsWith('【');
                            const isNumber = /^\d+[月日万億円個ckg%]?$/i.test(part);
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
                  });
                })()
              )}
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
              <span>らびのコメント</span>
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

        {/* 🗳️ 投票コンポーネント（AI要約・らびのひとことの直下に配置！） */}
        <div ref={contentTopRef}>
          {children}
        </div>

        {/* 本文 💡 (簡易マークダウンパースで見出しと段落をオシャレに装飾) */}
        {mainBodyOnly && (
          <div className="max-w-2xl mx-auto" style={{
            position: 'relative',
            zIndex: 1,
            marginBottom: displayLink ? '16px' : '0',
            color: '#334155',
            maxWidth: '42rem',
            margin: displayLink ? '0 auto 16px auto' : '0 auto'
          }}>
            <div style={{
              maxHeight: isExpanded ? 'none' : '250px',
              overflow: 'hidden',
              position: 'relative',
              transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              {(() => {
                // 改行コードで段落分割: 空行を除外して描画
                const lines = mainBodyOnly.split('\n');
                return lines.map((line, idx) => {
                  let trimmed = line.trim();
                  if (!trimmed) return null;

                  // 不要な「【写真を見る】」などのクリックできないリンクタグとお掃除プレフィックスを除去するらび！
                  trimmed = trimmed
                    .replace(/【(写真を見る|動画を見る|画像あり|写真|動画|別カット|関連画像|一覧|詳細を見る|画像|フォト|関連記事)】/g, '')
                    .replace(/^([1-9]|[\u2460-\u2468]|[①-⑨])(?![0-9])[.\s、・]?/, '')
                    .trim();

                  if (!trimmed) return null;

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
                    <p key={idx} className="desc-paragraph mb-4 leading-relaxed text-slate-700" style={{
                      margin: '0 0 16px 0',
                      lineHeight: '1.85',
                      fontSize: '1.05rem',
                      color: '#334155',
                      textAlign: 'justify',
                      letterSpacing: '0.03em',
                      wordBreak: 'break-word'
                    }}>
                      {trimmed}
                    </p>
                  );
                }).filter(Boolean);
              })()}

              {!isExpanded && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '150px',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 90%)',
                  pointerEvents: 'none'
                }} />
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '10px', marginBottom: '20px' }}>
              <button 
                onClick={handleToggle}
                style={{
                  background: '#f8fafc',
                  border: '2px solid #cbd5e1',
                  borderRadius: '24px',
                  padding: '12px 32px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#475569',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {isExpanded ? '閉じる ▲' : '記事の続きを読む ▼'}
              </button>
            </div>
          </div>
        )}

        {!mainBodyOnly && !summaryJson && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.95rem' }}>
            📝 このアンケートの本文説明は以上です。
          </div>
        )}

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
