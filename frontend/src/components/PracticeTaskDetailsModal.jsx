import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  History,
  AlertCircle,
  Save
} from 'lucide-react';

export default function PracticeTaskDetailsModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onMoveStatus
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editDueDate, setEditDueDate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen || !task) return null;

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority || 'MEDIUM');
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      setSaving(true);
      await onUpdate(task.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || null,
        priority: editPriority,
        due_date: editDueDate || null
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
      await onDelete(task.id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedCreated = new Date(task.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedStarted = task.started_at ? new Date(task.started_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  const formattedCompleted = task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(25, 27, 53, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
        border: '1px solid #EAE5F3'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`priority-tag ${task.priority ? task.priority.toLowerCase() : 'medium'}`}>
              {task.priority || 'MEDIUM'}
            </span>
            <span style={{
              fontSize: '0.74rem',
              fontWeight: 750,
              backgroundColor: '#F4F0FF',
              color: '#191B35',
              padding: '2px 8px',
              borderRadius: '9999px'
            }}>
              {task.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={{ background: 'transparent', border: 'none', color: '#77728A', cursor: 'pointer', padding: '4px' }}
                  title="Edit Task"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '4px' }}
                  title="Delete Task"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#77728A', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {isDeleting && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 14px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <span style={{ fontSize: '0.82rem', color: '#991B1B', fontWeight: 650 }}>
              Are you sure you want to delete this diary task?
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EAE5F3',
                  color: '#77728A',
                  fontSize: '0.76rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content Mode vs Edit Mode */}
        {!isEditing ? (
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#191B35', margin: '0 0 10px 0', lineHeight: 1.35 }}>
              {task.title}
            </h3>

            {task.description && (
              <p style={{ fontSize: '0.86rem', color: '#4A635E', lineHeight: 1.6, margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>
            )}

            {/* Linked learning stage */}
            {(task.stage_title || task.learning_task_id) && (
              <div style={{
                backgroundColor: '#F8FAF8',
                border: '1px solid #EAE5F3',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <BookOpen size={16} color="#7C3AED" />
                <div style={{ fontSize: '0.8rem', color: '#191B35' }}>
                  <strong>Linked Learning Stage:</strong> Stage {task.stage_number || '1'} – {task.stage_title || task.task_title || 'Breath Management'}
                </div>
              </div>
            )}

            {/* Dates info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#FAFCFA',
              borderRadius: '10px',
              border: '1px solid #EAE5F3',
              fontSize: '0.75rem',
              color: '#77728A',
              marginBottom: '20px'
            }}>
              <div>
                <span style={{ display: 'block', fontWeight: 650, color: '#191B35' }}>Created</span>
                <span>{formattedCreated}</span>
              </div>
              {formattedStarted && (
                <div>
                  <span style={{ display: 'block', fontWeight: 650, color: '#191B35' }}>Started (Doing)</span>
                  <span>{formattedStarted}</span>
                </div>
              )}
              {formattedCompleted && (
                <div>
                  <span style={{ display: 'block', fontWeight: 650, color: '#191B35' }}>Completed (Done)</span>
                  <span style={{ color: '#15966A', fontWeight: 600 }}>{formattedCompleted}</span>
                </div>
              )}
            </div>

            {/* Status Change Buttons */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                Move Task Status:
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['TODO', 'DOING', 'DONE'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    disabled={task.status === st}
                    onClick={() => onMoveStatus(task.id, st)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: task.status === st ? '1.5px solid #7C3AED' : '1px solid #EAE5F3',
                      backgroundColor: task.status === st ? '#F4F0FF' : '#FFFFFF',
                      color: task.status === st ? '#191B35' : '#77728A',
                      fontWeight: task.status === st ? 750 : 550,
                      fontSize: '0.76rem',
                      cursor: task.status === st ? 'default' : 'pointer'
                    }}
                  >
                    {st === 'TODO' ? 'To Do' : (st === 'DOING' ? 'Doing' : 'Done')}
                  </button>
                ))}
              </div>
            </div>

            {/* Status History */}
            {task.history && task.history.length > 0 && (
              <div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  <History size={13} color="#7C3AED" />
                  <span>Activity History</span>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {task.history.map((h, i) => (
                    <div key={i} style={{ fontSize: '0.74rem', color: '#77728A', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{h.notes || `Moved to ${h.new_status}`}</span>
                      <span>{new Date(h.changed_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Edit Form */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="journal-form-group">
              <label className="journal-form-label">Task Title</label>
              <input
                type="text"
                className="journal-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>

            <div className="journal-form-group">
              <label className="journal-form-label">Description</label>
              <textarea
                className="journal-textarea"
                rows={4}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="journal-form-label">Priority</label>
                <select
                  className="journal-select"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="journal-form-label">Due Date</label>
                <input
                  type="date"
                  className="journal-input"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EAE5F3',
                  color: '#77728A',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="dash-btn-primary"
                style={{ padding: '7px 18px', fontSize: '0.8rem' }}
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
