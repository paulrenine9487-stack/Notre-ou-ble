import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import UserSidebar from '../components/UserSidebar';
import {
  Menu,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  Save,
  RotateCcw,
  Mic,
  Square,
  Upload,
  Check,
  X,
  Sparkles,
  Award,
  BookOpen,
  AlertCircle,
  Wind,
  Music,
  Compass,
  Feather,
  Activity,
  ChevronRight,
  ChevronLeft,
  Clock,
  Star,
  FileText,
  HelpCircle,
  RefreshCw,
  Lightbulb,
  Megaphone,
  CalendarCheck,
  RotateCw,
  GitFork,
  Lock
} from 'lucide-react';
import PartTwoInteractivePractice from '../components/PartTwoInteractivePractice';
import MythOrFactChallenge from '../components/MythOrFactChallenge';
import PersonalLearningPinboard from '../components/PersonalLearningPinboard';
import YourPracticeCommitment from '../components/YourPracticeCommitment';
import LearningJournalKanban from '../components/LearningJournalKanban';
import ModuleCompleteCard from '../components/ModuleCompleteCard';
import VideoTranscriptSection from '../components/VideoTranscriptSection';
import '../styles/dashboard.css';

export default function LearningPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const requestedStageNum = parseInt(searchParams.get('stage'), 10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [moduleData, setModuleData] = useState(null);
  const [stages, setStages] = useState([]);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [stageDetails, setStageDetails] = useState(null);
  const [stageDetailsCache, setStageDetailsCache] = useState({});
  const [stageLoading, setStageLoading] = useState(false);

  const updateStageUrl = useCallback((stageNum) => {
    if (!stageNum) return;
    try {
      const url = new URL(window.location.href);
      if (parseInt(url.searchParams.get('stage'), 10) !== stageNum) {
        url.searchParams.set('stage', stageNum);
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    } catch (e) {}
  }, []);

  // Load 5 stages
  const loadStages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.getFiveStages();
      if (res.success) {
        setModuleData(res.module);
        const stageList = res.stages || [];
        
        // Merge with existing stages state to preserve locally unlocked stages
        setStages(prevStages => {
          if (!prevStages || prevStages.length === 0) return stageList;
          return stageList.map(serverStage => {
            const localStage = prevStages.find(p => p.id === serverStage.id);
            return {
              ...serverStage,
              // If previously unlocked in local state, keep it unlocked
              is_unlocked: serverStage.is_unlocked || (localStage ? localStage.is_unlocked : false)
            };
          });
        });

        // ONLY pick initial stage if selectedStageId is NOT already selected (initial page load or reload)
        setSelectedStageId(currentSelectedId => {
          if (currentSelectedId) {
            // Already have an active stage selected: ensure it exists in stageList
            const stillExists = stageList.some(s => s.id === currentSelectedId);
            if (stillExists) return currentSelectedId;
          }

          // Initial selection: check URL ?stage=X param
          const currentUrlStageNum = parseInt(new URLSearchParams(window.location.search).get('stage'), 10);
          if (currentUrlStageNum && stageList.length > 0) {
            const match = stageList.find(s => s.stage_number === currentUrlStageNum);
            if (match) {
              const matchIdx = stageList.findIndex(s => s.id === match.id);
              const prevSt = matchIdx > 0 ? stageList[matchIdx - 1] : null;
              if (match.is_unlocked || match.status === 'COMPLETED' || match.stage_number === 1 || (prevSt && (prevSt.status === 'COMPLETED' || prevSt.is_completed))) {
                return match.id;
              }
            }
          }

          // Fallback to active unlocked stage from backend, or stage 1
          return res.currentStage ? res.currentStage.id : (stageList[0] ? stageList[0].id : null);
        });
      } else {
        setError(res.message || 'Failed to load learning stages.');
      }
    } catch (err) {
      console.error('Error loading learning stages:', err);
      setError(err.message || 'Could not connect to backend server.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  // Fetch full details of the currently selected stage (silent by default to prevent UI flashing)
  const loadStageDetails = async (stageId, silent = true) => {
    if (!stageId) return;
    try {
      if (!silent && !stageDetailsCache[stageId]) setStageLoading(true);
      setError(null);
      const res = await api.getStageDetails(stageId);
      if (res && res.success && res.stage) {
        setStageDetails(res.stage);
        setStageDetailsCache(prev => ({ ...prev, [stageId]: res.stage }));
      }
    } catch (err) {
      console.warn('Error loading stage details:', err);
      const fallbackStage = stages.find(s => s.id === stageId || s.stage_number === stageId);
      if (fallbackStage) {
        setStageDetails(fallbackStage);
      }
    } finally {
      setStageLoading(false);
    }
  };

  const selectedStage = stages.find(s => s.id === selectedStageId) || stages[0];
  const activeStage = stageDetailsCache[selectedStage?.id] || (stageDetails && stageDetails.id === selectedStage?.id ? stageDetails : selectedStage);

  useEffect(() => {
    if (selectedStageId) {
      loadStageDetails(selectedStageId, true);
    }
  }, [selectedStageId]);

  const stageSaveRef = useRef(null);
  const [navigatingNext, setNavigatingNext] = useState(false);
  const [navError, setNavError] = useState(null);

  const navigateToStage = (targetStageNumber, isNextOrPrevNavigation = false) => {
    setNavError(null);
    const targetStage = stages.find(s => s.stage_number === targetStageNumber);
    if (!targetStage) return;

    // A stage is accessible if:
    // 1. targetStage is Stage 1 (always unlocked), OR
    // 2. isNextOrPrevNavigation is true (called from Next/Previous navigation after save/review), OR
    // 3. targetStage is already unlocked or completed, OR
    // 4. the immediately preceding stage is completed (Rule 3: unrestricted navigation among unlocked stages), OR
    // 5. targetStage status is IN PROGRESS or COMPLETED
    const targetIdx = stages.findIndex(s => s.stage_number === targetStageNumber);
    const prevStageInList = targetIdx > 0 ? stages[targetIdx - 1] : null;
    const isAccessible = isNextOrPrevNavigation ||
      targetStage.stage_number === 1 ||
      targetStage.is_unlocked === true || 
      targetStage.status === 'COMPLETED' ||
      targetStage.status === 'IN PROGRESS' ||
      (prevStageInList && (prevStageInList.status === 'COMPLETED' || prevStageInList.is_completed));

    if (!isAccessible) {
      setNavError(`Stage ${targetStage.stage_number} is locked. You must complete the preceding stages first.`);
      return;
    }

    // Immediately mark as unlocked in local stages state
    setStages(prev =>
      prev.map(s => {
        if (s.stage_number <= targetStageNumber) {
          return { ...s, is_unlocked: true };
        }
        return s;
      })
    );

    const targetId = targetStage.id;
    // 1. Immediately switch stage in React state (0ms instant transition)
    setSelectedStageId(targetId);

    // 2. Immediately activate cached details if available
    if (stageDetailsCache[targetId]) {
      setStageDetails(stageDetailsCache[targetId]);
    }

    // 3. Update URL in browser address bar without triggering React Router reload
    updateStageUrl(targetStageNumber);

    // 4. Smooth scroll
    window.scrollTo({ top: 80, behavior: 'smooth' });

    if (targetStage.status === 'NOT STARTED') {
      api.startStage(targetId).catch(() => {});
    }

    // 5. Silently refresh details in background
    loadStageDetails(targetId, true);
    loadStages(true);
  };

  const handleSelectStage = (stage) => {
    const stageIdx = stages.findIndex(s => s.id === stage.id);
    const prevStageInList = stageIdx > 0 ? stages[stageIdx - 1] : null;
    const isAccessible = stage.stage_number === 1 ||
      stage.is_unlocked === true ||
      stage.status === 'COMPLETED' ||
      stage.status === 'IN PROGRESS' ||
      (prevStageInList && (prevStageInList.status === 'COMPLETED' || prevStageInList.is_completed));

    if (!isAccessible) {
      setNavError(`Stage ${stage.stage_number} is locked. Complete previous stages to unlock.`);
      return;
    }
    navigateToStage(stage.stage_number, true);
  };

  const currentStageIndex = stages.findIndex(s => s.id === (selectedStage ? selectedStage.id : selectedStageId));
  const prevStage = currentStageIndex > 0 ? stages[currentStageIndex - 1] : null;
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;

  const handlePrevStage = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    if (prevStage) {
      setNavError(null);
      // Students can revisit previous stages at any time (Rule 1)
      navigateToStage(prevStage.stage_number, true);
    }
  };

  const handleNextStage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    console.log('[LEARNING_NAV] 1. NEXT_BUTTON_CLICKED', {
      timestamp: new Date().toISOString()
    });
    console.log('[LEARNING_NAV] 2. CURRENT_MODULE_ID', moduleData?.id || 1);
    console.log('[LEARNING_NAV] 3. CURRENT_STAGE_ID', selectedStage?.id || selectedStageId);
    console.log('[LEARNING_NAV] 4. CURRENT_STAGE_COMPLETION_STATUS', selectedStage?.status || 'UNKNOWN');

    if (navigatingNext || !nextStage) {
      console.warn('[LEARNING_NAV] Navigation blocked: navigatingNext or !nextStage', { navigatingNext, nextStage });
      return;
    }
    setNavError(null);

    // Save the current task's valid answers and progress before navigating
    if (stageSaveRef.current) {
      try {
        setNavigatingNext(true);
        console.log('[LEARNING_NAV] 5. VALIDATION_RESULT: Calling stageSaveRef handler');
        console.log('[LEARNING_NAV] 6. SAVE_API_REQUEST_STARTED');

        const saveSuccess = await stageSaveRef.current();
        console.log('[LEARNING_NAV] 7. SAVE_API_RESPONSE_RECEIVED', { saveSuccess });

        if (saveSuccess === false) {
          setNavigatingNext(false);
          console.warn('[LEARNING_NAV] Save returned false, navigation aborted');
          return;
        }
      } catch (err) {
        console.error('[LEARNING_NAV] 8. SAVE_API_ERROR', err);
        setNavigatingNext(false);
        setNavError(err.message || 'Failed to save progress. Please try again.');
        return;
      } finally {
        setNavigatingNext(false);
      }
    } else {
      console.log('[LEARNING_NAV] 5. VALIDATION_RESULT: No stageSaveRef registered, proceeding');
    }

    // Optimistically unlock next stage so navigation always succeeds after successful save
    setStages(prev =>
      prev.map(s => {
        if (s.stage_number === (selectedStage ? selectedStage.stage_number : 0)) {
          return { ...s, status: 'COMPLETED', is_completed: true, progress_percentage: 100 };
        }
        if (s.stage_number === nextStage.stage_number) {
          return { ...s, is_unlocked: true };
        }
        return s;
      })
    );

    console.log('[LEARNING_NAV] 9. NAVIGATION_FUNCTION_EXECUTED', {
      targetStageNumber: nextStage.stage_number,
      targetStageId: nextStage.id
    });
    console.log('[LEARNING_NAV] 10. NEXT_ROUTE', `/learning?stage=${nextStage.stage_number}`);

    navigateToStage(nextStage.stage_number, true);

    console.log('[LEARNING_NAV] 11. NAVIGATION_COMPLETED', {
      openedStageNumber: nextStage.stage_number
    });
  };

  const renderStatusPill = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="status-pill completed"><CheckCircle2 size={11} className="inline mr-1" /> COMPLETED</span>;
      case 'IN PROGRESS':
        return <span className="status-pill in-progress"><Clock size={11} className="inline mr-1" /> IN PROGRESS</span>;
      case 'NOT STARTED':
      default:
        return <span className="status-pill not-started">NOT STARTED</span>;
    }
  };

  return (
    <div className="dash-layout">
      {/* Sidebar Navigation */}
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Top Header with Hamburger */}
      <header className="mobile-header-bar">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-hamburger-btn"
          aria-label="Open Navigation"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand-title" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/NoTreble-Classic-darktext.png"
            alt="No Tre(ou)ble"
            style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Main Learning Workspace */}
      <main className="dash-main learning-page-main">
        {/* Top Breadcrumb & Return Link */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            fontSize: '0.85rem',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#77728A' }}>
            <Link
              to="/learning"
              style={{
                color: '#7C3AED',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Learning Modules
            </Link>
            <span style={{ color: '#9690A7' }}>/</span>
            <span style={{ color: '#191B35', fontWeight: 750 }}>
              Breath Management
            </span>
          </div>

          <Link
            to="/learning"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#7C3AED',
              fontWeight: 700,
              fontSize: '0.84rem',
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: 10,
              backgroundColor: '#F4F0FF',
              border: '1px solid #EAE5F3',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(124, 58, 237, 0.08)'
            }}
          >
            <ChevronLeft size={16} /> Return to Modules
          </Link>
        </div>

        {/* 1. HORIZONTAL FIVE-STAGE NAVIGATION BAR */}
        {stages && stages.length > 0 && (
          <nav className="horizontal-stages-nav" aria-label="Curriculum Stages">
            <div className="horizontal-stages-track">
              {stages.map((st, idx) => {
                const isSelected = st.id === (selectedStage ? selectedStage.id : selectedStageId);
                const isCompleted = st.status === 'COMPLETED';
                const isInProgress = st.status === 'IN_PROGRESS';
                const prevSt = idx > 0 ? stages[idx - 1] : null;
                const isStepAccessible = st.stage_number === 1 || st.is_unlocked === true || isCompleted || st.status === 'IN PROGRESS' || (prevSt && (prevSt.status === 'COMPLETED' || prevSt.is_completed));
                const formattedNum = String(st.stage_number).padStart(2, '0');
                const hasNext = idx < stages.length - 1;

                // Exact 5 stage names
                const stageTitle = st.title || (
                  st.stage_number === 1 ? 'Introduction' :
                  st.stage_number === 2 ? 'What Do You Know?' :
                  st.stage_number === 3 ? 'How To Do It' :
                  st.stage_number === 4 ? "Let's Check Ourselves" :
                  'Keep It Going'
                );

                const stageSubtitle = st.subtitle || (
                  st.stage_number === 1 ? 'Get curious' :
                  st.stage_number === 2 ? 'Remember' :
                  st.stage_number === 3 ? 'Understand' :
                  st.stage_number === 4 ? 'Show what you know' :
                  'Fine-tune'
                );

                return (
                  <React.Fragment key={st.id || idx}>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(st)}
                      disabled={!isStepAccessible}
                      className={`horizontal-stage-step ${isSelected ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isInProgress ? 'in-progress' : ''} ${!isStepAccessible ? 'locked' : ''}`}
                      aria-current={isSelected ? 'step' : undefined}
                      title={!isStepAccessible ? `Stage ${st.stage_number} is locked. Complete preceding stages first.` : `${formattedNum} ${stageTitle}`}
                      style={{
                        cursor: isStepAccessible ? 'pointer' : 'not-allowed',
                        opacity: isStepAccessible ? 1 : 0.55
                      }}
                    >
                      <div className="horizontal-stage-circle">
                        {isCompleted ? <Check size={18} strokeWidth={3} /> : formattedNum}
                      </div>

                      <div className="horizontal-stage-details">
                        <span className="horizontal-stage-title">
                          {formattedNum} {stageTitle}
                        </span>
                        <span className="horizontal-stage-subtitle">
                          {isCompleted ? 'Completed ✓' : isSelected ? 'Active' : stageSubtitle}
                        </span>
                      </div>
                    </button>

                    {hasNext && (
                      <div className={`horizontal-stage-divider ${isCompleted ? 'completed' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </nav>
        )}

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#77728A' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <p>Loading 5-Stage Learning System...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 24, background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 12, color: '#991B1B' }}>
            <AlertCircle size={20} className="inline mr-2" />
            {error}
          </div>
        ) : (
          <div className="gagne-learning-container">
            {/* Full-Width Active Stage Content View (curriculum-sidebar removed) */}
            <div className="task-runner-workspace" style={{ width: '100%', minWidth: 0 }}>
              {selectedStage ? (
                <div>
                  {selectedStage.stage_number === 1 && (
                    <StageOneGainAttention
                      stage={activeStage}
                      onProceedToNextStage={() => navigateToStage(2, true)}
                      onRegisterSave={(fn) => { stageSaveRef.current = fn; }}
                      onUpdate={() => {
                        setStages(prev =>
                          prev.map(s => {
                            if (s.stage_number === 1) {
                              return { ...s, status: 'COMPLETED', is_completed: true, progress_percentage: 100 };
                            }
                            if (s.stage_number === 2) {
                              return { ...s, is_unlocked: true };
                            }
                            return s;
                          })
                        );
                        loadStages(true);
                        loadStageDetails(selectedStage.id, true);
                      }}
                    />
                  )}

                  {selectedStage.stage_number === 2 && (
                    <StageTwoStimulateRecall
                      stage={activeStage}
                      onProceedToNextStage={() => navigateToStage(3, true)}
                      onRegisterSave={(fn) => { stageSaveRef.current = fn; }}
                      onUpdate={() => {
                        setStages(prev =>
                          prev.map(s => {
                            if (s.stage_number === 2) {
                              return { ...s, status: 'COMPLETED', is_completed: true, progress_percentage: 100 };
                            }
                            if (s.stage_number === 3) {
                              return { ...s, is_unlocked: true };
                            }
                            return s;
                          })
                        );
                        loadStages(true);
                        loadStageDetails(selectedStage.id, true);
                      }}
                    />
                  )}

                  {selectedStage.stage_number === 3 && (
                    <StageThreePresentContent
                      stage={activeStage}
                      onProceedToNextStage={() => navigateToStage(4, true)}
                      onRegisterSave={(fn) => { stageSaveRef.current = fn; }}
                      onUpdate={() => {
                        setStages(prev =>
                          prev.map(s => {
                            if (s.stage_number === 3) {
                              return { ...s, status: 'COMPLETED', is_completed: true, progress_percentage: 100 };
                            }
                            if (s.stage_number === 4) {
                              return { ...s, is_unlocked: true };
                            }
                            return s;
                          })
                        );
                        loadStages(true);
                        loadStageDetails(selectedStage.id, true);
                      }}
                    />
                  )}

                  {selectedStage.stage_number === 4 && (
                    <StageFourAssessPerformance
                      stage={activeStage}
                      onProceedToNextStage={() => navigateToStage(5, true)}
                      onRegisterSave={(fn) => { stageSaveRef.current = fn; }}
                      onUpdate={() => {
                        setStages(prev =>
                          prev.map(s => {
                            if (s.stage_number === 4) {
                              return { ...s, status: 'COMPLETED', is_completed: true, progress_percentage: 100 };
                            }
                            if (s.stage_number === 5) {
                              return { ...s, is_unlocked: true };
                            }
                            return s;
                          })
                        );
                        loadStages(true);
                        loadStageDetails(selectedStage.id, true);
                      }}
                    />
                  )}

                  {selectedStage.stage_number === 5 && (
                    <StageFiveProvideFeedback
                      stage={activeStage}
                      onUpdate={() => {
                        loadStages(true);
                        loadStageDetails(selectedStage.id, true);
                      }}
                    />
                  )}

                  {/* Navigation Error Alert Banner */}
                  {navError && (
                    <div style={{
                      marginTop: 20,
                      padding: '12px 18px',
                      background: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      borderRadius: 12,
                      color: '#991B1B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: '0.92rem',
                      fontWeight: 650
                    }}>
                      <AlertCircle size={20} style={{ flexShrink: 0 }} />
                      <span>{navError}</span>
                    </div>
                  )}

                  {/* Previous / Next Navigation Buttons Bar */}
                  <div className="stage-bottom-nav-bar">
                    {prevStage ? (
                      <button
                        type="button"
                        onClick={handlePrevStage}
                        className="stage-bottom-btn prev"
                        title={`Go back to ${prevStage.title}`}
                      >
                        <ChevronLeft size={18} />
                        <span>Previous: {prevStage.title}</span>
                      </button>
                    ) : (
                      <div style={{ minWidth: 140 }} />
                    )}

                    <div className="stage-bottom-count">
                      Stage {currentStageIndex + 1} of {stages.length || 5}
                    </div>

                    {nextStage ? (
                      <button
                        type="button"
                        onClick={handleNextStage}
                        disabled={navigatingNext}
                        className="stage-bottom-btn next"
                        style={{
                          cursor: navigatingNext ? 'wait' : 'pointer',
                          opacity: navigatingNext ? 0.75 : 1
                        }}
                        title={`Proceed to ${nextStage.title}`}
                      >
                        {navigatingNext ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Saving & Opening Next...</span>
                          </>
                        ) : (
                          <>
                            <span>{`Next: ${nextStage.title}`}</span>
                            <ChevronRight size={18} />
                          </>
                        )}
                      </button>
                    ) : (
                      <div style={{ minWidth: 140 }} />
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Default 4 Objectives for Stage 01 (Fallback if API is loading)
const DEFAULT_STAGE01_OBJECTIVES = [
  {
    id: 1,
    title: 'Maintain POSTURE',
    title_line_1: 'Maintain',
    title_line_2: 'POSTURE',
    description: 'Demonstrate correct singing posture and diaphragmatic breathing techniques independently.',
    icon: 'Lightbulb',
    display_order: 1
  },
  {
    id: 2,
    title: 'Manage BREATHING',
    title_line_1: 'Manage',
    title_line_2: 'BREATHING',
    description: 'Perform controlled inhalation and exhalation exercises to regulate your airflow.',
    icon: 'Compass',
    display_order: 2
  },
  {
    id: 3,
    title: 'Apply VOCAL TECHNIQUES',
    title_line_1: 'Apply',
    title_line_2: 'VOCAL TECHNIQUES',
    description: 'Apply breath management techniques to a song!',
    icon: 'Megaphone',
    display_order: 3
  },
  {
    id: 4,
    title: 'Organise PRACTICE ROUTINE',
    title_line_1: 'Organise',
    title_line_2: 'PRACTICE ROUTINE',
    description: 'Develop and maintain a structured weekly breathing practice journal to track your exercises and progress.',
    icon: 'GitFork',
    display_order: 4
  }
];

function renderObjectiveCardIcon(iconName, size = 44) {
  const norm = (iconName || '').toLowerCase().trim();
  switch (norm) {
    case 'compass':
    case 'wind':
    case 'breathing':
    case 'airflow':
    case 'target':
      return <Compass size={size} strokeWidth={2.2} />;
    case 'megaphone':
    case 'mic':
    case 'vocal':
    case 'technique':
    case 'speaker':
      return <Megaphone size={size} strokeWidth={2.2} />;
    case 'gitfork':
    case 'calendarcheck':
    case 'calendar':
    case 'routine':
    case 'checklist':
    case 'fork':
    case 'directions':
    case 'branch':
      return <GitFork size={size} strokeWidth={2.2} />;
    case 'helpcircle':
    case 'help':
      return <HelpCircle size={size} strokeWidth={2.2} />;
    case 'activity':
      return <Activity size={size} strokeWidth={2.2} />;
    case 'music':
      return <Music size={size} strokeWidth={2.2} />;
    case 'lightbulb':
    case 'posture':
    default:
      return <Lightbulb size={size} strokeWidth={2.2} />;
  }
}

// ============================================================================
// STAGE 01: GAIN ATTENTION (Subtitle: Get curious)
// ============================================================================
function StageOneGainAttention({ stage, onUpdate, onProceedToNextStage, onRegisterSave }) {
  const introContent = stage.content?.find(c => c.content_type === 'introduction');
  const videoContent = stage.content?.find(c => c.content_type === 'intro_video' || c.content_type === 'video');

  // Shared state: ONLY ONE card can be flipped at a time
  const [activeCardId, setActiveCardId] = useState(null);

  const [objectives, setObjectives] = useState(
    stage.objectives && stage.objectives.length > 0 ? stage.objectives : DEFAULT_STAGE01_OBJECTIVES
  );

  const [videoWatched, setVideoWatched] = useState(
    stage.activities?.some(a => a.activity_id === 's1_video') || false
  );
  const [objectivesReviewed, setObjectivesReviewed] = useState(
    stage.activities?.some(a => a.activity_id === 's1_objectives') || false
  );

  // Register save handler for Stage 1
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(async () => {
        try {
          await api.acknowledgeStageObjectives(stage.id || 1).catch(() => {});
          await api.recordActivityProgress({
            stage_id: stage.id || 1,
            activity_id: 's1_video',
            activity_type: 'video'
          }).catch(() => {});
          await api.recordActivityProgress({
            stage_id: stage.id || 1,
            activity_id: 's1_objectives',
            activity_type: 'objectives'
          }).catch(() => {});
          if (onUpdate) onUpdate();
          return true;
        } catch (e) {
          return true;
        }
      });
    }
    return () => {
      if (onRegisterSave) onRegisterSave(null);
    };
  }, [stage.id, onRegisterSave, onUpdate]);

  // Fetch live objectives & acknowledgement status from MySQL
  useEffect(() => {
    let isMounted = true;
    api.getStageObjectives(stage.id || 1)
      .then(res => {
        if (!isMounted) return;
        if (res && res.success && res.objectives?.length > 0) {
          setObjectives(res.objectives);
        }
        if (res && res.acknowledged !== undefined) {
          setObjectivesReviewed(res.acknowledged);
        }
      })
      .catch(err => {
        console.warn('Could not refresh Stage 01 objectives from API:', err);
      });
    return () => { isMounted = false; };
  }, [stage.id]);

  const handleCardClick = (cardId) => {
    setActiveCardId(prev => (prev === cardId ? null : cardId));
    if (!objectivesReviewed) {
      handleReviewObjectives();
    }
  };

  const handleVideoCompleted = async () => {
    try {
      await api.recordActivityProgress({
        stage_id: stage.id,
        activity_id: 's1_video',
        activity_type: 'video'
      });
      setVideoWatched(true);
      if (onUpdate) onUpdate();
      setTimeout(() => {
        const objEl = document.querySelector('.objectives-flip-section');
        if (objEl) {
          objEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewObjectives = async () => {
    try {
      await api.acknowledgeStageObjectives(stage.id || 1);
      setObjectivesReviewed(true);
      if (onUpdate) onUpdate();
    } catch (e) {
      console.error('Acknowledgement API error, falling back:', e);
      try {
        await api.recordActivityProgress({
          stage_id: stage.id,
          activity_id: 's1_objectives',
          activity_type: 'objectives'
        });
        setObjectivesReviewed(true);
        if (onUpdate) onUpdate();
      } catch (err2) {
        console.error(err2);
      }
    }
  };

  const displayCards = objectives && objectives.length > 0 ? objectives : DEFAULT_STAGE01_OBJECTIVES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Combined Stage 01 Header & Video Section */}
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3', boxShadow: '0 2px 10px rgba(25, 27, 53, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                STAGE 01 · INTRODUCTION
              </span>
              <span style={{ color: '#77728A' }}>•</span>
              <span style={{ fontSize: '0.78rem', color: '#77728A' }}>Subtitle: Get curious</span>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#191B35', margin: 0, marginBottom: 8 }}>
              {introContent?.title || 'Breath Management'}
            </h2>
            <p style={{ fontSize: '0.96rem', color: '#77728A', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {introContent?.description || 'Watch this short video to see why your breath matters when you sing.\nWhen you are ready, press Next.'}
            </p>
          </div>
          {videoWatched && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15966A', background: '#E2F3EB', padding: '6px 12px', borderRadius: 9999, flexShrink: 0 }}>
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <CustomVideoPlayer
            src={videoContent?.content_url && !videoContent.content_url.includes('mov_bbb') ? videoContent.content_url : '/IMG_7993.MP4'}
            fallbackSrc="/intro-breath-video.mp4"
            onEnded={handleVideoCompleted}
            onMarkCompleted={handleVideoCompleted}
            isCompleted={videoWatched}
          />
        </div>
      </div>

      {/* NEW STAGE 01 OBJECTIVES SECTION WITH EXACT 4 INTERACTIVE 3D FLIP CARDS */}
      <div className="objectives-flip-section">
        {/* Main Heading & Subheading */}
        <div className="objectives-header">
          <h3 className="objectives-main-title">OBJECTIVES</h3>
          <p className="objectives-subtitle">BY THE END OF THIS MODULE YOU WILL BE ABLE TO:</p>
        </div>

        {/* Four Interactive 3D Flip Cards Grid */}
        <div className="objectives-cards-grid">
          {displayCards.map((card, idx) => {
            const cardKey = card.id || idx;
            const isFlipped = activeCardId === cardKey;
            const line1 = card.title_line_1 || card.title?.split(' ')[0] || '';
            const line2 = card.title_line_2 || card.title?.split(' ').slice(1).join(' ') || card.title || '';
            const themeClass = idx % 2 === 0 ? 'card-theme-blue' : 'card-theme-light';
            // Match reference screenshot typography for line 1 if Organize is used
            const line1Display = (line1.toLowerCase() === 'organize' || line1.toLowerCase() === 'organise') ? 'Organise' : line1;

            return (
              <div
                key={cardKey}
                className={`objective-flip-card-wrapper ${themeClass} ${isFlipped ? 'flipped' : ''}`}
                onClick={() => handleCardClick(cardKey)}
                role="button"
                tabIndex={0}
                aria-label={`Objective ${idx + 1}: ${line1Display} ${line2}. Click to flip.`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(cardKey);
                  }
                }}
              >
                <div className="objective-flip-card-inner">
                  {/* FRONT SIDE - ONLY ICON AND TITLE */}
                  <div className="objective-flip-card-front">
                    <div className="objective-card-inner-frame">
                      <div className="objective-card-icon-wrap">
                        {renderObjectiveCardIcon(card.icon, 46)}
                      </div>
                      <div className="objective-card-title-wrap">
                        <span className="objective-card-title-line1">{line1Display}</span>
                        <span className="objective-card-title-line2">{line2}</span>
                      </div>
                      <div className="objective-card-flip-btn" title="Click to view description">
                        <RotateCw size={14} />
                      </div>
                    </div>
                  </div>

                  {/* BACK SIDE */}
                  <div className={`objective-flip-card-back ${idx === 0 ? 'card-back-first-custom' : idx === 1 ? 'card-back-second-custom' : idx === 2 ? 'card-back-third-custom' : 'card-back-fourth-custom'}`}>
                    {idx === 0 ? (
                      <>
                        <div className="card-back-first-content">
                          <div className="card-back-title-wrap">
                            <h4 className="card-back-title-line1">Stand tall,</h4>
                            <h4 className="card-back-title-line2">Sing better!</h4>
                          </div>
                          <p className="card-back-first-desc">
                            {card.description || 'Demonstrate correct singing posture and diaphragmatic breathing techniques independently.'}
                          </p>
                        </div>
                        <div className="card-back-image-wrap">
                          <img
                            src="/guided-posture-therapy.png"
                            alt="Guided Posture Therapy in a Bright Studio"
                            className="card-back-posture-img"
                            onError={(e) => {
                              e.currentTarget.src = "/Guided Posture Therapy in a Bright Studio.png";
                            }}
                          />
                          <div className="objective-card-flip-btn back" title="Click to flip back">
                            <RotateCcw size={15} />
                          </div>
                        </div>
                      </>
                    ) : idx === 1 ? (
                      <>
                        <div className="card-back-second-content">
                          <h4 className="card-back-second-title">Do it right!</h4>
                          <p className="card-back-second-desc">
                            {card.description || 'Perform controlled inhalation and exhalation exercises to regulate your airflow'}
                          </p>
                        </div>
                        <div className="card-back-second-gif-wrap">
                          <img
                            src="/posture-breathing-animation-hd.gif"
                            alt="Breathe in, Breathe out Exercise Animation"
                            className="card-back-breathing-gif"
                            onError={(e) => {
                              e.currentTarget.src = "/posture_breathing_animation_HD.gif";
                            }}
                          />
                          <div className="objective-card-flip-btn back" title="Click to flip back">
                            <RotateCcw size={15} />
                          </div>
                        </div>
                      </>
                    ) : idx === 2 ? (
                      <>
                        <div className="card-back-third-content">
                          <div className="card-back-third-title-wrap">
                            <h4 className="card-back-third-title-line1">Take it to the</h4>
                            <h4 className="card-back-third-title-line2">real World!</h4>
                          </div>
                          <p className="card-back-third-desc">
                            {card.description || 'Apply breath management techniques to a song!'}
                          </p>
                        </div>
                        <div className="card-back-third-gif-wrap">
                          <img
                            src="/posture-animation-hd.gif"
                            alt="Apply Vocal Technique on Stage"
                            className="card-back-stage-gif"
                            onError={(e) => {
                              e.currentTarget.src = "/posture_animation_HD.gif";
                            }}
                          />
                          <div className="objective-card-flip-btn back" title="Click to flip back">
                            <RotateCcw size={15} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="card-back-fourth-content">
                          <h4 className="card-back-fourth-title">Stay motivated</h4>
                          <p className="card-back-fourth-desc">
                            {card.description || 'Develop and maintain a structured weekly breathing practice journal to track your exercises and progress.'}
                          </p>
                        </div>
                        <div className="card-back-fourth-gif-wrap">
                          <img
                            src="/converted-hd-loop.gif"
                            alt="Practice makes progress animation"
                            className="card-back-progress-gif"
                            onError={(e) => {
                              e.currentTarget.src = "/converted_HD_loop.gif";
                            }}
                          />
                          <div className="objective-card-flip-btn back" title="Click to flip back">
                            <RotateCcw size={15} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_STAGE02_QUESTIONS = [
  {
    id: 1,
    question: 'What words come to mind when you hear breath management ?',
    instructions: 'Type words or keywords that come to mind.',
    display_order: 1
  },
  {
    id: 2,
    question: 'What would you like to learn from this module?',
    instructions: 'Share what vocal goals or skills you hope to learn.',
    display_order: 2
  }
];

// ============================================================================
// STAGE 02: STIMULATE RECALL (Subtitle: Remember)
// ============================================================================
function StageTwoStimulateRecall({ stage, onUpdate, onProceedToNextStage, onRegisterSave }) {
  const questions = (stage.recallQuestions && stage.recallQuestions.length > 0)
    ? stage.recallQuestions
    : DEFAULT_STAGE02_QUESTIONS;
  const userAnswers = stage.userAnswers || [];

  // Peer Pin Board live data state
  const [peerBoards, setPeerBoards] = useState({});
  const [loadingBoards, setLoadingBoards] = useState(false);

  const loadPeerBoards = useCallback(async () => {
    try {
      setLoadingBoards(true);
      const res = await api.getPeerPinBoard(stage.id || 2);
      if (res && res.success && res.boards) {
        setPeerBoards(res.boards);
      }
    } catch (e) {
      console.warn('Could not load peer pin board:', e);
    } finally {
      setLoadingBoards(false);
    }
  }, [stage.id]);

  useEffect(() => {
    loadPeerBoards();
  }, [loadPeerBoards]);

  // Answer state initialized from existing saved answers
  const [answers, setAnswers] = useState(() => {
    const map = {};
    questions.forEach(q => {
      const existing = userAnswers.find(a => a.question_id === q.id);
      map[q.id] = existing ? existing.answer : '';
    });
    return map;
  });

  // Sync answers with stage.userAnswers when loaded/updated from MySQL
  useEffect(() => {
    if (stage.userAnswers && stage.userAnswers.length > 0) {
      setAnswers(prev => {
        const nextAnswers = { ...prev };
        let hasChanges = false;
        stage.userAnswers.forEach(a => {
          if (a.question_id && a.answer && (!prev[a.question_id] || prev[a.question_id].trim() === '')) {
            nextAnswers[a.question_id] = a.answer;
            hasChanges = true;
          }
        });
        return hasChanges ? nextAnswers : prev;
      });
    }
  }, [stage.userAnswers]);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Register save handler for the unified bottom Next button
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(async () => {
        setSaveError('');
        const payload = Object.entries(answers).map(([qId, ans]) => ({
          question_id: parseInt(qId, 10),
          answer: ans
        })).filter(item => item.answer && item.answer.trim().length > 0);

        if (payload.length > 0) {
          try {
            setSaving(true);
            const res = await api.saveRecallAnswers({
              stage_id: stage.id || 2,
              answers: payload
            });
            if (res && res.success) {
              setSaveSuccess(true);
              loadPeerBoards();
              if (onUpdate) onUpdate();
              return true;
            } else {
              const msg = res?.message || 'Could not save answers.';
              setSaveError(msg);
              throw new Error(msg);
            }
          } finally {
            setSaving(false);
          }
        }

        // If no answers typed, check if this stage was already completed in MySQL
        if (stage.is_completed || stage.status === 'COMPLETED' || (stage.userAnswers && stage.userAnswers.length > 0)) {
          return true;
        }

        const emptyMsg = 'Please provide an answer to at least one question before proceeding to Stage 03.';
        setSaveError(emptyMsg);
        throw new Error(emptyMsg);
      });
    }
    return () => {
      if (onRegisterSave) onRegisterSave(null);
    };
  }, [answers, stage, onRegisterSave, onUpdate, loadPeerBoards]);

  const handleSaveAnswers = async () => {
    setSaveError('');
    setSaveSuccess(false);

    const payload = Object.entries(answers).map(([qId, ans]) => ({
      question_id: parseInt(qId, 10),
      answer: ans
    })).filter(item => item.answer && item.answer.trim().length > 0);

    if (payload.length === 0) {
      setSaveError('Please provide an answer to at least one question before saving.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.saveRecallAnswers({
        stage_id: stage.id,
        answers: payload
      });

      if (res.success) {
        setSaveSuccess(true);
        loadPeerBoards();
        if (onUpdate) onUpdate();
        if (onProceedToNextStage) {
          setTimeout(() => {
            onProceedToNextStage();
          }, 600);
        }
      } else {
        setSaveError(res.message || 'Could not save answers.');
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to save answers to MySQL.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Knowledge Recall Questions (2 Questions) */}
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3', boxShadow: '0 2px 10px rgba(25, 27, 53, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            STAGE 02 · WHAT DO YOU KNOW?
          </span>
          <span style={{ color: '#77728A' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: '#77728A' }}>Subtitle: Remember</span>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#191B35', margin: 0, marginBottom: 6 }}>
            WHAT DO YOU ALREADY KNOW?
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#77728A', margin: 0, lineHeight: 1.55 }}>
            Take a moment to write down your existing experience. Your answers will be saved to your learning record in MySQL.
          </p>
        </div>

        {saveSuccess && (
          <div style={{ padding: '12px 16px', background: '#E2F3EB', border: '1px solid #A7F3D0', borderRadius: 10, color: '#065F46', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
            <CheckCircle2 size={18} /> Answers successfully saved to MySQL database!
          </div>
        )}

        {saveError && (
          <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#991B1B', marginBottom: 16, fontSize: '0.9rem' }}>
            <AlertCircle size={16} className="inline mr-2" />
            {saveError}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {questions.map((q, idx) => {
            const currentVal = answers[q.id] || '';
            const existingSubmitted = userAnswers.find(a => a.question_id === q.id);
            const pinItems = peerBoards[q.id] || [];

            return (
              <div
                key={q.id}
                style={{
                  background: '#F8F7FC',
                  border: '1px solid #EAE5F3',
                  borderRadius: 14,
                  padding: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    {idx + 1}
                  </span>
                  <label
                    htmlFor={`q-${q.id}`}
                    style={{ fontSize: '0.98rem', fontWeight: 750, color: '#191B35' }}
                  >
                    {q.question}
                  </label>
                </div>

                {q.instructions && (
                  <p style={{ fontSize: '0.78rem', color: '#77728A', margin: '0 0 10px 32px' }}>
                    Tip: {q.instructions}
                  </p>
                )}

                <textarea
                  id={`q-${q.id}`}
                  name={`recall_question_${q.id}`}
                  aria-label={q.question}
                  rows={3}
                  value={currentVal}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1.5px solid #EAE5F3',
                    fontSize: '0.9rem',
                    color: '#191B35',
                    backgroundColor: '#FFFFFF',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />

                {existingSubmitted && (
                  <div style={{ marginTop: 6, fontSize: '0.74rem', color: '#77728A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={12} color="#15966A" />
                    Last saved on: {new Date(existingSubmitted.submitted_at).toLocaleString()} (Attempt #{existingSubmitted.attempt_number})
                  </div>
                )}

                {/* PEER PIN BOARD MATCHING REFERENCE IMAGE 2 */}
                <div className="peer-pin-board-card">
                  <div className="peer-pin-board-header">
                    <span className="peer-pin-board-title">Peer pin board</span>
                    <span className="peer-pin-board-subtitle">
                      Live word cloud • updates as classmates submit
                    </span>
                  </div>

                  <div className="peer-pin-board-cloud">
                    {pinItems.length > 0 ? (
                      pinItems.map((item) => (
                        <span
                          key={item.id}
                          className="peer-pin-word"
                          style={{
                            color: item.color,
                            fontSize: item.fontSize,
                            fontWeight: item.fontWeight
                          }}
                          title={item.username ? `Submitted by @${item.username}` : ''}
                        >
                          {item.text}
                        </span>
                      ))
                    ) : (
                      <div className="peer-pin-empty">Live responses will appear here as classmates submit.</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={handleSaveAnswers}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              borderRadius: 10,
              fontWeight: 750,
              fontSize: '0.92rem',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Saving to MySQL...
              </>
            ) : (
              <>
                <Save size={16} /> SAVE ANSWERS
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STAGE 03: PRESENT CONTENT (Subtitle: Understand)
// ============================================================================
function StageThreePresentContent({ stage, onUpdate, onProceedToNextStage, onRegisterSave }) {
  const teachingVideo = stage.content?.find(c => c.content_type === 'teaching_video' || c.content_type === 'video');
  const tips = stage.breathingTips || [];
  const songs = stage.songs || [];

  const [activeSong, setActiveSong] = useState(songs[0] || null);
  const [videoViewed, setVideoViewed] = useState(
    stage.activities?.some(a => a.activity_id === 's3_video') || false
  );
  const [practisedSongs, setPractisedSongs] = useState(() => {
    return stage.activities?.filter(a => a.activity_id.startsWith('song_practice_')).map(a => a.activity_id) || [];
  });
  const [practicing, setPracticing] = useState(false);
  const [practiceSuccess, setPracticeSuccess] = useState('');

  // Register save / check handler for bottom Next button
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(async () => {
        if (stage.status === 'COMPLETED' || stage.is_completed) {
          return true;
        }
        const hasSong = stage.activities?.some(a => a.activity_id.startsWith('song_practice_') || a.activity_id === 's3_song');
        if (hasSong) {
          return true;
        }
        throw new Error("Please complete the Snowman song practice session to unlock Stage 04: Let's Check Ourselves.");
      });
    }
    return () => {
      if (onRegisterSave) onRegisterSave(null);
    };
  }, [stage, onRegisterSave]);

  const handleVideoCompleted = async () => {
    try {
      await api.recordActivityProgress({
        stage_id: stage.id,
        activity_id: 's3_video',
        activity_type: 'video'
      });
      setVideoViewed(true);
      if (onUpdate) onUpdate();
      setTimeout(() => {
        const p2 = document.querySelector('.part-two-container');
        if (p2) {
          p2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkSongPractised = async (song) => {
    if (!song) return;
    try {
      setPracticing(true);
      setPracticeSuccess('');
      const res = await api.recordSongPractice(song.id, {
        stage_id: stage.id,
        duration_minutes: 8
      });
      if (res.success) {
        setPractisedSongs([...practisedSongs, `song_practice_${song.id}`]);
        setPracticeSuccess(`"${song.title}" marked as practised and logged into your Practice Journal!`);
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPracticing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* SECTION A: Teaching Video Player */}
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3', boxShadow: '0 2px 10px rgba(25, 27, 53, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            STAGE 03 · HOW TO DO IT
          </span>
          <span style={{ color: '#77728A' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: '#77728A' }}>Subtitle: Understand</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191B35', margin: 0, letterSpacing: '-0.01em' }}>
              {teachingVideo?.title || 'Part 1 • How breathing works'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#77728A', margin: '6px 0 0 0', lineHeight: 1.5 }}>
              {teachingVideo?.description || 'Watch the full video before moving to the practice guide'}
            </p>
          </div>
          {videoViewed && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#15966A', background: '#E2F3EB', padding: '6px 12px', borderRadius: 9999, flexShrink: 0 }}>
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>

        <CustomVideoPlayer
          src={teachingVideo?.content_url || 'https://www.w3schools.com/html/mov_bbb.mp4'}
          onEnded={handleVideoCompleted}
          onMarkCompleted={handleVideoCompleted}
          isCompleted={videoViewed}
        />

        {/* Video Transcript Component */}
        <VideoTranscriptSection videoId={teachingVideo?.id || 5} stageId={stage?.id || 3} />
      </div>

      {/* SECTION B: PART 02 INTERACTIVE PRACTICE (Posture, Breathe, Song) */}
      <PartTwoInteractivePractice stage={stage} onUpdate={onUpdate} onProceedToNextStage={onProceedToNextStage} />
    </div>
  );
}

// ============================================================================
// STAGE 04: ASSESS PERFORMANCE (Subtitle: Show what you know)
// ============================================================================
function StageFourAssessPerformance({ stage, onUpdate, onProceedToNextStage, onRegisterSave }) {
  // Filter out any matching_pairs / Match the Part challenges completely
  const challenges = (stage.challenges || []).filter(
    ch => ch.challenge_type !== 'matching_pairs' && !ch.title?.toLowerCase().includes('match the part')
  );
  const recordings = stage.recordings || [];

  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const activeChallenge = challenges[activeChallengeIdx] || challenges[0] || { challenge_type: 'myth_or_fact' };

  // Register save / check handler for Stage 4
  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(async () => {
        if (stage.status === 'COMPLETED' || stage.is_completed) {
          return true;
        }
        const hasRec = (stage.recordings && stage.recordings.length > 0) || stage.activities?.some(a => a.activity_id === 'song_recording' || a.activity_id === 's4_student_recording');
        if (hasRec) {
          return true;
        }
        throw new Error("Please submit your song recording performance to complete Stage 04 and unlock Stage 05.");
      });
    }
    return () => {
      if (onRegisterSave) onRegisterSave(null);
    };
  }, [stage, onRegisterSave]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stage Header */}
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            STAGE 04 · LET'S CHECK OURSELVES
          </span>
          <span style={{ color: '#77728A' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: '#77728A' }}>Subtitle: Show what you know</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#191B35', margin: 0, marginBottom: 12 }}>
          TEST YOUR BREATH MANAGEMENT KNOWLEDGE
        </h2>
        <p style={{ fontSize: '0.96rem', color: '#77728A', lineHeight: 1.6, margin: 0 }}>
          {stage.description || 'Test your breath management knowledge with interactive challenges, complete your personal learning reflection, and record your song performance.'}
        </p>
      </div>

      {/* SECTION A: INTERACTIVE CHALLENGE (Myth or Fact) */}
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3' }}>
        <MythOrFactChallenge
          challenge={activeChallenge}
          stageId={stage.id}
          onCompleted={() => {
            if (onUpdate) onUpdate();
            setTimeout(() => {
              const el = document.getElementById('personal-reflection-pinboard');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 600);
          }}
        />
      </div>

      {/* SECTION B: PERSONAL LEARNING REFLECTION PINBOARD (Three Reflection Questions & Sticky Note Cards) */}
      <div id="personal-reflection-pinboard">
        <PersonalLearningPinboard
          stageId={stage.id}
          moduleId={1}
          onUpdate={() => {
            if (onUpdate) onUpdate();
            setTimeout(() => {
              const el = document.getElementById('student-audio-recorder-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 600);
          }}
        />
      </div>

      {/* SECTION C: RECORD YOUR SONG */}
      <div id="student-audio-recorder-section" style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#2563EB',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: '#EFF6FF',
                padding: '2px 8px',
                borderRadius: 9999
              }}
            >
              PART 3 · AUDIO RECORDING
            </span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#191B35', margin: 0, marginBottom: 4 }}>
            LET YOUR VOICE BE HEARD
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#77728A', margin: 0 }}>
            Now apply what you have learned. Record yourself singing the song you practised and submit your performance for assessment.
          </p>
        </div>

        <StudentAudioRecorder
          stageId={stage.id}
          onProceedToNextStage={onProceedToNextStage}
          onRecordingUploaded={() => {
            if (onUpdate) onUpdate();
          }}
        />

        {/* Existing Submissions */}
        {recordings.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid #EAE5F3', paddingTop: 18 }}>
            <h5 style={{ fontSize: '0.9rem', fontWeight: 750, color: '#191B35', marginBottom: 12 }}>
              Submitted Recordings ({recordings.length})
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recordings.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#F8F7FC',
                    border: '1px solid #EAE5F3',
                    borderRadius: 10,
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Music size={16} color="#7C3AED" />
                    <div>
                      <span style={{ fontWeight: 700, color: '#191B35' }}>
                        Attempt #{rec.attempt_number}
                      </span>
                      <span style={{ color: '#77728A', marginLeft: 8, fontSize: '0.78rem' }}>
                        {new Date(rec.submitted_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <audio
                    controls
                    src={api.getRecordingAudioUrl ? api.getRecordingAudioUrl(rec.id) : `/api/learning/recordings/${rec.id}/audio`}
                    style={{ height: 32 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ============================================================================
// STAGE 05: KEEP IT GOING (Subtitle: Fine-tune)
// ============================================================================
function StageFiveProvideFeedback({ stage, onUpdate }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCommitmentSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    if (onUpdate) onUpdate();
  };

  const handleSessionsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    if (onUpdate) onUpdate();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Stage Header */}
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#0D9488',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: '#E6F4F1',
              padding: '3px 10px',
              borderRadius: 9999
            }}
          >
            STAGE 05 · KEEP IT GOING
          </span>
          <span style={{ color: '#77728A' }}>•</span>
          <span style={{ fontSize: '0.78rem', color: '#77728A', fontWeight: 600 }}>Subtitle: Fine-tune</span>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#143137', margin: 0, marginBottom: 12 }}>
          PRACTICE COMMITMENT & LEARNING JOURNAL
        </h2>
        <p style={{ fontSize: '0.96rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
          {stage.description || 'Decide your weekly practice commitment, track sessions in your Learning Journal, and review your Module 1 completion summary.'}
        </p>
      </div>

      {/* SECTION 1: YOUR PRACTICE COMMITMENT */}
      <YourPracticeCommitment onCommitmentSaved={handleCommitmentSaved} />

      {/* SECTION 2: LEARNING JOURNAL */}
      <LearningJournalKanban onSessionsUpdated={handleSessionsUpdated} />

      {/* SECTION 3: MODULE 1 COMPLETE! */}
      <ModuleCompleteCard refreshTrigger={refreshTrigger} />
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// 1. Custom Responsive Video Player
function CustomVideoPlayer({ src, fallbackSrc, onEnded, onMarkCompleted, isCompleted }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(e => console.warn('Video play interrupted:', e));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * (duration || 1);
    videoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div style={{ position: 'relative', width: '100%', backgroundColor: '#191B35', borderRadius: 14, overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={(e) => {
          if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc;
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={togglePlay}
        style={{ width: '100%', maxHeight: 440, display: 'block', backgroundColor: '#000000', cursor: 'pointer' }}
      />

      {/* Video Custom Control Bar */}
      <div
        style={{
          padding: '10px 16px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4))',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#FFFFFF'
        }}
      >
        <button
          onClick={togglePlay}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#FFFFFF" />}
        </button>

        <span style={{ fontSize: '0.78rem', color: '#CBD5E1', minWidth: 70 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Scrub progress bar */}
        <input
          id="video-seek-slider"
          name="video_seek"
          aria-label="Video playback progress"
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          style={{ flex: 1, cursor: 'pointer', accentColor: '#7C3AED' }}
        />

        <button
          onClick={toggleMute}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <button
          onClick={handleFullscreen}
          style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 4 }}
          aria-label="Fullscreen"
        >
          <Maximize2 size={18} />
        </button>

        {!isCompleted && (
          <button
            onClick={onMarkCompleted}
            style={{
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            Mark Watched
          </button>
        )}
      </div>
    </div>
  );
}

// 2. Custom Audio Player for Songs
function CustomAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * (duration || 1);
    audioRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div style={{ background: '#FFFFFF', padding: 14, borderRadius: 12, border: '1px solid #EAE5F3' }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={togglePlay}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} fill="#FFFFFF" />}
        </button>

        <div style={{ flex: 1 }}>
          <input
            id="audio-seek-slider"
            name="audio_seek"
            aria-label="Audio playback progress"
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            style={{ width: '100%', accentColor: '#7C3AED', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#77728A', marginTop: 2 }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Interactive Breathing Simulation Guide (Lungs Simulation Placeholder)
function InteractiveBreathingSimulationGuide() {
  const [phase, setPhase] = useState('inhale'); // inhale | hold | exhale
  const [seconds, setSeconds] = useState(4);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          if (phase === 'inhale') {
            setPhase('hold');
            return 2;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 6;
          } else {
            setPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, phase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: '4px solid #7C3AED',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: active ? (phase === 'inhale' ? 'scale(1.2)' : phase === 'hold' ? 'scale(1.2)' : 'scale(0.9)') : 'scale(1)',
          transition: 'transform 2s ease-in-out',
          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.15)'
        }}
      >
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
          {active ? phase : 'READY'}
        </span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#191B35' }}>
          {active ? `${seconds}s` : 'START'}
        </span>
      </div>

      <button
        onClick={() => {
          setActive(!active);
          setPhase('inhale');
          setSeconds(4);
        }}
        style={{
          padding: '8px 18px',
          borderRadius: 8,
          backgroundColor: active ? '#991B1B' : '#7C3AED',
          color: '#FFFFFF',
          fontSize: '0.82rem',
          fontWeight: 750,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {active ? 'Stop Simulation' : 'Start Diaphragm Cycle Guide'}
      </button>
    </div>
  );
}

// 5. In-Browser Audio Recorder (MediaRecorder API)
function StudentAudioRecorder({ stageId, onRecordingUploaded, onProceedToNextStage }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [comments, setComments] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordSeconds(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType: mime });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      alert(`Microphone access error: ${err.message}. Please allow microphone permissions.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileToUpload(file);
      setAudioUrl(URL.createObjectURL(file));
      setAudioBlob(file);
    }
  };

  const submitRecording = async () => {
    if (!audioBlob) return;
    try {
      setUploading(true);
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append('audio', audioBlob, fileToUpload ? fileToUpload.name : `voice-recording-${Date.now()}.webm`);
      formData.append('stage_id', stageId);
      formData.append('duration_seconds', recordSeconds);
      formData.append('comments', comments);

      const res = await api.uploadStudentRecording(formData);
      if (res.success) {
        setUploadSuccess(true);
        setAudioBlob(null);
        setAudioUrl(null);
        setFileToUpload(null);
        setComments('');
        if (onRecordingUploaded) onRecordingUploaded();
        if (onProceedToNextStage) {
          setTimeout(() => {
            onProceedToNextStage();
          }, 700);
        }
      }
    } catch (e) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ background: '#F8F7FC', border: '1px solid #EAE5F3', borderRadius: 14, padding: 20 }}>
      {uploadSuccess && (
        <div style={{ padding: '12px 16px', background: '#E2F3EB', border: '1px solid #A7F3D0', borderRadius: 10, color: '#065F46', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> Recording submitted successfully to MySQL!
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        {!recording ? (
          <button
            onClick={startRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 10,
              backgroundColor: '#991B1B',
              color: '#FFFFFF',
              fontWeight: 750,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Mic size={18} /> Record Voice
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 20px',
              borderRadius: 10,
              backgroundColor: '#191B35',
              color: '#FFFFFF',
              fontWeight: 750,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Square size={18} /> Stop Recording ({formatTimer(recordSeconds)})
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.82rem', color: '#77728A' }}>or upload audio file:</span>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAE5F3',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#7C3AED',
              cursor: 'pointer'
            }}
          >
            <Upload size={14} /> Select File
            <input
              id="student-audio-file"
              name="student_audio_file"
              aria-label="Upload audio recording file"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {audioUrl && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7C3AED', marginBottom: 6 }}>
            Preview Your Performance
          </div>
          <audio controls src={audioUrl} style={{ width: '100%', height: 36 }} />
        </div>
      )}

      <div>
        <label htmlFor="trainer-comments" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#191B35', display: 'block', marginBottom: 4 }}>
          Optional Comments for Trainer
        </label>
        <textarea
          id="trainer-comments"
          name="trainer_comments"
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Notes on where you focused your breath..."
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #EAE5F3', fontSize: '0.85rem', boxSizing: 'border-box' }}
        />
      </div>

      {audioBlob && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={submitRecording}
            disabled={uploading}
            style={{
              padding: '10px 22px',
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              borderRadius: 8,
              fontWeight: 750,
              fontSize: '0.88rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {uploading ? 'Uploading...' : 'SUBMIT RECORDING FOR ASSESSMENT'}
          </button>
        </div>
      )}
    </div>
  );
}
