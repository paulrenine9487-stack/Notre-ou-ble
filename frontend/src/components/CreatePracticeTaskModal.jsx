import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Plus, BookOpen, AlertCircle, Loader2 } from 'lucide-react';

export default function CreatePracticeTaskModal({ isOpen, onClose, onTaskCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [stages, setStages] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setSelectedStageId('');
      setErrorMsg('');

      // Load stages for linking
      api.getModuleStages(1)
        .then(res => {
          if (res.success && res.stages) {
            setStages(res.stages);
          }
        })
        .catch(err => console.error('Failed to load stages for modal:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a task title.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const stageObj = stages.find(s => s.id === parseInt(selectedStageId, 10));
      const firstTask = stageObj?.tasks?.[0];

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate || null,
        learning_module_id: stageObj ? 1 : null,
        learning_stage_id: stageObj ? stageObj.id : null,
        learning_task_id: firstTask ? firstTask.id : null
      };

      const res = await api.createDiaryTask(payload);
      if (res.success) {
        if (onTaskCreated) onTaskCreated(res.task);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to create task.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error while creating task.');
    } finally {
      setSubmitting(false);
    }
  };

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
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
        border: '1px solid #EAE5F3'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
            Add Task to Practice Diary
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#77728A', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '0.8rem',
            marginBottom: '14px'
          }}>
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="journal-form-group">
            <label className="journal-form-label">
              Task Title <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="journal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Practise SSS airflow exercise with sustained exhalation"
            />
          </div>

          {/* Description */}
          <div className="journal-form-group">
            <label className="journal-form-label">Description (Optional)</label>
            <textarea
              className="journal-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key practice instructions or focus areas..."
              style={{ minHeight: '80px' }}
            />
          </div>

          {/* Priority & Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label className="journal-form-label">Priority</label>
              <select
                className="journal-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="journal-form-label">Target Due Date</label>
              <input
                type="date"
                className="journal-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Link to Learning Stage */}
          <div className="journal-form-group">
            <label className="journal-form-label">
              Link to Learning Stage (Optional)
            </label>
            <select
              className="journal-select"
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
            >
              <option value="">-- No linked learning stage --</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  Stage {st.stage_number.toString().padStart(2, '0')}: {st.stage_title}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE5F3',
                color: '#77728A',
                fontSize: '0.82rem',
                fontWeight: 650,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="dash-btn-primary"
              style={{ padding: '8px 20px', fontSize: '0.82rem' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="spin-animate" />
                  <span>Adding Task...</span>
                </>
              ) : (
                <>
                  <Plus size={15} />
                  <span>Add to TO DO</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
