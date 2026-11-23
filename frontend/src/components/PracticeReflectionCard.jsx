import React, { useState } from 'react';
import { Clock, Calendar, Edit2, Trash2, BookOpen, Check, X } from 'lucide-react';

export default function PracticeReflectionCard({ reflection, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reflection.reflection);
  const [editDuration, setEditDuration] = useState(reflection.duration_minutes.toString());
  const [editType, setEditType] = useState(reflection.practice_type);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const formattedDate = new Date(reflection.practice_date || reflection.created_at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(reflection.practice_date || reflection.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    try {
      setSaving(true);
      await onUpdate(reflection.id, {
        practice_type: editType,
        duration_minutes: parseInt(editDuration, 10),
        reflection: editText.trim()
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await onDelete(reflection.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="reflection-item-card">
      {!isEditing ? (
        <>
          <div className="reflection-header">
            <div className="reflection-type-tag">
              <span>{reflection.practice_type}</span>
              <span className="reflection-duration-pill">{reflection.duration_minutes} min</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                title="Edit Reflection"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#77728A',
                  cursor: 'pointer',
                  padding: '3px'
                }}
              >
                <Edit2 size={13} />
              </button>

              <button
                type="button"
                onClick={() => setIsDeleting(true)}
                title="Delete Reflection"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#991B1B',
                  cursor: 'pointer',
                  padding: '3px'
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="reflection-date-row">
            <Calendar size={12} />
            <span>{formattedDate} · {formattedTime}</span>
          </div>

          <p className="reflection-text-body">{reflection.reflection}</p>

          {reflection.task_title && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '8px',
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: '#F4F0FF',
              fontSize: '0.72rem',
              color: '#191B35',
              fontWeight: 650
            }}>
              <BookOpen size={11} color="#7C3AED" />
              <span>Linked to: Stage {reflection.stage_number || '1'} · {reflection.task_title}</span>
            </div>
          )}

          {/* Delete Confirmation Overlay */}
          {isDeleting && (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span style={{ fontSize: '0.76rem', color: '#991B1B', fontWeight: 650 }}>
                Delete this practice reflection?
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleting(false)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAE5F3',
                    color: '#77728A',
                    fontSize: '0.72rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Edit Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="journal-select"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="SSS airflow exercise">SSS airflow exercise</option>
              <option value="Breath planning in a song">Breath planning in a song</option>
              <option value="Vocal warm-up">Vocal warm-up</option>
              <option value="Other vocal practice">Other vocal practice</option>
            </select>
            <select
              className="journal-select"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              style={{ width: '120px', padding: '6px 10px', fontSize: '0.8rem' }}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
            </select>
          </div>

          <textarea
            className="journal-textarea"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{ fontSize: '0.82rem', padding: '8px 10px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={saving}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE5F3',
                color: '#77728A',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
