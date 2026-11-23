import React, { useState } from 'react';
import { api } from '../services/api';
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';

export default function PracticeReflectionForm({ onReflectionSaved }) {
  const [practiceType, setPracticeType] = useState('SSS airflow exercise');
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const practiceTypeOptions = [
    'SSS airflow exercise',
    'Breath planning in a song',
    'Vocal warm-up',
    'Other vocal practice'
  ];

  const durationOptions = [
    { label: '5 minutes', value: '5' },
    { label: '10 minutes', value: '10' },
    { label: '15 minutes', value: '15' },
    { label: '20 minutes', value: '20' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!practiceType) {
      setErrorMsg('Please select what you practised.');
      return;
    }

    if (!durationMinutes) {
      setErrorMsg('Please select how long you practised.');
      return;
    }

    if (!reflection.trim()) {
      setErrorMsg('Please write your practice reflection before saving.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.createPracticeReflection({
        practice_type: practiceType,
        duration_minutes: parseInt(durationMinutes, 10),
        reflection: reflection.trim()
      });

      if (res.success) {
        setSuccessMsg(`Practice reflection saved! +${durationMinutes} minutes added to your practice journal & weekly stats.`);
        setReflection('');
        if (onReflectionSaved) {
          onReflectionSaved(res.reflection);
        }
      } else {
        setErrorMsg(res.message || 'Failed to save practice reflection.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Network error while saving practice reflection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="journal-card">
      <h2 className="journal-card-title">Log a practice session</h2>

      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '10px',
          color: '#991B1B',
          fontSize: '0.82rem',
          marginBottom: '16px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          borderRadius: '10px',
          color: '#166534',
          fontSize: '0.82rem',
          marginBottom: '16px',
          fontWeight: 600
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Field 1: What did you practise? */}
        <div className="journal-form-group">
          <label className="journal-form-label" htmlFor="practice-type-select">
            What did you practise?
          </label>
          <select
            id="practice-type-select"
            className="journal-select"
            value={practiceType}
            onChange={(e) => setPracticeType(e.target.value)}
          >
            {practiceTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Field 2: How long did you practise? */}
        <div className="journal-form-group">
          <label className="journal-form-label" htmlFor="practice-duration-select">
            How long did you practise?
          </label>
          <select
            id="practice-duration-select"
            className="journal-select"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          >
            {durationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Field 3: Practice reflection */}
        <div className="journal-form-group">
          <label className="journal-form-label" htmlFor="practice-reflection-textarea">
            Practice reflection
          </label>
          <textarea
            id="practice-reflection-textarea"
            className="journal-textarea"
            rows={5}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="For example: I found it easier to keep the airflow steady when I relaxed my shoulders..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="dash-btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: '0.88rem' }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="spin-animate" />
              <span>Saving Reflection...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>SAVE PRACTICE REFLECTION</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
