import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Compass,
  CheckCircle2,
  Sparkles,
  Eye,
  Sliders,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// 7 Movements in strict sequence as requested
const POSTURE_STEPS = [
  {
    step: 1,
    title: 'Feet Together (Neutral Base)',
    instruction: 'Begin with the feet placed completely together, heels touching, standing naturally in front of the mirror.',
    view: 'front',
    duration: 5,
    overlayType: 'feet-together',
    mirrorCue: 'Observe your baseline reflection in the mirror.',
    coachVoice: 'Begin by placing your feet completely together, standing naturally and observing your reflection in the mirror.'
  },
  {
    step: 2,
    title: 'Turn Toes Outward (V-Shape)',
    instruction: 'Slowly turn the toes outwards while keeping the heels together, forming a natural, small V-shape angle.',
    view: 'front',
    duration: 5,
    overlayType: 'feet-v-shape',
    mirrorCue: 'Keep heels grounded together, toes angled out naturally.',
    coachVoice: 'Now, slowly turn your toes outwards while keeping your heels together, creating a gentle V shape.'
  },
  {
    step: 3,
    title: 'Step Out to Hip-Width Stance',
    instruction: 'Using this position as a guide, gradually widen the stance until the feet are approximately hip-width apart, toes pointing slightly outwards.',
    view: 'front',
    duration: 6,
    overlayType: 'hip-width-stance',
    mirrorCue: 'Verify feet are directly under your hip joints, not wider.',
    coachVoice: 'Using that angle, widen your stance until your feet are hip-width apart, toes pointing slightly outward.'
  },
  {
    step: 4,
    title: 'Upright Spine Alignment',
    instruction: 'Straighten the spine and maintain a naturally upright posture. Feel length through your lower back without hyperextending.',
    view: 'side',
    duration: 6,
    overlayType: 'spine-plumbline',
    mirrorCue: 'Turn slightly to observe your vertical plumb line in the mirror.',
    coachVoice: 'Straighten your spine, maintaining a naturally upright posture with length throughout your back.'
  },
  {
    step: 5,
    title: 'Relaxed Shoulders & Open Chest',
    instruction: 'Keep the shoulders relaxed and level, chest comfortably open and buoyant, with arms resting naturally by the sides.',
    view: 'front',
    duration: 6,
    overlayType: 'shoulders-level',
    mirrorCue: 'Ensure shoulders are even and drop naturally away from your ears.',
    coachVoice: 'Keep your shoulders relaxed and level, with your chest comfortably open and arms resting naturally.'
  },
  {
    step: 6,
    title: 'Head Aligned & Chin Parallel',
    instruction: 'Keep the head aligned with the spine and the chin parallel to the floor, with the gaze directed straight ahead into the mirror.',
    view: 'side',
    duration: 6,
    overlayType: 'head-alignment',
    mirrorCue: 'Chin parallel to the floor, gaze relaxed and forward.',
    coachVoice: 'Align your head with your spine, keeping your chin parallel to the floor and gazing straight ahead.'
  },
  {
    step: 7,
    title: 'Soft Knees & Even Grounding',
    instruction: 'Maintain soft, unlocked knees and distribute your body weight evenly across both feet (50/50 balance tripod).',
    view: 'front',
    duration: 6,
    overlayType: 'soft-knees-grounding',
    mirrorCue: 'Feel balanced and grounded, ready for effortless breathing.',
    coachVoice: 'Finally, maintain soft, unlocked knees and distribute your body weight evenly across both feet.'
  }
];

export default function PostureInstructionalVideoPlayer() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewAngle, setViewAngle] = useState('front'); // 'front' | 'side'
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [progressSec, setProgressSec] = useState(0);

  const activeStep = POSTURE_STEPS[currentStepIndex];

  // Handle Coach Voiceover via Web Speech API
  const speakInstruction = (text) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Timer loop for instructional progression
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressSec((prev) => {
          if (prev + 1 >= activeStep.duration) {
            // Advance to next step or loop
            if (currentStepIndex + 1 < POSTURE_STEPS.length) {
              const nextIndex = currentStepIndex + 1;
              setCurrentStepIndex(nextIndex);
              setViewAngle(POSTURE_STEPS[nextIndex].view);
              speakInstruction(POSTURE_STEPS[nextIndex].coachVoice);
              return 0;
            } else {
              // Completed all 7 steps
              setIsPlaying(false);
              return activeStep.duration;
            }
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStepIndex, activeStep, voiceEnabled]);

  const handleStepSelect = (index) => {
    setCurrentStepIndex(index);
    setProgressSec(0);
    setViewAngle(POSTURE_STEPS[index].view);
    if (voiceEnabled) speakInstruction(POSTURE_STEPS[index].coachVoice);
  };

  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState && voiceEnabled) {
      speakInstruction(activeStep.coachVoice);
    } else if (!nextState && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setProgressSec(0);
    setViewAngle(POSTURE_STEPS[0].view);
    setIsPlaying(true);
    if (voiceEnabled) speakInstruction(POSTURE_STEPS[0].coachVoice);
  };

  const handleToggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);
    if (nextState) {
      speakInstruction(activeStep.coachVoice);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: '24px',
      border: '1.5px solid #EAE5F3',
      boxShadow: '0 8px 32px rgba(25, 27, 53, 0.05)',
      marginTop: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              backgroundColor: '#EDE9FE',
              color: '#7C3AED',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '9999px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Step-By-Step Video Tutorial
            </span>
            <span style={{ fontSize: '0.82rem', color: '#77728A', fontWeight: 600 }}>
              Movement {activeStep.step} of 7
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191B35', margin: 0, letterSpacing: '-0.02em' }}>
            Correct Standing Posture: 7-Movement Sequential Masterclass
          </h3>
        </div>

        {/* View Angle Switcher (Front vs Side) + Voice Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            backgroundColor: '#F3F4F6',
            padding: '3px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <button
              type="button"
              onClick={() => setViewAngle('front')}
              style={{
                padding: '5px 12px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: viewAngle === 'front' ? '#FFFFFF' : 'transparent',
                color: viewAngle === 'front' ? '#191B35' : '#6B7280',
                fontSize: '0.76rem',
                fontWeight: viewAngle === 'front' ? 750 : 600,
                cursor: 'pointer',
                boxShadow: viewAngle === 'front' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Front Mirror View
            </button>
            <button
              type="button"
              onClick={() => setViewAngle('side')}
              style={{
                padding: '5px 12px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: viewAngle === 'side' ? '#FFFFFF' : 'transparent',
                color: viewAngle === 'side' ? '#191B35' : '#6B7280',
                fontSize: '0.76rem',
                fontWeight: viewAngle === 'side' ? 750 : 600,
                cursor: 'pointer',
                boxShadow: viewAngle === 'side' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Side Alignment View
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleVoice}
            title={voiceEnabled ? 'Mute vocal coach voiceover' : 'Enable friendly vocal coach voiceover'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1.5px solid #EAE5F3',
              backgroundColor: voiceEnabled ? '#EDE9FE' : '#FFFFFF',
              color: voiceEnabled ? '#7C3AED' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport & Studio Demonstration Stage */}
      <div style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#0F172A',
        aspectRatio: '16 / 9',
        minHeight: '360px',
        maxHeight: '480px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
      }}>
        {/* Realistic Studio Teacher Image (Front View or Side Profile View) */}
        <img
          src={
            viewAngle === 'front'
              ? '/images/posture/posture_instructional_front.jpg'
              : '/images/posture/posture_instructional_side.jpg'
          }
          alt={`Instructional posture demonstration: ${activeStep.title}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />

        {/* Studio Lighting & Vignette Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15,23,42,0.25) 0%, transparent 40%, rgba(15,23,42,0.65) 100%)',
          pointerEvents: 'none'
        }} />

        {/* Live Pedagogical Graphical Overlay depending on active movement */}
        {activeStep.step <= 3 && viewAngle === 'front' && (
          <div style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '14px',
            padding: '8px 16px',
            border: '1.5px solid #2DD4BF',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2DD4BF', animation: 'pulse 1.5s infinite' }} />
            <span>
              {activeStep.step === 1 && 'Feet Touching (Neutral Grounding)'}
              {activeStep.step === 2 && 'Toes Turn Out 45° (Small V Guide)'}
              {activeStep.step === 3 && 'Feet Slide to Hip-Width Under Pelvis'}
            </span>
          </div>
        )}

        {activeStep.step === 4 && viewAngle === 'side' && (
          <div style={{
            position: 'absolute',
            left: '48%',
            top: '20%',
            bottom: '22%',
            width: '2px',
            backgroundColor: 'rgba(45, 212, 191, 0.85)',
            boxShadow: '0 0 10px #2DD4BF',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '12px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1px solid #2DD4BF'
            }}>
              Vertical Plumb Line: Ear · Shoulder · Hip · Ankle
            </div>
          </div>
        )}

        {activeStep.step === 5 && (
          <div style={{
            position: 'absolute',
            top: '32%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '240px',
            height: '2px',
            backgroundColor: 'rgba(45, 212, 191, 0.75)',
            boxShadow: '0 0 8px #2DD4BF',
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              color: '#FFFFFF',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.70rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              border: '1px solid #2DD4BF'
            }}>
              Shoulders Relaxed & Level · Sternum Open
            </div>
          </div>
        )}

        {activeStep.step === 6 && (
          <div style={{
            position: 'absolute',
            top: '22%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '6px 14px',
            border: '1.5px solid #2DD4BF',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Eye size={13} color="#2DD4BF" />
            <span>Chin Parallel to Floor · Gaze in Mirror</span>
          </div>
        )}

        {activeStep.step === 7 && (
          <div style={{
            position: 'absolute',
            bottom: '16%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '6px 14px',
            border: '1.5px solid #2DD4BF',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Sparkles size={13} color="#2DD4BF" />
            <span>Soft Unlocked Knees · 50/50 Body Weight Grounding</span>
          </div>
        )}

        {/* Studio Mirror Observational Cue Pill (Top Right) */}
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          borderRadius: '10px',
          padding: '6px 12px',
          color: '#E2E8F0',
          fontSize: '0.72rem',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          <Eye size={12} color="#38BDF8" />
          <span>{activeStep.mirrorCue}</span>
        </div>

        {/* Video Player Floating Bottom Control Bar */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '20px',
          right: '20px',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <button
            type="button"
            onClick={handleTogglePlay}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(124, 58, 237, 0.4)',
              flexShrink: 0
            }}
          >
            {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: 2 }} />}
          </button>

          <button
            type="button"
            onClick={() => handleStepSelect(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            style={{
              background: 'none',
              border: 'none',
              color: currentStepIndex === 0 ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
              cursor: currentStepIndex === 0 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Timeline Bar across 7 steps */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', fontSize: '0.70rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>Step {activeStep.step}: {activeStep.title}</span>
              <span>{progressSec}s / {activeStep.duration}s</span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(progressSec / activeStep.duration) * 100}%`,
                height: '100%',
                backgroundColor: '#7C3AED',
                borderRadius: '2px',
                transition: 'width 0.25s linear'
              }} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleStepSelect(Math.min(POSTURE_STEPS.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === POSTURE_STEPS.length - 1}
            style={{
              background: 'none',
              border: 'none',
              color: currentStepIndex === POSTURE_STEPS.length - 1 ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
              cursor: currentStepIndex === POSTURE_STEPS.length - 1 ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            onClick={handleRestart}
            title="Replay sequence from beginning"
            style={{
              background: 'none',
              border: 'none',
              color: '#CBD5E1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 7 Interactive Sequence Stepper Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '8px',
        marginTop: '16px'
      }}>
        {POSTURE_STEPS.map((s, idx) => {
          const isActive = idx === currentStepIndex;
          const isDone = idx < currentStepIndex;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => handleStepSelect(idx)}
              style={{
                backgroundColor: isActive ? '#7C3AED' : (isDone ? '#F4F0FF' : '#F9FAFB'),
                color: isActive ? '#FFFFFF' : (isDone ? '#7C3AED' : '#4B5563'),
                border: isActive ? '1.5px solid #7C3AED' : (isDone ? '1px solid #DDD6FE' : '1px solid #E5E7EB'),
                borderRadius: '12px',
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', opacity: isActive ? 0.9 : 0.7 }}>
                  Step 0{s.step}
                </span>
                {isDone && <CheckCircle2 size={12} color="#7C3AED" />}
              </div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, lineHeight: 1.2 }}>
                {s.title.split(' ')[0]} {s.title.split(' ')[1] || ''}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Pedagogical Instruction Callout Card */}
      <div style={{
        marginTop: '16px',
        backgroundColor: '#F8FAF9',
        borderRadius: '14px',
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#0D9488',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.86rem',
          fontWeight: 800,
          flexShrink: 0
        }}>
          {activeStep.step}
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.94rem', fontWeight: 800, color: '#0F766E' }}>
            {activeStep.title}
          </h4>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: 1.55 }}>
            {activeStep.instruction}
          </p>
        </div>
      </div>
    </div>
  );
}
