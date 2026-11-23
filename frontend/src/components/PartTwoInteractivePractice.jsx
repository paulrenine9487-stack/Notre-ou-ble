import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import PostureViewer3D from './PostureViewer3D';
import InteractiveBreathingTimer from './InteractiveBreathingTimer';
import InteractiveSongPractice from './InteractiveSongPractice';
import {
  CheckCircle2,
  Circle,
  Wind,
  Music,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Award,
  Volume2,
  Play
} from 'lucide-react';

export default function PartTwoInteractivePractice({
  stage,
  onUpdate = () => { }
}) {
  // Navigation Tabs: 'posture' | 'breathe' | 'song' (persisted in sessionStorage)
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return sessionStorage.getItem('notreoble_part2_active_tab') || 'posture';
    } catch {
      return 'posture';
    }
  });

  const setActiveTab = (tab) => {
    try {
      sessionStorage.setItem('notreoble_part2_active_tab', tab);
    } catch { }
    setActiveTabState(tab);
  };

  // Backend Part 2 Data
  const [partData, setPartData] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [checklistItems, setChecklistItems] = useState([]);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(null);

  // Student Posture Progress
  const [checkedItems, setCheckedItems] = useState([]);
  const [isPostureCompleted, setIsPostureCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Tab 2 & 3 Progress
  const [breatheChecked, setBreatheChecked] = useState([]);
  const [isBreatheCompleted, setIsBreatheCompleted] = useState(false);
  const [songChecked, setSongChecked] = useState([]);
  const [isSongCompleted, setIsSongCompleted] = useState(false);
  const [songSuccessMsg, setSongSuccessMsg] = useState('');

  // Fallback default checklist
  const DEFAULT_CHECKLIST = [
    { id: 1, item_text: 'Feet about hip-width apart.', is_required: true },
    { id: 2, item_text: 'Knees soft, not locked.', is_required: true },
    { id: 3, item_text: 'Spine long, chin level.', is_required: true },
    { id: 4, item_text: 'Shoulders down and relaxed.', is_required: true },
    { id: 5, item_text: 'Hands loose at your sides.', is_required: true }
  ];

  // Fallback default indicators
  const DEFAULT_INDICATORS = [
    {
      id: 1,
      title: 'Head level',
      description: 'Align your ears directly over your shoulders. Keep your chin parallel to the floor without tucking in or tilting up.',
      body_region: 'head',
      icon: 'head'
    },
    {
      id: 2,
      title: 'Shoulders loose',
      description: 'Drop your shoulders naturally down and slightly back. Release any trapped trapezius tension.',
      body_region: 'shoulders',
      icon: 'shoulders'
    },
    {
      id: 3,
      title: 'Chest forward',
      description: 'Keep your chest comfortably lifted and forward without arching your back. Maintain open, buoyant expansion as you sing.',
      body_region: 'ribs',
      icon: 'ribs'
    },
    {
      id: 4,
      title: 'Knees soft, not locked',
      description: 'Maintain a slight, elastic micro-bend in both knees to allow grounding and free pelvic alignment.',
      body_region: 'knees',
      icon: 'knees'
    },
    {
      id: 5,
      title: 'Feet hip-width apart',
      description: 'Place both feet firmly hip-width apart with weight balanced evenly between heel and ball of foot.',
      body_region: 'feet',
      icon: 'feet'
    }
  ];

  // Load Part 2 configuration and student progress from MySQL
  const loadPartData = useCallback(async () => {
    try {
      const res = await api.getPartSection(stage?.id || 3, 2);
      if (res && res.success) {
        setPartData(res.part);
        if (Array.isArray(res.tabs) && res.tabs.length > 0) {
          setTabs(res.tabs);
        }
        if (Array.isArray(res.indicators) && res.indicators.length > 0) {
          setIndicators(res.indicators);
          setSelectedIndicatorId(res.indicators[0].id);
        } else {
          setIndicators(DEFAULT_INDICATORS);
          setSelectedIndicatorId(DEFAULT_INDICATORS[0].id);
        }

        if (Array.isArray(res.checklist) && res.checklist.length > 0) {
          setChecklistItems(res.checklist);
        } else {
          setChecklistItems(DEFAULT_CHECKLIST);
        }

        // Restore Student Progress
        if (res.postureProgress) {
          setCheckedItems(res.postureProgress.checked_items || []);
          setIsPostureCompleted(res.postureProgress.status === 'COMPLETED');
        }

        if (Array.isArray(res.partProgress)) {
          const breatheProg = res.partProgress.find(p => p.tab_key === 'breathe');
          if (breatheProg && breatheProg.status === 'COMPLETED') {
            setIsBreatheCompleted(true);
          }
          const songProg = res.partProgress.find(p => p.tab_key === 'song');
          if (songProg && songProg.status === 'COMPLETED') {
            setIsSongCompleted(true);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load Part 2 section from backend:', err);
      setIndicators(DEFAULT_INDICATORS);
      setChecklistItems(DEFAULT_CHECKLIST);
    }
  }, [stage?.id]);

  useEffect(() => {
    loadPartData();
  }, [loadPartData]);

  // Handle Checklist item toggle
  const handleToggleChecklistItem = async (itemId) => {
    const updated = checkedItems.includes(itemId)
      ? checkedItems.filter(id => id !== itemId)
      : [...checkedItems, itemId];

    setCheckedItems(updated);
    setStatusMessage(null);

    const isAllChecked = (checklistItems.length > 0 ? checklistItems : DEFAULT_CHECKLIST).every(
      item => updated.includes(item.id)
    );
    setIsPostureCompleted(isAllChecked);

    // Save selection in MySQL silently in background without triggering parent page reload
    try {
      await api.savePostureProgress(2, {
        checked_items: updated,
        is_completed: isAllChecked
      });
      if (isAllChecked) {
        await api.completePartTab(2, { tab_key: 'posture', duration_minutes: 5 });
      }
    } catch (err) {
      console.error('Failed to save posture progress to MySQL:', err);
    }
  };

  // Handle "Next: Breathe →" button
  const handleNextBreathe = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Immediately open Breathe tab on current page without refreshing
    setActiveTab('breathe');
    setStatusMessage(null);

    // Save posture progress in background silently without page reload
    (async () => {
      try {
        const activeList = checklistItems.length > 0 ? checklistItems : DEFAULT_CHECKLIST;
        const isComplete = activeList.length > 0 && activeList.every(i => checkedItems.includes(i.id));

        await api.savePostureProgress(2, {
          checked_items: checkedItems,
          is_completed: isComplete
        });
        if (isComplete) {
          setIsPostureCompleted(true);
          await api.completePartTab(2, { tab_key: 'posture', duration_minutes: 5 });
        }
      } catch (err) {
        console.error('Save posture progress error:', err);
      }
    })();
  };

  // Handle "Next: Song →" button in Breathe tab
  const handleCompleteBreathe = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsBreatheCompleted(true);
    setActiveTab('song');

    (async () => {
      try {
        await api.completePartTab(2, { tab_key: 'breathe', duration_minutes: 5 });
      } catch (err) {
        console.error(err);
      }
    })();
  };

  // Handle "Complete Practice Session" in Song tab
  const handleCompleteSongPractice = async () => {
    try {
      setSavingProgress(true);
      setSongSuccessMsg('');
      const res = await api.completePartTab(2, { tab_key: 'song', duration_minutes: 10 });
      if (res && res.success) {
        setIsSongCompleted(true);
        setSongSuccessMsg('Great job! Amazing Grace breath practice logged to your Practice Journal and Dashboard!');
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProgress(false);
    }
  };

  const activeChecklist = checklistItems.length > 0 ? checklistItems : DEFAULT_CHECKLIST;
  const activeIndicators = indicators.length > 0 ? indicators : DEFAULT_INDICATORS;
  const completedCount = checkedItems.length;
  const totalCount = activeChecklist.length;
  const checklistPercent = Math.round((completedCount / totalCount) * 100);

  // Tab Header title and subtitle based on active tab
  const currentTabInfo = {
    posture: {
      stepLabel: 'Part 2 • Step 1: Posture',
      subtitle: 'Stand tall, stay relaxed'
    },
    breathe: {
      stepLabel: 'Part 2 • Step 2: Breathe',
      subtitle: 'Practice controlled breathing to support your voice'
    },
    song: {
      stepLabel: 'Part 2 • Step 3: Sing it — "Snowman"',
      subtitle: "Apply what we're learning in a song."
    }
  }[activeTab];

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #EAE5F3',
        padding: '20px 22px',
        boxShadow: '0 4px 20px rgba(25, 27, 53, 0.04)'
      }}
      className="part-two-container"
    >
      {/* 1. PAGE HEADER: Title, Subtitle, and 3 Interactive Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: '1px solid #F1F4F8'
        }}
      >
        {/* Left: Step Heading & Subtitle */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#7C3AED',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              STAGE 03 · PART 02 · INTERACTIVE PRACTICE
            </span>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#168B7A' }}>
              {currentTabInfo.stepLabel}
            </span>
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#191B35', margin: 0, letterSpacing: '-0.01em' }}>
            {currentTabInfo.stepLabel}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '3px 0 0 0', fontWeight: 500 }}>
            {currentTabInfo.subtitle}
          </p>
        </div>

        {/* Right: Three Interactive Navigation Tabs (Posture / Breathe / Song) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#F8FAFC',
            padding: 4,
            borderRadius: 9999,
            border: '1px solid #E2E8F0',
            gap: 4
          }}
          role="tablist"
        >
          {/* Tab 1: Posture */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'posture'}
            onClick={() => setActiveTab('posture')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 9999,
              fontSize: '0.88rem',
              fontWeight: 750,
              cursor: 'pointer',
              border: activeTab === 'posture' ? 'none' : '1px solid transparent',
              background: activeTab === 'posture' ? '#168B7A' : 'transparent',
              color: activeTab === 'posture' ? '#FFFFFF' : '#475569',
              boxShadow: activeTab === 'posture' ? '0 2px 8px rgba(22, 139, 122, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span>1. Posture</span>
            {isPostureCompleted && (
              <CheckCircle2 size={15} color={activeTab === 'posture' ? '#FFFFFF' : '#168B7A'} />
            )}
          </button>

          {/* Tab 2: Breathe */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'breathe'}
            onClick={() => setActiveTab('breathe')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 9999,
              fontSize: '0.88rem',
              fontWeight: 750,
              cursor: 'pointer',
              border: activeTab === 'breathe' ? 'none' : '1px solid transparent',
              background: activeTab === 'breathe' ? '#168B7A' : 'transparent',
              color: activeTab === 'breathe' ? '#FFFFFF' : '#475569',
              boxShadow: activeTab === 'breathe' ? '0 2px 8px rgba(22, 139, 122, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span>2. Breathe</span>
            {isBreatheCompleted && (
              <CheckCircle2 size={15} color={activeTab === 'breathe' ? '#FFFFFF' : '#168B7A'} />
            )}
          </button>

          {/* Tab 3: Song */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'song'}
            onClick={() => setActiveTab('song')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              borderRadius: 9999,
              fontSize: '0.88rem',
              fontWeight: 750,
              cursor: 'pointer',
              border: activeTab === 'song' ? 'none' : '1px solid transparent',
              background: activeTab === 'song' ? '#168B7A' : 'transparent',
              color: activeTab === 'song' ? '#FFFFFF' : '#475569',
              boxShadow: activeTab === 'song' ? '0 2px 8px rgba(22, 139, 122, 0.3)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <span>3. Song</span>
            {isSongCompleted && (
              <CheckCircle2 size={15} color={activeTab === 'song' ? '#FFFFFF' : '#168B7A'} />
            )}
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TAB 01: POSTURE (Two-Column Layout: Left 55% 3D Viewer / Right 45% Checklist) */}
      {/* ===================================================================== */}
      {activeTab === 'posture' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: 24,
            alignItems: 'start'
          }}
          className="posture-two-column-layout"
        >
          {/* LEFT COLUMN (approx 55%): Interactive 3D Human Posture Visualization */}
          <div>
            <PostureViewer3D
              indicators={activeIndicators}
              selectedIndicatorId={selectedIndicatorId}
              onSelectIndicator={(id) => setSelectedIndicatorId(id)}
              modelAssetUrl={partData?.model_asset_url || null}
            />
          </div>

          {/* RIGHT COLUMN (approx 45%): Posture Checklist & Learning Instructions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              background: '#FFFFFF',
              borderRadius: 18,
              border: '1px solid #E2E8F0',
              padding: '24px 22px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
            }}
          >
            {/* Checklist Heading & Real-time Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
                  Posture checklist
                </h3>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 750,
                    color: completedCount === totalCount ? '#168B7A' : '#64748B',
                    background: completedCount === totalCount ? '#E2F3EB' : '#F1F5F9',
                    padding: '4px 10px',
                    borderRadius: 8
                  }}
                >
                  {completedCount} of {totalCount} posture points checked
                </span>
              </div>

              <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                Stand comfortably in front of a mirror or camera. Check each alignment point as you settle into your singing posture.
              </p>

              {/* Progress track */}
              <div
                style={{
                  width: '100%',
                  height: 6,
                  background: '#E2E8F0',
                  borderRadius: 9999,
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${checklistPercent}%`,
                    height: '100%',
                    background: completedCount === totalCount ? '#168B7A' : 'linear-gradient(90deg, #168B7A, #38B2AC)',
                    borderRadius: 9999,
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Status Message (if incomplete or saved) */}
            {statusMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: statusMessage.type === 'warning' ? '#FEF3C7' : '#E2F3EB',
                  border: `1px solid ${statusMessage.type === 'warning' ? '#FCD34D' : '#A7F3D0'}`,
                  color: statusMessage.type === 'warning' ? '#92400E' : '#065F46',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <AlertCircle size={18} flexShrink={0} />
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Five Posture Checklist Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeChecklist.map((item, idx) => {
                const isChecked = checkedItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklistItem(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: isChecked ? '1px solid #168B7A' : '1px solid #E2E8F0',
                      background: isChecked ? '#F0F9F7' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      boxShadow: isChecked
                        ? '0 2px 8px rgba(22, 139, 122, 0.08)'
                        : '0 1px 3px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    {/* Checkbox Icon */}
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isChecked ? '#168B7A' : '#FFFFFF',
                        border: isChecked ? 'none' : '2px solid #CBD5E1',
                        color: '#FFFFFF',
                        flexShrink: 0,
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {isChecked ? (
                        <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.8} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8' }}>{idx + 1}</span>
                      )}
                    </div>

                    {/* Item Text */}
                    <span
                      style={{
                        fontSize: '0.94rem',
                        fontWeight: isChecked ? 700 : 600,
                        color: isChecked ? '#168B7A' : '#1E293B',
                        flex: 1,
                        lineHeight: 1.45,
                        textDecoration: isChecked ? 'none' : 'none'
                      }}
                    >
                      {item.item_text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Large Next Button: "Next: Breathe →" */}
            <button
              type="button"
              onClick={handleNextBreathe}
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '15px 24px',
                background: completedCount === totalCount
                  ? 'linear-gradient(135deg, #168B7A 0%, #0D685B 100%)'
                  : '#168B7A',
                color: '#FFFFFF',
                borderRadius: 14,
                border: 'none',
                fontSize: '1.02rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(22, 139, 122, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>Next: Breathe</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 02: BREATHE (Interactive Breathing Simulation & Practice Pacer)   */}
      {/* ===================================================================== */}
      {activeTab === 'breathe' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Dynamic Breathing Timer & Lungs/Diaphragm Simulation */}
          <InteractiveBreathingTimer
            initialLevels={partData?.breathingLevels || []}
            onSessionComplete={() => {
              setIsBreatheCompleted(true);
            }}
          />

          {/* Unified Navigation Footer - Single Frame, No Extra Card Box */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 12,
              marginTop: 12,
              borderTop: '1px solid #F1F5F9'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('posture')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              ← Back to Posture
            </button>
            <button
              type="button"
              onClick={handleCompleteBreathe}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 22px',
                borderRadius: 10,
                border: 'none',
                background: '#168B7A',
                color: '#FFFFFF',
                fontSize: '0.90rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(22, 139, 122, 0.25)',
                transition: 'all 0.18s ease'
              }}
            >
              <span>Next: Song</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 03: SING IT – "SNOWMAN" SONG PRACTICE MODULE */}
      {/* ===================================================================== */}
      {activeTab === 'song' && (
        <InteractiveSongPractice
          onBackToBreathe={() => setActiveTab('breathe')}
          onSessionComplete={() => {
            setIsSongCompleted(true);
            if (onUpdate) onUpdate();
          }}
        />
      )}
    </div>
  );
}
