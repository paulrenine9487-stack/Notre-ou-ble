import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Repeat,
  Music,
  Check,
  Award,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function InteractiveSongPractice({ onBackToBreathe, onSessionComplete, onProceedToNextStage }) {
  // Practice Level State: 'beginner' | 'intermediate' | 'advanced'
  const [selectedLevelKey, setSelectedLevelKey] = useState('beginner');

  // Song Content & Levels Data
  const [songData, setSongData] = useState({
    song_title: 'Snowman',
    artist_name: 'Sia',
    subtitle: 'Audio guide',
    instructions: "Now let's use your breathing in a real song. Listen once. Then choose your level and sing along, taking a breath wherever you see a tick on the score.\n\nStart at Beginner and move up when it feels comfortable.",
    audio_file: '/audio/snowman-vocal-guide.wav',
    default_repeat_count: 1,
    min_repeat_count: 1,
    max_repeat_count: 3,
    continuous_loop_enabled: true
  });
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Marked Notes State per Level: { beginner: ['N1', 'N2'], intermediate: [], advanced: [] }
  const [markedNotesByLevel, setMarkedNotesByLevel] = useState({
    beginner: [],
    intermediate: [],
    advanced: []
  });

  // Audio Playback & Repeat Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedRepeat, setSelectedRepeat] = useState(1); // 1, 2, 3, or 'continuous'
  const [currentLoopCount, setCurrentLoopCount] = useState(1);

  // Active Session Tracking
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const audioRef = useRef(null);

  // Helper to safely resolve audio URLs (supports relative, /uploads/audio, full URLs, and fallback)
  const resolveAudioUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return '/audio/snowman-vocal-guide.wav';
    }
    let clean = url.trim().replace(/\\/g, '/');
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    if (!clean.startsWith('/')) {
      clean = '/' + clean;
    }
    return clean;
  };

  // Reactive audio source updates when admin changes audio_file
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const resolvedUrl = resolveAudioUrl(songData?.audio_file);
    if (!audio.src || !audio.src.endsWith(resolvedUrl)) {
      audio.src = resolvedUrl;
      audio.load();
    }
  }, [songData?.audio_file]);

  // Load Song Practice Data from Backend
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.getSongPractice(2);
        if (isMounted && res && res.success) {
          if (res.song) setSongData(res.song);
          if (Array.isArray(res.levels) && res.levels.length > 0) {
            setLevels(res.levels);

            // Populate marked notes from backend progress
            const initialMarked = { beginner: [], intermediate: [], advanced: [] };
            res.levels.forEach(lvl => {
              if (lvl.progress && Array.isArray(lvl.progress.marked_notes)) {
                initialMarked[lvl.level_key] = lvl.progress.marked_notes;
              }
            });
            setMarkedNotesByLevel(initialMarked);
          }

          if (res.has_completed_session || res.progress?.status === 'COMPLETED') {
            setSessionCompleted(true);
          }
        }
      } catch (err) {
        console.warn('Could not load song practice data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  // Current Level Object
  const currentLevel = levels.find(l => l.level_key === selectedLevelKey) || {
    level_key: selectedLevelKey,
    level_name: selectedLevelKey.charAt(0).toUpperCase() + selectedLevelKey.slice(1),
    total_notes: selectedLevelKey === 'beginner' ? 12 : selectedLevelKey === 'intermediate' ? 16 : 20,
    markers: []
  };

  const markedNotes = markedNotesByLevel[selectedLevelKey] || [];
  const totalNotes = currentLevel.total_notes || (selectedLevelKey === 'beginner' ? 12 : selectedLevelKey === 'intermediate' ? 16 : 20);

  // Audio Event Listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      if (selectedRepeat === 'continuous') {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setCurrentLoopCount(prev => prev + 1);
      } else if (currentLoopCount < selectedRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        setCurrentLoopCount(prev => prev + 1);
      } else {
        setIsPlaying(false);
        setCurrentLoopCount(1);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [selectedRepeat, currentLoopCount]);

  // Audio Play / Pause Handler
  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        if (!activeSessionId) {
          const sessRes = await api.startSongSession(2, { level_key: selectedLevelKey });
          if (sessRes && sessRes.success) {
            setActiveSessionId(sessRes.session_id);
            setSessionStartTime(Date.now());
          }
        }
        if (!audio.src || audio.src === window.location.href) {
          audio.src = resolveAudioUrl(songData?.audio_file);
          audio.load();
        }
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio play error, attempting fallback source:', err);
        try {
          if (audio && !audio.src.endsWith('/audio/snowman-vocal-guide.wav')) {
            audio.src = '/audio/snowman-vocal-guide.wav';
            audio.load();
            await audio.play();
            setIsPlaying(true);
          }
        } catch (fallbackErr) {
          console.warn('Fallback audio play error:', fallbackErr);
        }
      }
    }
  };

  // Audio Seek Handler
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = parseFloat(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Volume Handler
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Note Toggle Handler
  const handleToggleNote = async (noteRef) => {
    const currentMarked = markedNotesByLevel[selectedLevelKey] || [];
    const updated = currentMarked.includes(noteRef)
      ? currentMarked.filter(n => n !== noteRef)
      : [...currentMarked, noteRef];

    setMarkedNotesByLevel(prev => ({
      ...prev,
      [selectedLevelKey]: updated
    }));

    // Silent background save to MySQL
    try {
      const isCompleted = updated.length >= totalNotes;
      await api.saveSongProgress(2, {
        level_key: selectedLevelKey,
        marked_notes: updated,
        audio_listening_progress: duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 100,
        repeat_count: typeof selectedRepeat === 'number' ? selectedRepeat : 1,
        completion_status: isCompleted ? 'COMPLETED' : updated.length > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
      });
    } catch (err) {
      console.warn('Could not save note progress:', err);
    }
  };

  // Complete Practice Session Handler
  const handleCompleteSession = async () => {
    try {
      const listenDuration = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 1000) : Math.round(currentTime);
      await api.completeSongSession(2, {
        session_id: activeSessionId,
        level_key: selectedLevelKey,
        listening_duration: Math.max(10, listenDuration),
        repeat_count: typeof selectedRepeat === 'number' ? selectedRepeat : 1,
        marked_notes_count: markedNotes.length
      });

      // Mark the song tab complete in learning module
      await api.completePartTab(2, { tab_key: 'song', duration_minutes: 5 });

      setSessionCompleted(true);
      setToastMessage(`Practice session completed! Stage 04: Let's Check Ourselves is unlocked ✓`);
      setTimeout(() => setToastMessage(null), 5000);

      if (onSessionComplete) onSessionComplete();
    } catch (err) {
      console.error('Error completing song session:', err);
      setToastMessage('Practice record saved to your journal.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Format Seconds to MM:SS
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Progress Bar Percentage
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Render Musical Score Image or Fallback SVG for Level
  const renderScoreSheetContent = () => {
    const activeScoreImage = currentLevel.score_file || (selectedLevelKey === 'beginner' ? '/1 break.png' : null);
    if (activeScoreImage) {
      const safeSrc = encodeURI(activeScoreImage);
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '100%',
            maxHeight: 560,
            overflowY: 'auto',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '4px'
          }}>
            <img
              src={safeSrc}
              alt={`${currentLevel.level_name} Score Sheet`}
              style={{
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '540px',
                objectFit: 'contain',
                display: 'block',
                borderRadius: 6,
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
              }}
              onError={(e) => {
                if (!e.currentTarget.src.includes('1-break.png')) {
                  e.currentTarget.src = '/1-break.png';
                }
              }}
            />
          </div>
        </div>
      );
    }

    return renderScoreSheetSVG();
  };

  // Render Musical Score SVG for Level
  const renderScoreSheetSVG = () => {
    if (selectedLevelKey === 'beginner') {
      return (
        <svg viewBox="0 0 760 380" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Background subtle sheet tint */}
          <rect width="760" height="380" rx="10" fill="#FFFFFF" />

          {/* Clef and Key Title Header */}
          <text x="36" y="24" fontSize="13" fontWeight="800" fill="#191B35" fontFamily="system-ui, sans-serif">
            Snowman (Main Theme)
          </text>
          <text x="680" y="24" fontSize="11" fontWeight="700" fill="#64748B" fontFamily="system-ui, sans-serif">
            Moderato ♩ = 104
          </text>

          {/* ============================================================= */}
          {/* PHRASE 1: Don't cry snowman, not in front of me               */}
          {/* ============================================================= */}
          {/* Staff 1 Lines */}
          {[60, 72, 84, 96, 108].map((y, i) => (
            <line key={`s1-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          {/* Measure bar lines */}
          <line x1="36" y1="60" x2="36" y2="108" stroke="#94A3B8" strokeWidth="1.6" />
          <line x1="280" y1="60" x2="280" y2="108" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="510" y1="60" x2="510" y2="108" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="724" y1="60" x2="724" y2="108" stroke="#94A3B8" strokeWidth="1.6" />

          {/* Treble Clef 𝄞 */}
          <text x="44" y="98" fontSize="40" fill="#191B35" fontFamily="serif">𝄞</text>
          {/* Time Signature 4/4 */}
          <text x="80" y="80" fontSize="18" fontWeight="800" fill="#191B35" fontFamily="serif">4</text>
          <text x="80" y="102" fontSize="18" fontWeight="800" fill="#191B35" fontFamily="serif">4</text>

          {/* Orange Breath Tick 1 (Above Staff 1) */}
          <g transform="translate(100, 38)">
            <text x="0" y="0" fontSize="17" fontWeight="900" fill="#EA580C" fontFamily="system-ui">✓</text>
            <text x="-6" y="-6" fontSize="9" fontWeight="800" fill="#EA580C" fontFamily="system-ui">BREATH</text>
          </g>

          {/* Notes Phrase 1 */}
          {renderClickableNote('N1', 130, 84, "Don't", '#191B35')}
          {renderClickableNote('N2', 190, 72, 'cry', '#191B35')}
          {/* Breath Tick 2 */}
          <g transform="translate(250, 38)">
            <text x="0" y="0" fontSize="17" fontWeight="900" fill="#EA580C" fontFamily="system-ui">✓</text>
          </g>
          {renderClickableNote('N3', 315, 84, 'snow-', '#191B35')}
          {renderClickableNote('N4', 380, 72, 'man', '#191B35')}
          {renderClickableNote('N5', 445, 60, 'not', '#191B35')}
          {renderClickableNote('N6', 535, 72, 'in', '#191B35')}
          {renderClickableNote('N7', 605, 84, 'front', '#191B35')}
          {renderClickableNote('N8', 675, 72, 'of me', '#191B35')}

          {/* ============================================================= */}
          {/* PHRASE 2: Who'll catch your tears if you can't catch me       */}
          {/* ============================================================= */}
          {/* Staff 2 Lines */}
          {[170, 182, 194, 206, 218].map((y, i) => (
            <line key={`s2-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <line x1="36" y1="170" x2="36" y2="218" stroke="#94A3B8" strokeWidth="1.6" />
          <line x1="360" y1="170" x2="360" y2="218" stroke="#CBD5E1" strokeWidth="1.2" />
          <line x1="724" y1="170" x2="724" y2="218" stroke="#94A3B8" strokeWidth="1.6" />

          {/* Treble Clef 𝄞 */}
          <text x="44" y="208" fontSize="40" fill="#191B35" fontFamily="serif">𝄞</text>

          {/* Orange Breath Tick 3 */}
          <g transform="translate(100, 148)">
            <text x="0" y="0" fontSize="17" fontWeight="900" fill="#EA580C" fontFamily="system-ui">✓</text>
            <text x="-6" y="-6" fontSize="9" fontWeight="800" fill="#EA580C" fontFamily="system-ui">BREATH</text>
          </g>

          {/* Notes Phrase 2 */}
          {renderClickableNote('N9', 140, 194, "Who'll", '#191B35')}
          {renderClickableNote('N10', 230, 182, 'catch', '#191B35')}
          {renderClickableNote('N11', 420, 182, 'your tears', '#191B35')}
          {renderClickableNote('N12', 600, 170, 'darling', '#191B35')}

          {/* Staff 3 Accent bar */}
          {[280, 292, 304, 316, 328].map((y, i) => (
            <line key={`s3-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#E2E8F0" strokeWidth="1.0" />
          ))}
          <text x="44" y="318" fontSize="36" fill="#94A3B8" fontFamily="serif">𝄞</text>
          <text x="120" y="310" fontSize="13" fontStyle="italic" fill="#64748B" fontFamily="system-ui">
            (Sustain low diaphragmatic support throughout the vocal line)
          </text>
        </svg>
      );
    } else if (selectedLevelKey === 'intermediate') {
      return (
        <svg viewBox="0 0 760 380" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width="760" height="380" rx="10" fill="#FFFFFF" />

          <text x="36" y="24" fontSize="13" fontWeight="800" fill="#191B35" fontFamily="system-ui, sans-serif">
            Snowman (Intermediate Phrasing & Catch-Breaths)
          </text>
          <text x="660" y="24" fontSize="11" fontWeight="700" fill="#64748B" fontFamily="system-ui, sans-serif">
            Andante con moto ♩ = 104
          </text>

          {/* Staff 1 */}
          {[55, 67, 79, 91, 103].map((y, i) => (
            <line key={`i1-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="93" fontSize="38" fill="#191B35" fontFamily="serif">𝄞</text>
          <text x="80" y="75" fontSize="17" fontWeight="800" fill="#191B35">4</text>
          <text x="80" y="97" fontSize="17" fontWeight="800" fill="#191B35">4</text>

          {/* Orange Breath 1 & 2 */}
          <g transform="translate(95, 34)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>
          <g transform="translate(370, 34)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>

          {renderClickableNote('IN1', 125, 79, "Don't", '#191B35')}
          {renderClickableNote('IN2', 185, 67, 'cry', '#191B35')}
          {renderClickableNote('IN3', 255, 79, 'snow-', '#191B35')}
          {renderClickableNote('IN4', 320, 67, 'man', '#191B35')}
          {renderClickableNote('IN5', 410, 55, 'not', '#191B35')}
          {renderClickableNote('IN6', 485, 67, 'in', '#191B35')}
          {renderClickableNote('IN7', 560, 79, 'front', '#191B35')}
          {renderClickableNote('IN8', 645, 67, 'of me', '#191B35')}

          {/* Staff 2 */}
          {[160, 172, 184, 196, 208].map((y, i) => (
            <line key={`i2-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="198" fontSize="38" fill="#191B35" fontFamily="serif">𝄞</text>
          <g transform="translate(95, 138)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>

          {renderClickableNote('IN9', 130, 184, "Who'll", '#191B35')}
          {renderClickableNote('IN10', 215, 172, 'catch', '#191B35')}
          {renderClickableNote('IN11', 300, 172, 'your', '#191B35')}
          {renderClickableNote('IN12', 390, 172, 'tears', '#191B35')}
          {renderClickableNote('IN13', 510, 160, 'dar-', '#191B35')}
          {renderClickableNote('IN14', 625, 172, 'ling', '#191B35')}

          {/* Staff 3 */}
          {[265, 277, 289, 301, 313].map((y, i) => (
            <line key={`i3-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="303" fontSize="38" fill="#191B35" fontFamily="serif">𝄞</text>
          <g transform="translate(95, 244)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>
          {renderClickableNote('IN15', 210, 289, 'A puddle', '#191B35')}
          {renderClickableNote('IN16', 460, 277, 'of water', '#191B35')}
        </svg>
      );
    } else {
      // Advanced Level
      return (
        <svg viewBox="0 0 760 380" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <rect width="760" height="380" rx="10" fill="#FFFFFF" />

          <text x="36" y="24" fontSize="13" fontWeight="800" fill="#191B35" fontFamily="system-ui, sans-serif">
            Snowman (Advanced Sustained Air Budget & Catch-Breaths)
          </text>
          <text x="640" y="24" fontSize="11" fontWeight="700" fill="#64748B" fontFamily="system-ui, sans-serif">
            Espressivo ♩ = 104
          </text>

          {/* Staff 1 */}
          {[52, 64, 76, 88, 100].map((y, i) => (
            <line key={`a1-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="90" fontSize="36" fill="#191B35" fontFamily="serif">𝄞</text>
          <g transform="translate(90, 32)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>
          <g transform="translate(360, 32)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>

          {renderClickableNote('AN1', 115, 76, "Don't", '#191B35')}
          {renderClickableNote('AN2', 170, 64, 'cry', '#191B35')}
          {renderClickableNote('AN3', 230, 76, 'snow-', '#191B35')}
          {renderClickableNote('AN4', 290, 64, 'man', '#191B35')}
          {renderClickableNote('AN5', 380, 52, 'not', '#191B35')}
          {renderClickableNote('AN6', 450, 64, 'in', '#191B35')}
          {renderClickableNote('AN7', 525, 76, 'front', '#191B35')}
          {renderClickableNote('AN8', 615, 64, 'of me', '#191B35')}

          {/* Staff 2 */}
          {[145, 157, 169, 181, 193].map((y, i) => (
            <line key={`a2-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="183" fontSize="36" fill="#191B35" fontFamily="serif">𝄞</text>
          <g transform="translate(90, 125)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>

          {renderClickableNote('AN9', 125, 169, "Who'll", '#191B35')}
          {renderClickableNote('AN10', 205, 157, 'catch', '#191B35')}
          {renderClickableNote('AN11', 285, 157, 'your', '#191B35')}
          {renderClickableNote('AN12', 370, 157, 'tears', '#191B35')}
          {renderClickableNote('AN13', 485, 145, 'dar-', '#191B35')}
          {renderClickableNote('AN14', 595, 157, 'ling', '#191B35')}

          {/* Staff 3 */}
          {[235, 247, 259, 271, 283].map((y, i) => (
            <line key={`a3-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="273" fontSize="36" fill="#191B35" fontFamily="serif">𝄞</text>
          <g transform="translate(90, 215)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>

          {renderClickableNote('AN15', 150, 259, 'puddle', '#191B35')}
          {renderClickableNote('AN16', 310, 247, 'of water', '#191B35')}
          {renderClickableNote('AN17', 480, 247, 'hold me', '#191B35')}
          {renderClickableNote('AN18', 620, 247, 'close', '#191B35')}

          {/* Staff 4 Phrase sustain */}
          {[325, 337, 349, 361, 373].map((y, i) => (
            <line key={`a4-${i}`} x1="36" y1={y} x2="724" y2={y} stroke="#CBD5E1" strokeWidth="1.2" />
          ))}
          <text x="44" y="363" fontSize="36" fill="#191B35" fontFamily="serif">𝄞</text>
          <g transform="translate(90, 305)">
            <text x="0" y="0" fontSize="16" fontWeight="900" fill="#EA580C">✓</text>
          </g>
          {renderClickableNote('AN19', 240, 349, 'hide from', '#191B35')}
          {renderClickableNote('AN20', 500, 337, 'the sun', '#191B35')}
        </svg>
      );
    }
  };

  // Clickable Note Component on the SVG
  const renderClickableNote = (refKey, x, y, lyric, defaultColor) => {
    const isMarked = markedNotes.includes(refKey);

    return (
      <g
        key={refKey}
        onClick={() => handleToggleNote(refKey)}
        style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
      >
        {/* Glow halo when hovered/marked */}
        <circle
          cx={x}
          cy={y}
          r={isMarked ? 14 : 11}
          fill={isMarked ? '#FEF3C7' : 'transparent'}
          stroke={isMarked ? '#F59E0B' : 'transparent'}
          strokeWidth="1.5"
          opacity={isMarked ? 0.9 : 0}
        />

        {/* Notehead (Quarter / Eighth Note) */}
        <ellipse
          cx={x}
          cy={y}
          rx="6"
          ry="4.5"
          transform={`rotate(-25 ${x} ${y})`}
          fill={isMarked ? '#D97706' : defaultColor}
        />

        {/* Note Stem */}
        <line
          x1={x + 5}
          y1={y}
          x2={x + 5}
          y2={y - 28}
          stroke={isMarked ? '#D97706' : defaultColor}
          strokeWidth="1.8"
        />

        {/* Orange / Gold Checkmark over note when marked */}
        {isMarked && (
          <g transform={`translate(${x - 7}, ${y - 40})`}>
            <circle cx="7" cy="7" r="8" fill="#F97316" />
            <path d="M4 7.5L6.2 9.5L10 4.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}

        {/* Lyric text below staff */}
        <text
          x={x}
          y={y + 36}
          fontSize="11"
          fontWeight={isMarked ? '800' : '600'}
          fill={isMarked ? '#B45309' : '#334155'}
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          {lyric}
        </text>
      </g>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={resolveAudioUrl(songData?.audio_file)}
        preload="auto"
        onError={(e) => {
          console.warn('Audio element source error, switching to default guide:', e);
          if (audioRef.current && !audioRef.current.src.endsWith('/audio/snowman-vocal-guide.wav')) {
            audioRef.current.src = '/audio/snowman-vocal-guide.wav';
            audioRef.current.load();
          }
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            color: '#166534',
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: '0.90rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(22, 101, 52, 0.1)',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Award size={20} color="#16A34A" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* TWO-COLUMN MAIN LAYOUT (Left ~43%, Right ~57%)                      */}
      {/* =================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.35fr)',
          gap: 20,
          alignItems: 'stretch'
        }}
        className="song-two-column-layout"
      >
        {/* ================================================================= */}
        {/* LEFT COLUMN: SONG AUDIO PLAYER & LEARNING INSTRUCTIONS            */}
        {/* ================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Dark Teal Audio Guide Player */}
          <div
            style={{
              background: 'linear-gradient(145deg, #072927 0%, #0F3F3B 100%)',
              borderRadius: 18,
              padding: '24px 22px',
              color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(7, 41, 39, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top Subtitle & Title */}
            <div>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#5EEAD4',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(94, 234, 212, 0.12)',
                  padding: '3px 10px',
                  borderRadius: 9999,
                  display: 'inline-block',
                  marginBottom: 8
                }}
              >
                VOCALIZE • {songData.song_title ? songData.song_title.toUpperCase() : 'SNOWMAN'}
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                {songData.subtitle || 'Audio guide'}
              </h3>
            </div>

            {/* Central Play Button */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '22px 0' }}>
              <button
                type="button"
                onClick={handleTogglePlay}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#072927',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
              >
                {isPlaying ? (
                  <Pause size={28} fill="#072927" color="#072927" />
                ) : (
                  <Play size={28} fill="#072927" color="#072927" style={{ marginLeft: 3 }} />
                )}
              </button>
            </div>

            {/* Progress Bar & Yellow Scrubber Indicator */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#99F6E4', fontWeight: 700, marginBottom: 6 }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div style={{ position: 'relative', width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.22)', borderRadius: 9999 }}>
                {/* Yellow active progress bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(to right, #F59E0B, #FBBF24)',
                    borderRadius: 9999,
                    transition: 'width 0.1s linear'
                  }}
                />
                {/* Hidden range input for interactive seek */}
                <input
                  type="range"
                  min={0}
                  max={duration || 10}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    position: 'absolute',
                    top: -6,
                    left: 0,
                    width: '100%',
                    height: 18,
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                  }}
                />
              </div>

              {/* Bottom Volume & Loop Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    style={{ background: 'none', border: 'none', color: '#99F6E4', cursor: 'pointer', padding: 2, display: 'flex' }}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{ width: 68, accentColor: '#F59E0B', height: 4, cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#5EEAD4', fontWeight: 700 }}>
                  <Repeat size={14} />
                  <span>
                    {selectedRepeat === 'continuous'
                      ? 'Loop: Continuous'
                      : `Loop: ${currentLoopCount} of ${selectedRepeat}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Song Learning Instructions Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '20px 22px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#CCFBF1',
                  color: '#0F766E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Music size={16} />
              </div>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
                Song Application Guide
              </h4>
            </div>

            <p style={{ fontSize: '0.90rem', color: '#1E293B', lineHeight: 1.6, margin: 0 }}>
              Now let's use your breathing in a real song. Listen once. Then choose your level and sing along, taking a breath wherever you see a tick on the score.
            </p>

            <p style={{ fontSize: '0.92rem', color: '#0D9488', fontWeight: 800, lineHeight: 1.5, margin: 0 }}>
              Start at Beginner and move up when it feels comfortable.
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: SCORE SHEET, LEVEL SELECTOR & NOTE MARKING         */}
        {/* ================================================================= */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #E2E8F0',
            padding: '20px 22px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          {/* Top Header: Score Sheet Title & 3 Practice Level Pills */}
          <div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 14
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
                Score sheet
              </h3>

              {/* Three Selectable Practice Levels (Beginner, Intermediate, Advanced) */}
              <div
                style={{
                  display: 'inline-flex',
                  background: '#F1F5F9',
                  borderRadius: 9999,
                  padding: 3,
                  gap: 4
                }}
                role="tablist"
              >
                {[
                  { key: 'beginner', label: 'Beginner' },
                  { key: 'intermediate', label: 'Intermediate' },
                  { key: 'advanced', label: 'Advanced' }
                ].map((lvl) => {
                  const isSelected = selectedLevelKey === lvl.key;
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setSelectedLevelKey(lvl.key)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: 9999,
                        border: 'none',
                        background: isSelected ? '#168B7A' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        fontSize: '0.82rem',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 8px rgba(22, 139, 122, 0.25)' : 'none',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loop & Repeat Control Bar & Note Progress Counter */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: '#F8FAFC',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                marginBottom: 14
              }}
            >
              {/* Loop & Repeat Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.80rem', fontWeight: 750, color: '#475569' }}>
                  Loop & repeat:
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 'continuous'].map((opt) => {
                    const isSelected = selectedRepeat === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setSelectedRepeat(opt)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 8,
                          border: isSelected ? '1px solid #0D9488' : '1px solid #CBD5E1',
                          background: isSelected ? '#0D9488' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {opt === 'continuous' ? 'Continuous ∞' : `${opt} time${opt > 1 ? 's' : ''}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Practice Level Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F766E' }}>
                  {currentLevel.level_name} Level Active
                </span>
                <CheckCircle2 size={16} color="#0D9488" />
              </div>
            </div>

            {/* Sheet Music Visualizer */}
            <div
              style={{
                border: '1.5px solid #E2E8F0',
                borderRadius: 12,
                padding: '12px 14px',
                background: '#FFFFFF',
                boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.02)',
                overflowX: 'auto'
              }}
            >
              {renderScoreSheetContent()}
            </div>
          </div>

          {/* Bottom Legend and Action Footer */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.82rem',
                color: '#0F766E',
                fontWeight: 700,
                padding: '8px 12px',
                background: '#F0FDFA',
                borderRadius: 10,
                border: '1px solid #CCFBF1',
                marginBottom: 14
              }}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>♪</span>
              <span>Follow the score sheet music and breath indicators while practicing along with the audio guide.</span>
            </div>

            {/* Navigation & Session Complete Footer Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 12,
                borderTop: '1px solid #F1F5F9'
              }}
            >
              <button
                type="button"
                onClick={onBackToBreathe}
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
                ← Back to Breathe
              </button>

              <button
                type="button"
                onClick={sessionCompleted && onProceedToNextStage ? onProceedToNextStage : handleCompleteSession}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: sessionCompleted ? '#0F766E' : '#168B7A',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(22, 139, 122, 0.28)',
                  transition: 'all 0.18s ease'
                }}
              >
                <Check size={16} />
                <span>{sessionCompleted ? 'Session Completed ✓' : 'Complete Practice Session ✓'}</span>
              </button>

              {sessionCompleted && onProceedToNextStage && (
                <button
                  type="button"
                  onClick={onProceedToNextStage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #0D9488, #059669)',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.38)',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <span>Next: Stage 04 Let's Check Ourselves</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
