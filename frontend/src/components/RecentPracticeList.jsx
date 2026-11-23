import React, { useState } from 'react';
import PracticeReflectionCard from './PracticeReflectionCard';
import { BookOpen, Sparkles, ChevronDown } from 'lucide-react';

export default function RecentPracticeList({ reflections, onUpdate, onDelete, loading }) {
  const [visibleCount, setVisibleCount] = useState(5);

  const displayedReflections = reflections.slice(0, visibleCount);
  const hasMore = reflections.length > visibleCount;

  return (
    <div className="journal-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="journal-card-title" style={{ margin: 0 }}>Your recent practice</h2>
        <span style={{ fontSize: '0.76rem', color: '#77728A', fontWeight: 650 }}>
          {reflections.length} reflection{reflections.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ width: '100%', height: '80px', borderRadius: '12px' }} />
        </div>
      ) : reflections.length === 0 ? (
        /* Empty State (Follows Reference Images) */
        <div style={{
          padding: '36px 20px',
          textAlign: 'center',
          backgroundColor: '#FAFCFA',
          borderRadius: '12px',
          border: '1px dashed #EAE5F3'
        }}>
          <Sparkles size={28} color="#9690A7" style={{ marginBottom: '12px', opacity: 0.8 }} />
          <p style={{
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#191B35',
            margin: '0 0 6px 0'
          }}>
            Your practice reflections will appear here once you save a session.
          </p>
          <p style={{
            fontSize: '0.8rem',
            color: '#77728A',
            margin: 0,
            lineHeight: 1.45,
            maxWidth: '380px',
            display: 'inline-block'
          }}>
            Try to focus on consistency and comfort rather than pushing for longer practice times.
          </p>
        </div>
      ) : (
        /* Reflections List */
        <div>
          <div className="recent-reflections-container">
            {displayedReflections.map((ref) => (
              <PracticeReflectionCard
                key={ref.id}
                reflection={ref}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + 5)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EAE5F3',
                  color: '#191B35',
                  fontSize: '0.78rem',
                  fontWeight: 650,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>View More</span>
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
