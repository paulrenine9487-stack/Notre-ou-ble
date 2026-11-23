import React from 'react';
import { Sparkles } from 'lucide-react';

export default function PracticeJournalHeader() {
  return (
    <div className="journal-header-wrap">
      <div>
        <div style={{
          fontSize: '0.72rem',
          fontWeight: 750,
          color: '#7C3AED',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '4px'
        }}>
          YOUR PERSONAL PRACTICE SPACE
        </div>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          color: '#191B35',
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em'
        }}>
          Practice journal
        </h1>
        <p style={{
          fontSize: '0.88rem',
          color: '#77728A',
          margin: 0,
          maxWidth: '620px',
          lineHeight: 1.5
        }}>
          Notice what you worked on, what felt different, and what you want to try next time.
        </p>
      </div>

      <div>
        <span className="journal-badge-reflection">
          <Sparkles size={14} color="#7C3AED" />
          <span>A SPACE FOR REFLECTION</span>
        </span>
      </div>
    </div>
  );
}
