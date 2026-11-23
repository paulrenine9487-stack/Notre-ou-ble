import React, { useState } from 'react';
import { api } from '../services/api';
import AudioRecorderUploader from './AudioRecorderUploader';
import PacedBreathingGuide from './PacedBreathingGuide';
import {
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  FileText,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Music,
  Send,
  Loader2,
  ChevronDown,
  Sparkles,
  CalendarPlus
} from 'lucide-react';

export default function TaskRunner({ task, onTaskUpdated }) {
  const [submitting, setSubmitting] = useState(false);
  const [addingToDiary, setAddingToDiary] = useState(false);
  const [diaryAdded, setDiaryAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Written response state
  const [writtenResponse, setWrittenResponse] = useState('');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({
    q1: '',
    q2: '',
    q3: '',
    q4: ''
  });

  // Timed practice state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerIntervalState] = useState(null);

  // Song phrase mapping state for Stage 08
  const [phrases, setPhrases] = useState([
    {
      phraseNumber: 1,
      lyrics: "Take my hand, we'll walk through the night",
      inhalePoint: "Before 'Take' (Deep 360° diaphragmatic inhale, 2s)",
      exhaleGuidance: "Even airflow through 'night', steady abdominal support"
    },
    {
      phraseNumber: 2,
      lyrics: "Stars are shining clear and bright",
      inhalePoint: "Quick catch breath after 'night' (ribs stay suspended)",
      exhaleGuidance: "Decrescendo on 'bright' with soft appoggio release"
    }
  ]);

  const assessment = task.assessment_status ? {
    status: task.assessment_status,
    marksAwarded: task.marks_awarded,
    maximumMarks: task.maximum_marks,
    percentage: task.score_percentage,
    feedback: task.feedback,
    improvementSuggestions: task.improvement_suggestions,
    assessedAt: task.assessed_at
  } : null;

  const isAssessed = task.assessment_status === 'ASSESSED' || task.assessment_status === 'COMPLETED';
  const isAwaitingReview = task.assessment_status === 'AWAITING_REVIEW';
  const needsRevision = task.assessment_status === 'NEEDS_REVISION';
  const isSubmitted = task.assignment_status === 'SUBMITTED' || isAwaitingReview;

  // Handle Reading Task Completion
  const handleCompleteReading = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.submitTask(task.id, {
        submission_type: 'reading',
        text_response: 'Completed pedagogical reading and verified concept mechanics.'
      });
      setSuccessMsg('Reading verified! Stage progress updated.');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete reading task.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Quiz Submission
  const handleSubmitQuiz = async () => {
    if (!quizAnswers.q1 || !quizAnswers.q2 || !quizAnswers.q3) {
      setErrorMsg('Please select an answer for all diagnostic questions before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.submitTask(task.id, {
        submission_type: 'quiz',
        quiz_answers: quizAnswers,
        text_response: `Diagnostic quiz submitted: Q1=${quizAnswers.q1}, Q2=${quizAnswers.q2}, Q3=${quizAnswers.q3}`
      });
      setSuccessMsg('Diagnostic quiz successfully submitted and logged!');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Written Submission
  const handleSubmitWritten = async () => {
    if (!writtenResponse.trim() || writtenResponse.trim().length < 20) {
      setErrorMsg('Please provide a thoughtful response (minimum 20 characters) before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.submitTask(task.id, {
        submission_type: 'text',
        text_response: writtenResponse.trim()
      });
      setSuccessMsg('Written response submitted for teacher evaluation!');
      setWrittenResponse('');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit written response.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Breathing Drill Complete
  const handleCompleteBreathingDrill = async (durationSec, cycles) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      await api.submitTask(task.id, {
        submission_type: 'breathing_exercise',
        duration_seconds: durationSec,
        text_response: `Completed ${cycles} full cycles of paced diaphragmatic breathing drill (${durationSec} seconds).`
      });

      // Also log to practice sessions
      await api.completePracticeSession({
        session_type: 'Guided Breathwork',
        exercise_name: task.task_title,
        duration_minutes: Math.max(1, Math.round(durationSec / 60)),
        notes: `Guided 360° Diaphragmatic Breathwork - ${cycles} cycles completed.`
      });

      setSuccessMsg(`Breathing drill recorded! +${Math.round(durationSec / 60)} min logged to your practice journal.`);
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log breathing drill.');
    } finally {
      setSubmitting(false);
    }
  };

  // Timed Practice Timer Handlers
  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerInterval);
      setTimerRunning(false);
    } else {
      const interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
      setTimerIntervalState(interval);
      setTimerRunning(true);
    }
  };

  const resetTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerRunning(false);
    setTimerSeconds(0);
  };

  const handleFinishTimedPractice = async () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimerRunning(false);

    try {
      setSubmitting(true);
      setErrorMsg('');
      const durationMins = Math.max(1, Math.round(timerSeconds / 60));

      await api.submitTask(task.id, {
        submission_type: 'timed_practice',
        duration_seconds: timerSeconds,
        text_response: `Completed timed respiratory endurance drill for ${timerSeconds} seconds.`
      });

      // Save to practice journal
      await api.completePracticeSession({
        session_type: 'Endurance Drill',
        exercise_name: task.task_title,
        duration_minutes: durationMins,
        notes: `Stage 06 Timed Respiratory Drill (${timerSeconds}s active practice)`
      });

      setSuccessMsg(`Practice session saved! ${durationMins} minutes added to weekly goal.`);
      resetTimer();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save timed drill.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Audio Upload / Submission for Stage 08
  const handleAudioSubmitted = async (formData) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      formData.append('metadata', JSON.stringify({ phrases }));
      await api.uploadTaskAudio(task.id, formData);
      setSuccessMsg('Audio submission uploaded successfully! Awaiting teacher grading.');
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload audio recording.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddToDiary = async () => {
    try {
      setAddingToDiary(true);
      setErrorMsg('');
      const res = await api.createDiaryTaskFromLearning({
        learning_task_id: task.id,
        priority: 'HIGH'
      });
      if (res.success) {
        setDiaryAdded(true);
        setSuccessMsg(res.alreadyExists
          ? 'This learning task is already present in your Practice Diary.'
          : 'Task added to your Personal Practice Diary (TO DO column)!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add task to Practice Diary.');
    } finally {
      setAddingToDiary(false);
    }
  };

  return (
    <div className="task-workspace-card">
      {/* Header Row */}
      <div className="task-header-row">
        <div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 750,
            color: '#7C3AED',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'block',
            marginBottom: '3px'
          }}>
            Assigned Task
          </span>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 750, color: '#191B35', margin: 0 }}>
            {task.task_title}
          </h4>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleAddToDiary}
            disabled={addingToDiary || diaryAdded}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: diaryAdded ? '#F4F0FF' : '#FFFFFF',
              border: '1px solid #7C3AED',
              color: '#191B35',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: diaryAdded ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CalendarPlus size={13} color="#7C3AED" />
            <span>{diaryAdded ? 'IN PRACTICE DIARY' : 'ADD TO MY PRACTICE DIARY'}</span>
          </button>

          <span className="task-marks-tag">
            <Award size={13} />
            <span>Max Score: {task.maximum_marks} marks</span>
          </span>
          {task.time_limit_minutes && (
            <span className="task-marks-tag" style={{ backgroundColor: '#F8F7FC' }}>
              <Clock size={13} />
              <span>Est: {task.time_limit_minutes} min</span>
            </span>
          )}
        </div>
      </div>

      {/* Task Description & Instructions */}
      <div style={{
        fontSize: '0.84rem',
        color: '#4A635E',
        lineHeight: 1.5,
        marginBottom: '16px',
        padding: '12px 14px',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        border: '1px solid #EAE5F3'
      }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: 650, color: '#191B35' }}>Instructions:</p>
        <p style={{ margin: 0 }}>{task.task_instructions || task.task_description}</p>
      </div>

      {/* Messages */}
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
          marginBottom: '14px'
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
          marginBottom: '14px'
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. READING TASK RUNNER */}
      {task.task_type === 'reading' && (
        <div>
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5F3',
            borderRadius: '12px',
            padding: '18px 20px',
            fontSize: '0.86rem',
            lineHeight: 1.6,
            color: '#191B35',
            marginBottom: '16px'
          }}>
            <h5 style={{ fontSize: '0.94rem', fontWeight: 750, color: '#191B35', margin: '0 0 8px 0' }}>
              Core Pedagogical Concept: The Appoggio Method
            </h5>
            <p style={{ margin: '0 0 10px 0' }}>
              Appoggio (from Italian <em>appoggiare</em>, "to lean") is the historical vocal technique where the singer coordinates the inspiratory muscles (external intercostals and diaphragm) and expiratory muscles (abdominal wall and internal intercostals) to maintain a dynamic equilibrium.
            </p>
            <p style={{ margin: '0 0 10px 0' }}>
              Instead of forcing air upward with tension, the ribs remain gently expanded ("open thorax"), and the breath pressure underneath the vocal folds remains steady, silky, and uninterrupted.
            </p>
            <ul style={{ margin: '0 0 10px 0', paddingLeft: '20px', color: '#7C3AED', fontWeight: 600 }}>
              <li>Never collapse the chest wall at the start of a vocal phrase.</li>
              <li>Allow the lower abdominal wall to release outward on inhalation.</li>
              <li>Maintain steady subglottic pressure without gripping the throat.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCompleteReading}
              disabled={submitting || isAssessed}
              style={{
                padding: '9px 22px',
                borderRadius: '9999px',
                backgroundColor: isAssessed ? '#EAE5F3' : '#7C3AED',
                color: isAssessed ? '#77728A' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isAssessed ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isAssessed ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Reading Completed ({task.maximum_marks}/{task.maximum_marks} marks)</span>
                </>
              ) : submitting ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Mark as Read & Understood</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. QUIZ TASK RUNNER */}
      {task.task_type === 'quiz' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1px solid #EAE5F3' }}>
              <p style={{ fontWeight: 700, fontSize: '0.86rem', color: '#191B35', margin: '0 0 8px 0' }}>
                1. What physical movement occurs when you take a sudden, deep breath before a difficult high note?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { val: 'A', text: 'My shoulders and upper collarbone lift upward noticeably.' },
                  { val: 'B', text: 'My lower ribs expand laterally in 360° while shoulders stay relaxed.' },
                  { val: 'C', text: 'I hold my breath tight in my throat before phonation.' }
                ].map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#191B35', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="q1"
                      value={opt.val}
                      checked={quizAnswers.q1 === opt.val}
                      onChange={(e) => setQuizAnswers({ ...quizAnswers, q1: e.target.value })}
                      disabled={isAssessed}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1px solid #EAE5F3' }}>
              <p style={{ fontWeight: 700, fontSize: '0.86rem', color: '#191B35', margin: '0 0 8px 0' }}>
                2. During long sustained singing phrases, how does your breath release feel?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { val: 'A', text: 'I run completely out of air 3-4 seconds before the phrase ends.' },
                  { val: 'B', text: 'Air rushes out immediately on the first word, leaving no support.' },
                  { val: 'C', text: 'I pace the airflow evenly with a gentle engagement of lower abdomen.' }
                ].map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#191B35', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="q2"
                      value={opt.val}
                      checked={quizAnswers.q2 === opt.val}
                      onChange={(e) => setQuizAnswers({ ...quizAnswers, q2: e.target.value })}
                      disabled={isAssessed}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFFFF', padding: '14px 16px', borderRadius: '12px', border: '1px solid #EAE5F3' }}>
              <p style={{ fontWeight: 700, fontSize: '0.86rem', color: '#191B35', margin: '0 0 8px 0' }}>
                3. What is your primary breath management objective for this module?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { val: 'A', text: 'Eliminating clavicular chest tension and mastering appoggio airflow pacing.' },
                  { val: 'B', text: 'Holding a single note as loud as possible.' },
                  { val: 'C', text: 'Singing without taking any breaths between sections.' }
                ].map(opt => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#191B35', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="q3"
                      value={opt.val}
                      checked={quizAnswers.q3 === opt.val}
                      onChange={(e) => setQuizAnswers({ ...quizAnswers, q3: e.target.value })}
                      disabled={isAssessed}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSubmitQuiz}
              disabled={submitting || isAssessed}
              style={{
                padding: '9px 22px',
                borderRadius: '9999px',
                backgroundColor: isAssessed ? '#EAE5F3' : '#7C3AED',
                color: isAssessed ? '#77728A' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isAssessed ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isAssessed ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Diagnostic Assessment Submitted ({task.maximum_marks}/{task.maximum_marks})</span>
                </>
              ) : submitting ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Submit Diagnostic Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. WRITTEN TASK RUNNER */}
      {task.task_type === 'written' && (
        <div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191B35', marginBottom: '6px' }}>
              Your Written Reflection & Practice Observations:
            </label>
            <textarea
              rows={5}
              value={writtenResponse}
              onChange={(e) => setWrittenResponse(e.target.value)}
              placeholder="Record your physical sensations, breath capacity observations, ribcage expansion, and questions here..."
              disabled={isAssessed}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #EAE5F3',
                fontSize: '0.84rem',
                color: '#191B35',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                lineHeight: 1.5
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.74rem', color: '#77728A' }}>
              <span>Write with honest vocal awareness. Stored permanently in your learning portfolio.</span>
              <span>{writtenResponse.length} characters</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleSubmitWritten}
              disabled={submitting || isAssessed}
              style={{
                padding: '9px 22px',
                borderRadius: '9999px',
                backgroundColor: isAssessed ? '#EAE5F3' : '#7C3AED',
                color: isAssessed ? '#77728A' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: isAssessed ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isAssessed ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Response Evaluated ({task.marks_awarded || 0}/{task.maximum_marks})</span>
                </>
              ) : submitting ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Submit Response for Teacher Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. PACED BREATHING EXERCISE RUNNER */}
      {task.task_type === 'breathing_exercise' && (
        <PacedBreathingGuide
          onComplete={handleCompleteBreathingDrill}
          disabled={isAssessed}
        />
      )}

      {/* 5. TIMED PRACTICE DRILL RUNNER */}
      {task.task_type === 'timed_practice' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #EAE5F3',
          borderRadius: '14px',
          padding: '20px',
          textAlign: 'center',
          margin: '14px 0'
        }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#191B35', fontFamily: 'monospace', marginBottom: '8px' }}>
            {formatTimer(timerSeconds)}
          </div>
          <p style={{ fontSize: '0.82rem', color: '#77728A', margin: '0 0 16px 0' }}>
            Hold a continuous, gentle 'tsss' or voiced 'zzz' sound without throat constriction. Track active endurance.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={toggleTimer}
              disabled={isAssessed}
              style={{
                padding: '8px 22px',
                borderRadius: '9999px',
                backgroundColor: timerRunning ? '#EAE5F3' : '#7C3AED',
                color: timerRunning ? '#191B35' : '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {timerRunning ? <Pause size={15} /> : <Play size={15} />}
              <span>{timerRunning ? 'Pause Timer' : 'Start Endurance Timer'}</span>
            </button>

            <button
              type="button"
              onClick={resetTimer}
              style={{
                padding: '8px 14px',
                borderRadius: '9999px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE5F3',
                color: '#77728A',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            {timerSeconds >= 10 && (
              <button
                type="button"
                onClick={handleFinishTimedPractice}
                disabled={submitting || isAssessed}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#15966A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 750,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={15} />
                <span>Save Practice Session & Complete Task</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. AUDIO RECORDING & SONG PHRASE MAPPING (Stage 08) */}
      {(task.task_type === 'audio_submission' || task.task_type === 'song_phrase_practice') && (
        <div>
          {/* Song Phrase Mapping Foundation */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5F3',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Music size={18} color="#7C3AED" />
              <h5 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#191B35', margin: 0 }}>
                Song Phrase Breath Map: "Ode to Harmony"
              </h5>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {phrases.map((phrase, idx) => (
                <div key={idx} style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: '#F8FAF8',
                  border: '1px solid #EAE5F3'
                }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#191B35', marginBottom: '4px' }}>
                    Phrase {phrase.phraseNumber}: "{phrase.lyrics}"
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#2A6C5E', marginBottom: '2px' }}>
                    <strong>Inhalation Point:</strong> {phrase.inhalePoint}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#77728A' }}>
                    <strong>Exhalation Guidance:</strong> {phrase.exhaleGuidance}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audio Recorder / Uploader Component */}
          <AudioRecorderUploader
            taskId={task.id}
            onAudioSubmitted={handleAudioSubmitted}
            disabled={isAssessed && !needsRevision}
          />
        </div>
      )}

      {/* 7. ASSESSMENT, SCORES & TEACHER FEEDBACK PANEL */}
      {task.assignment_status && task.assignment_status !== 'ASSIGNED' && (
        <div className="assessment-feedback-panel">
          <div className="feedback-title">
            <Award size={18} color="#7C3AED" />
            <span>Learning Evaluation & Teacher Assessment</span>
          </div>

          {/* Pending / Awaiting Review */}
          {isAwaitingReview && (
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '0.76rem',
                fontWeight: 750,
                marginBottom: '8px'
              }}>
                <Clock size={13} />
                <span>Awaiting Teacher Review</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#77728A' }}>
                Your task submission has been received and securely logged. Marks and feedback will be posted here as soon as reviewed by your instructor.
              </p>
            </div>
          )}

          {/* Needs Revision */}
          {needsRevision && (
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                fontSize: '0.76rem',
                fontWeight: 750,
                marginBottom: '8px'
              }}>
                <AlertCircle size={13} />
                <span>Revision Requested</span>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.84rem', color: '#191B35', fontWeight: 650 }}>
                Teacher Instructions: {task.feedback || 'Please review your airflow pacing and resubmit a new attempt.'}
              </p>
              {task.improvement_suggestions && (
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#77728A' }}>
                  <strong>Suggestion:</strong> {task.improvement_suggestions}
                </p>
              )}
            </div>
          )}

          {/* Assessed / Completed */}
          {isAssessed && (
            <div>
              <div className="feedback-score-row">
                <span className="feedback-marks">
                  {task.marks_awarded !== null ? task.marks_awarded : task.maximum_marks} / {task.maximum_marks} marks
                </span>
                <span className="feedback-percent">
                  ({task.score_percentage !== null ? `${task.score_percentage}%` : '100%'})
                </span>
                <span className="status-pill completed" style={{ marginLeft: 'auto' }}>
                  Mastered
                </span>
              </div>

              {task.feedback && (
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #EAE5F3',
                  fontSize: '0.82rem',
                  color: '#191B35',
                  marginBottom: '6px'
                }}>
                  <strong>Teacher Feedback:</strong> {task.feedback}
                </div>
              )}

              {task.improvement_suggestions && (
                <div style={{
                  fontSize: '0.78rem',
                  color: '#2D6B5E',
                  backgroundColor: '#E6F3EE',
                  padding: '8px 12px',
                  borderRadius: '8px'
                }}>
                  <strong>Next Milestones:</strong> {task.improvement_suggestions}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
