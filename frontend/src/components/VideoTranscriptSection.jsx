import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, Music, Clock, Copy, Check } from 'lucide-react';
import { api } from '../services/api';

/**
 * VideoTranscriptSection
 * Expandable, accessible transcript viewer positioned directly below the lesson video.
 * Adheres strictly to the portal's design language, typography, and accessibility guidelines.
 */
export default function VideoTranscriptSection({ videoId = 5, stageId = 3, autoLoad = true }) {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      const res = await api.getVideoTranscript(stageId, videoId);
      if (res && res.success && res.transcript) {
        setTranscript(res.transcript);
      } else {
        setTranscript(null);
      }
    } catch (err) {
      console.warn('[VideoTranscriptSection] Could not load transcript:', err.message);
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      fetchTranscript();
    }
  }, [videoId, stageId, autoLoad]);

  // If no transcript exists, do not render an empty container
  if (!loading && !transcript) {
    return null;
  }

  const handleToggle = () => {
    if (!isExpanded && !transcript && !loading) {
      fetchTranscript();
    }
    setIsExpanded(prev => !prev);
  };

  const handleCopy = () => {
    if (!transcript?.transcript_content) return;
    navigator.clipboard.writeText(transcript.transcript_content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasNoSpokenDialogue = transcript?.has_spoken_dialogue === 0;

  // Markdown, Timestamp, and Section Parser
  const renderFormattedTranscript = (content) => {
    if (!content) return null;

    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const elements = [];
    let currentList = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} style={{ margin: '8px 0 16px 20px', padding: 0, color: '#374151' }}>
            {currentList.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 6, lineHeight: 1.6, fontSize: '0.94rem' }}>
                {parseInlineFormatting(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        return;
      }

      // Explicit Markdown Headings (###, ##, #)
      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4
            key={`h3-${index}`}
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#1E1B4B',
              margin: '22px 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {trimmed.replace(/^###\s+/, '')}
          </h4>
        );
      } else if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h3
            key={`h2-${index}`}
            style={{
              fontSize: '1.18rem',
              fontWeight: 800,
              color: '#1E1B4B',
              margin: '24px 0 10px 0'
            }}
          >
            {trimmed.replace(/^#+\s+/, '')}
          </h3>
        );
      }
      // Section Titles in All-Caps (e.g. "THE SCIENCE OF BREATHING", "INHALE & EXHALE")
      else if (
        /^[A-Z0-9\s&"—:"]{4,50}$/.test(trimmed) &&
        !trimmed.startsWith('[') &&
        !trimmed.includes('.') &&
        trimmed.length < 50
      ) {
        flushList();
        elements.push(
          <h4
            key={`sec-${index}`}
            style={{
              fontSize: '1.02rem',
              fontWeight: 800,
              color: '#4C1D95',
              letterSpacing: '0.02em',
              margin: '20px 0 8px 0',
              paddingBottom: 4,
              borderBottom: '1px solid #F3E8FF'
            }}
          >
            {trimmed}
          </h4>
        );
      }
      // List items (- or *)
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentList.push(trimmed.replace(/^[-*]\s+/, ''));
      }
      // Standard Paragraph
      else {
        flushList();
        elements.push(
          <p
            key={`p-${index}`}
            style={{
              margin: '0 0 10px 0',
              fontSize: '0.94rem',
              lineHeight: 1.68,
              color: '#334155'
            }}
          >
            {parseInlineFormatting(trimmed)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  // Parses [00:00] timestamps, **bold** text, and bracketed notes
  const parseInlineFormatting = (text) => {
    // Regex matches timestamps [MM:SS], bold **text**, and bracketed notes [Note]
    const tokens = text.split(/(\[\d{1,2}:\d{2}\]|\*\*.*?\*\*|\[.*?\])/g);

    return tokens.map((token, i) => {
      if (/^\[\d{1,2}:\d{2}\]$/.test(token)) {
        return (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontWeight: 700,
              fontSize: '0.82rem',
              color: '#6D28D9',
              background: '#EDE9FE',
              padding: '2px 7px',
              borderRadius: 6,
              marginRight: 6,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
              userSelect: 'none'
            }}
          >
            <Clock size={11} />
            {token.replace(/[[\]]/g, '')}
          </span>
        );
      }
      if (token.startsWith('**') && token.endsWith('**')) {
        return (
          <strong key={i} style={{ fontWeight: 700, color: '#0F172A' }}>
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('[') && token.endsWith(']')) {
        return (
          <span
            key={i}
            style={{
              color: '#6B7280',
              fontStyle: 'italic',
              background: '#F8FAFC',
              padding: '1px 5px',
              borderRadius: 4,
              fontSize: '0.9em'
            }}
          >
            {token}
          </span>
        );
      }
      return token;
    });
  };

  return (
    <div
      style={{
        marginTop: 18,
        background: '#FAF8FC',
        borderRadius: 14,
        border: '1px solid #E8E3F2',
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}
      aria-label="Video Transcript Section"
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          background: '#FFFFFF',
          borderBottom: isExpanded ? '1px solid #ECE7F5' : 'none',
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              flexShrink: 0
            }}
          >
            <FileText size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h4
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#191B35',
                  letterSpacing: '-0.01em'
                }}
              >
                Video Transcript
              </h4>
              {hasNoSpokenDialogue && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#9333EA',
                    background: '#F3E8FF',
                    padding: '3px 8px',
                    borderRadius: 9999
                  }}
                >
                  <Music size={11} /> Instrumental / Demonstration
                </span>
              )}
            </div>
            <p
              style={{
                margin: '3px 0 0 0',
                fontSize: '0.84rem',
                color: '#6B7280',
                lineHeight: 1.4
              }}
            >
              Read along to understand the lesson more clearly.
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          aria-controls="video-transcript-content"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 16px',
            fontSize: '0.86rem',
            fontWeight: 700,
            borderRadius: 8,
            border: '1px solid #DDD6FE',
            background: isExpanded ? '#EDE9FE' : '#FFFFFF',
            color: '#6D28D9',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            flexShrink: 0,
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#EDE9FE';
            e.currentTarget.style.borderColor = '#C4B5FD';
          }}
          onMouseLeave={(e) => {
            if (!isExpanded) {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.borderColor = '#DDD6FE';
            }
          }}
        >
          {isExpanded ? (
            <>
              Hide Transcript <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show Transcript <ChevronDown size={16} />
            </>
          )}
        </button>
      </div>

      {/* Expandable Content Area */}
      {isExpanded && (
        <div
          id="video-transcript-content"
          role="region"
          aria-label="Video transcript text"
          style={{
            padding: '20px 24px',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {/* Instrumental / No spoken dialogue notification badge */}
          {hasNoSpokenDialogue && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#FAF5FF',
                border: '1px solid #E9D5FF',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 16,
                color: '#6B21A8',
                fontSize: '0.88rem'
              }}
            >
              <Music size={18} style={{ flexShrink: 0, color: '#9333EA' }} />
              <div>
                <strong>[♪ Instrumental / Demonstration video with no spoken dialogue]</strong>
                <div style={{ fontSize: '0.82rem', color: '#7E22CE', marginTop: 2 }}>
                  The notes below outline the key physiological movements and breathing instructions demonstrated in this lesson.
                </div>
              </div>
            </div>
          )}

          {/* Transcript Content Container */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #EAE5F3',
              padding: '20px 24px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            {renderFormattedTranscript(transcript?.transcript_content)}
          </div>

          {/* Footer toolbar: Copy & metadata */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              paddingTop: 10,
              fontSize: '0.78rem',
              color: '#8B88A0',
              flexWrap: 'wrap',
              gap: 10
            }}
          >
            <span>
              Language: <strong>{transcript?.language?.toUpperCase() || 'EN'}</strong> · Status:{' '}
              <span style={{ color: '#059669', fontWeight: 700 }}>Published</span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: copied ? '#059669' : '#6D28D9',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '4px 8px',
                borderRadius: 6
              }}
              title="Copy transcript text"
            >
              {copied ? (
                <>
                  <Check size={13} /> Copied to clipboard
                </>
              ) : (
                <>
                  <Copy size={13} /> Copy Transcript
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
