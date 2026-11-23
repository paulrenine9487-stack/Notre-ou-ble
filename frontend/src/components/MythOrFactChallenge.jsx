import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Award,
  ChevronRight,
  Eye,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';

// Fallback questions if backend offline
const FALLBACK_QUESTIONS = [
  {
    id: 'mf-1',
    question_id: 'mf-1',
    statement: 'The more air I take in, the longer I can hold a note.',
    category: 'Breathing Technique',
    correct_answer: 'MYTH',
    explanation: 'Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity.',
    display_order: 1
  },
  {
    id: 'mf-2',
    question_id: 'mf-2',
    statement: 'I should breathe at every comma I see in the song lyrics.',
    category: 'Breathing Technique',
    correct_answer: 'MYTH',
    explanation: 'Why? Musical breathing depends on phrasing, not just punctuation. Sometimes you need to breathe in the middle of a sentence, while other times you can sing through a comma.',
    display_order: 2
  },
  {
    id: 'mf-3',
    question_id: 'mf-3',
    statement: 'Breathing out completely before taking another breath helps me prepare better for singing.',
    category: 'Breathing Technique',
    correct_answer: 'MYTH',
    explanation: 'Why? Forcing all the air out can create tension and make the next inhalation uncomfortable. Allow your breath to flow naturally before taking the next one.',
    display_order: 3
  },
  {
    id: 'mf-4',
    question_id: 'mf-4',
    statement: 'Your breathing muscles continue working even while you sing.',
    category: 'Breathing Technique',
    correct_answer: 'FACT',
    explanation: 'Why? Breathing muscles help regulate airflow during singing. They coordinate to maintain controlled exhalation rather than simply switching off after inhalation.',
    display_order: 4
  },
  {
    id: 'mf-5',
    question_id: 'mf-5',
    statement: 'I should hold my breath for a moment before starting every sung phrase.',
    category: 'Breathing Technique',
    correct_answer: 'MYTH',
    explanation: 'Why? Unnecessary breath-holding can create tension. Aim for a smooth transition from inhalation to singing.',
    display_order: 5
  },
  {
    id: 'mf-6',
    question_id: 'mf-6',
    statement: 'Two singers can sing the same long note but use their breath differently.',
    category: 'Breathing Technique',
    correct_answer: 'FACT',
    explanation: 'Why? Breath requirements vary depending on vocal technique, phrasing, volume and individual physiology. There isn\'t one identical breathing pattern for every singer.',
    display_order: 6
  }
];

export default function MythOrFactChallenge({
  challenge,
  stageId = 4,
  onCompleted = () => {}
}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student interaction state
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: 'MYTH' | 'FACT' }
  const [currentFeedback, setCurrentFeedback] = useState(null); // { isCorrect, correctAnswer, explanation, score }
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Results & History state
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [bestAttempt, setBestAttempt] = useState(null);
  const [latestAttempt, setLatestAttempt] = useState(null);

  // Load questions and previous attempts from MySQL
  const loadChallengeData = async () => {
    try {
      setLoading(true);
      const res = await api.getMythFactChallenge();
      if (res && res.success && Array.isArray(res.questions) && res.questions.length > 0) {
        setQuestions(res.questions);
        if (res.challenge?.nextAttemptNumber) {
          setAttemptNumber(res.challenge.nextAttemptNumber);
        }
        if (res.challenge?.latestAttempt) setLatestAttempt(res.challenge.latestAttempt);
        if (res.challenge?.bestAttempt) setBestAttempt(res.challenge.bestAttempt);
      } else if (challenge?.configuration?.questions) {
        setQuestions(challenge.configuration.questions);
      } else {
        setQuestions(FALLBACK_QUESTIONS);
      }
    } catch (err) {
      console.warn('Could not load Myth or Fact questions from API, using fallback:', err);
      setQuestions(FALLBACK_QUESTIONS);
    } finally {
      setLoading(false);
      setStartTime(Date.now());
    }
  };

  useEffect(() => {
    loadChallengeData();
  }, [challenge?.id]);

  // Handle student clicking MYTH or FACT
  const handleSelectAnswer = async (choice) => {
    if (currentFeedback || submittingAnswer) return; // Prevent changing or duplicate submit

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const qId = currentQ.question_id || currentQ.id;
    setSelectedAnswers(prev => ({ ...prev, [qId]: choice }));
    setSubmittingAnswer(true);

    try {
      // Submit answer to backend for verification and storage
      const res = await api.submitMythFactAnswer({
        questionId: qId,
        selectedAnswer: choice,
        attemptNumber
      });

      if (res && res.success) {
        setCurrentFeedback({
          isCorrect: res.isCorrect,
          selectedAnswer: choice,
          correctAnswer: res.correctAnswer,
          explanation: res.explanation,
          score: res.score
        });
      } else {
        // Fallback local check if API error
        const isCorr = choice === currentQ.correctAnswer || choice === currentQ.correct_answer;
        setCurrentFeedback({
          isCorrect: isCorr,
          selectedAnswer: choice,
          correctAnswer: currentQ.correctAnswer || currentQ.correct_answer || 'MYTH',
          explanation: currentQ.explanation,
          score: isCorr ? 10 : 0
        });
      }
    } catch (err) {
      console.error('Submit answer error:', err);
      const isCorr = choice === (currentQ.correctAnswer || currentQ.correct_answer);
      setCurrentFeedback({
        isCorrect: isCorr,
        selectedAnswer: choice,
        correctAnswer: currentQ.correctAnswer || currentQ.correct_answer || 'MYTH',
        explanation: currentQ.explanation,
        score: isCorr ? 10 : 0
      });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Handle Next Question / See Results
  const handleNextQuestion = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentFeedback(null);
    } else {
      // Completed all questions - submit final attempt to MySQL
      await handleCompleteQuiz();
    }
  };

  // Complete Quiz & Calculate Score
  const handleCompleteQuiz = async () => {
    setLoading(true);
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 60;

    try {
      const res = await api.completeMythFactChallenge({
        attemptNumber,
        answers: selectedAnswers,
        timeSpentSeconds: durationSeconds
      });

      if (res && res.success && res.result) {
        setFinalResult(res.result);
        setIsCompleted(true);
        if (onCompleted) onCompleted();
      } else {
        // Fallback local calculation
        const total = questions.length || 6;
        let correct = 0;
        const review = questions.map(q => {
          const qId = q.question_id || q.id;
          const userAns = selectedAnswers[qId];
          const isCorr = userAns === (q.correctAnswer || q.correct_answer);
          if (isCorr) correct++;
          return {
            questionId: qId,
            statement: q.statement,
            selectedAnswer: userAns || 'UNANSWERED',
            correctAnswer: q.correctAnswer || q.correct_answer,
            isCorrect: isCorr,
            explanation: q.explanation
          };
        });

        const pct = Math.round((correct / total) * 100);
        let category = 'Keep learning and try again.';
        if (correct >= 5) category = 'Excellent understanding!';
        else if (correct >= 3) category = 'Good effort! Keep practising.';

        const localResult = {
          attemptNumber,
          totalQuestions: total,
          correctAnswers: correct,
          incorrectAnswers: total - correct,
          finalScore: correct * 10,
          totalMarks: total * 10,
          percentage: pct,
          category,
          status: pct >= 50 ? 'PASSED' : 'COMPLETED',
          review
        };

        setFinalResult(localResult);
        setIsCompleted(true);
        if (onCompleted) onCompleted();
      }
    } catch (err) {
      console.error('Complete quiz error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Restart quiz
  const handleTryAgain = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setCurrentFeedback(null);
    setIsCompleted(false);
    setFinalResult(null);
    setShowReview(false);
    setAttemptNumber(prev => prev + 1);
    setStartTime(Date.now());
  };

  const totalQuestions = questions.length || 6;
  const currentQ = questions[currentIndex] || FALLBACK_QUESTIONS[0];
  const progressPercent = Math.round(((currentIndex + (currentFeedback ? 1 : 0)) / totalQuestions) * 100);

  return (
    <div
      style={{
        background: '#F8FAFC',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '24px 26px',
        boxShadow: '0 4px 20px rgba(25, 27, 53, 0.04)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
      className="myth-fact-container"
    >
      {/* 1. SECTION HEADING */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#0D9488',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: '#E6F4F1',
                padding: '2px 8px',
                borderRadius: 9999
              }}
            >
              PART 1 · INTERACTIVE CHALLENGE
            </span>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>
              6 Questions
            </span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#191B35', margin: 0, letterSpacing: '-0.01em' }}>
            Breathe Right: Fact or Myth?
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
            Test your understanding of breathing techniques for singing.
          </p>
        </div>

        {/* Latest and Best Score Badges */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {latestAttempt && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: '0.76rem',
                textAlign: 'right'
              }}
            >
              <div style={{ color: '#64748B', fontWeight: 600 }}>Latest Attempt</div>
              <div style={{ color: '#191B35', fontWeight: 800 }}>
                {latestAttempt.score} / {latestAttempt.total_marks || 60} ({parseFloat(latestAttempt.percentage)}%)
              </div>
            </div>
          )}
          {bestAttempt && (
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 10,
                padding: '6px 12px',
                fontSize: '0.76rem',
                textAlign: 'right'
              }}
            >
              <div style={{ color: '#15803D', fontWeight: 600 }}>Best Score</div>
              <div style={{ color: '#15803D', fontWeight: 800 }}>
                {bestAttempt.score} / {bestAttempt.total_marks || 60} ({parseFloat(bestAttempt.percentage)}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUIZ ACTIVE VIEW */}
      {!isCompleted ? (
        <div style={{ maxWidth: 960, width: '100%', margin: '0 auto' }}>
          {/* Progress Indicator */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F766E' }}>
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span style={{ fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
                Attempt #{attemptNumber} • {progressPercent}% Completed
              </span>
            </div>
            {/* Progress bar track */}
            <div
              style={{
                width: '100%',
                height: 7,
                backgroundColor: '#E2E8F0',
                borderRadius: 9999,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: '#14B8A6',
                  borderRadius: 9999,
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          </div>

          {/* Central Question Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              border: '1px solid #E2E8F0',
              padding: '28px 24px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
              marginBottom: 20,
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Category Label */}
            <div style={{ marginBottom: 14 }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#0D9488',
                  background: '#F0FDFA',
                  border: '1px solid #CCFBF1',
                  padding: '3px 12px',
                  borderRadius: 9999,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                {currentQ.category || 'Breathing Technique'}
              </span>
            </div>

            {/* Question Statement */}
            <p
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#191B35',
                lineHeight: 1.5,
                margin: '0 0 24px 0'
              }}
            >
              "{currentQ.statement}"
            </p>

            {/* Two Large Answer Buttons: MYTH (Coral/Orange) and FACT (Teal/Green) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                maxWidth: 440,
                margin: '0 auto'
              }}
            >
              {/* MYTH Button */}
              <button
                type="button"
                disabled={Boolean(currentFeedback) || submittingAnswer}
                onClick={() => handleSelectAnswer('MYTH')}
                style={{
                  padding: '16px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: currentFeedback && selectedAnswers[currentQ.question_id || currentQ.id] === 'MYTH'
                    ? '#EA580C'
                    : currentFeedback
                    ? '#FDBA74'
                    : '#F97316',
                  color: '#FFFFFF',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: currentFeedback ? 'default' : 'pointer',
                  boxShadow: currentFeedback && selectedAnswers[currentQ.question_id || currentQ.id] === 'MYTH'
                    ? '0 0 0 3px #FDBA74, 0 4px 12px rgba(249, 115, 22, 0.35)'
                    : '0 4px 12px rgba(249, 115, 22, 0.25)',
                  opacity: currentFeedback && selectedAnswers[currentQ.question_id || currentQ.id] !== 'MYTH' ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <span>MYTH</span>
              </button>

              {/* FACT Button */}
              <button
                type="button"
                disabled={Boolean(currentFeedback) || submittingAnswer}
                onClick={() => handleSelectAnswer('FACT')}
                style={{
                  padding: '16px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: currentFeedback && selectedAnswers[currentQ.question_id || currentQ.id] === 'FACT'
                    ? '#0F766E'
                    : currentFeedback
                    ? '#99F6E4'
                    : '#14B8A6',
                  color: '#FFFFFF',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  cursor: currentFeedback ? 'default' : 'pointer',
                  boxShadow: currentFeedback && selectedAnswers[currentQ.question_id || currentQ.id] === 'FACT'
                    ? '0 0 0 3px #99F6E4, 0 4px 12px rgba(20, 184, 166, 0.35)'
                    : '0 4px 12px rgba(20, 184, 166, 0.25)',
                  opacity: currentFeedback && selectedAnswers[currentQ.question_id || currentQ.id] !== 'FACT' ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <span>FACT</span>
              </button>
            </div>

            {/* Below Answer Buttons: Feedback Panel */}
            {currentFeedback && (
              <div
                style={{
                  marginTop: 24,
                  padding: '18px 20px',
                  borderRadius: 14,
                  background: currentFeedback.isCorrect ? '#E6F4F1' : '#FFF7ED',
                  border: currentFeedback.isCorrect ? '1.5px solid #14B8A6' : '1.5px solid #F97316',
                  textAlign: 'left',
                  animation: 'fadeIn 0.25s ease-in-out'
                }}
              >
                {/* Status Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: currentFeedback.isCorrect ? '#0D9488' : '#EA580C',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {currentFeedback.isCorrect ? <Check size={14} /> : <X size={14} />}
                  </div>
                  <span
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: currentFeedback.isCorrect ? '#0F766E' : '#C2410C'
                    }}
                  >
                    {currentFeedback.isCorrect
                      ? 'Correct answer!'
                      : `Not quite! The correct answer is ${currentFeedback.correctAnswer}.`}
                  </span>
                </div>

                {/* Explanation text */}
                <p
                  style={{
                    fontSize: '0.90rem',
                    color: '#334155',
                    lineHeight: 1.6,
                    margin: '0 0 16px 0',
                    fontWeight: 500
                  }}
                >
                  {currentFeedback.explanation}
                </p>

                {/* Next Question / See Results Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#168B7A',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(22, 139, 122, 0.25)',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'See Final Results'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 6. FINAL RESULT SCREEN */
        <div style={{ maxWidth: 840, width: '100%', margin: '0 auto', textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: finalResult?.percentage >= 80 ? '#E2F3EB' : finalResult?.percentage >= 50 ? '#E0F2FE' : '#FEF3C7',
              color: finalResult?.percentage >= 80 ? '#168B7A' : finalResult?.percentage >= 50 ? '#0284C7' : '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Award size={36} />
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#191B35', margin: '0 0 6px 0' }}>
            Challenge Completed!
          </h3>

          {/* Performance Category Banner */}
          <div
            style={{
              display: 'inline-block',
              fontSize: '1rem',
              fontWeight: 800,
              color: finalResult?.percentage >= 80 ? '#0F766E' : finalResult?.percentage >= 50 ? '#0369A1' : '#B45309',
              background: finalResult?.percentage >= 80 ? '#E6F4F1' : finalResult?.percentage >= 50 ? '#E0F2FE' : '#FEF3C7',
              padding: '6px 18px',
              borderRadius: 9999,
              marginBottom: 20
            }}
          >
            {finalResult?.category || 'Great effort!'}
          </div>

          {/* Stats Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
              textAlign: 'center'
            }}
          >
            <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Questions
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#191B35', marginTop: 2 }}>
                {finalResult?.totalQuestions || 6}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700, textTransform: 'uppercase' }}>
                Correct
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D', marginTop: 2 }}>
                {finalResult?.correctAnswers || 0}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#DC2626', fontWeight: 700, textTransform: 'uppercase' }}>
                Incorrect
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: 2 }}>
                {finalResult?.incorrectAnswers || 0}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', color: '#0D9488', fontWeight: 700, textTransform: 'uppercase' }}>
                Score
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0D9488', marginTop: 2 }}>
                {finalResult?.percentage || 0}%
              </div>
            </div>
          </div>

          {/* Action Buttons: Review Answers & Try Again */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowReview(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 12,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.90rem',
                fontWeight: 750,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <Eye size={16} />
              <span>{showReview ? 'Hide Answer Review' : 'Review Answers'}</span>
            </button>

            <button
              type="button"
              onClick={handleTryAgain}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 26px',
                borderRadius: 12,
                border: 'none',
                background: '#168B7A',
                color: '#FFFFFF',
                fontSize: '0.90rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(22, 139, 122, 0.3)',
                transition: 'all 0.18s ease'
              }}
            >
              <RotateCcw size={16} />
              <span>Try Again</span>
            </button>
          </div>

          {/* Detailed Review Section */}
          {showReview && finalResult?.review && (
            <div
              style={{
                marginTop: 26,
                textAlign: 'left',
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '20px'
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#191B35', margin: '0 0 14px 0' }}>
                Answer Review & Explanations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {finalResult.review.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      border: item.isCorrect ? '1px solid #BBF7D0' : '1px solid #FECACA',
                      background: item.isCorrect ? '#F0FDF4' : '#FEF2F2'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 800, color: '#64748B' }}>
                        QUESTION {idx + 1} OF {totalQuestions}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: item.isCorrect ? '#DCFCE7' : '#FEE2E2',
                          color: item.isCorrect ? '#15803D' : '#DC2626'
                        }}
                      >
                        {item.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#191B35', margin: '0 0 8px 0' }}>
                      "{item.statement}"
                    </p>

                    <div style={{ display: 'flex', gap: 16, fontSize: '0.78rem', marginBottom: 8 }}>
                      <div>
                        <span style={{ color: '#64748B' }}>Your Answer: </span>
                        <strong style={{ color: item.isCorrect ? '#15803D' : '#DC2626' }}>{item.selectedAnswer}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Correct Answer: </span>
                        <strong style={{ color: '#0F766E' }}>{item.correctAnswer}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '0.84rem',
                        color: '#334155',
                        lineHeight: 1.5,
                        background: '#FFFFFF',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      {item.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
