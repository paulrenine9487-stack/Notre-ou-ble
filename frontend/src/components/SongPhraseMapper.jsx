import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Music,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Wind,
  ArrowRight,
  BookOpen,
  Save,
  Clock
} from 'lucide-react';

export default function SongPhraseMapper({ onSessionSaved }) {
  const [songs, setSongs] = useState([]);
  const [selectedSongId, setSelectedSongId] = useState(null);
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // New Song Form State
  const [isCreatingSong, setIsCreatingSong] = useState(false);
  const [songForm, setSongForm] = useState({
    song_title: '',
    language: 'English',
    song_type: 'Vocalise / Classical',
    notes: ''
  });

  // New Phrase Form State
  const [phraseForm, setPhraseForm] = useState({
    phrase_text: '',
    inhale_position: 'Before phrase (deep 360° diaphragmatic inhale)',
    exhale_guidance: 'Controlled sustained steady airflow',
    practice_notes: ''
  });

  const loadSongs = async () => {
    try {
      setLoading(true);
      const res = await api.getSongs();
      if (res.success) {
        setSongs(res.songs || []);
        if (res.songs && res.songs.length > 0 && !selectedSongId) {
          setSelectedSongId(res.songs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPhrases = async (songId) => {
    if (!songId) return;
    try {
      const res = await api.getSongPhrases(songId);
      if (res.success) {
        setPhrases(res.phrases || []);
      }
    } catch (err) {
      console.error('Failed to load song phrases:', err);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    if (selectedSongId) {
      loadPhrases(selectedSongId);
    }
  }, [selectedSongId]);

  const handleCreateSong = async (e) => {
    e.preventDefault();
    if (!songForm.song_title.trim()) return;

    setSaving(true);
    try {
      const payload = {
        ...songForm,
        initial_phrases: [
          {
            phrase_number: 1,
            phrase_text: 'Breathe deep in silence, fill the lower ribs...',
            inhale_position: 'Before phrase (deep 360° diaphragmatic inhale)',
            exhale_guidance: 'Controlled sustained airflow with soft onset'
          },
          {
            phrase_number: 2,
            phrase_text: 'Sustain the tone, resonate across the phrase...',
            inhale_position: 'Catch-breath between lines (relaxed lower belly)',
            exhale_guidance: 'Appoggio support through the crescendo'
          }
        ]
      };

      const res = await api.createSong(payload);
      if (res.success) {
        setMessage('Song created with starter breathing phrases!');
        setIsCreatingSong(false);
        setSongForm({ song_title: '', language: 'English', song_type: 'Vocalise / Classical', notes: '' });
        await loadSongs();
        setSelectedSongId(res.song.id);
      }
    } catch (err) {
      setMessage(err.message || 'Failed to create song.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhrase = async (e) => {
    e.preventDefault();
    if (!phraseForm.phrase_text.trim() || !selectedSongId) return;

    setSaving(true);
    try {
      const res = await api.addSongPhrase(selectedSongId, phraseForm);
      if (res.success) {
        setPhraseForm({
          phrase_text: '',
          inhale_position: 'Before phrase (deep 360° diaphragmatic inhale)',
          exhale_guidance: 'Controlled sustained steady airflow',
          practice_notes: ''
        });
        await loadPhrases(selectedSongId);
        setMessage('Phrase breathing markers added successfully.');
      }
    } catch (err) {
      setMessage(err.message || 'Failed to add phrase.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePhraseStatus = async (phraseId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateSongPhrase(phraseId, { completion_status: nextStatus });
      setPhrases(prev => prev.map(p => p.id === phraseId ? { ...p, completion_status: nextStatus } : p));
      
      // If marked completed, also log a practice session
      if (nextStatus === 'completed') {
        const curSong = songs.find(s => s.id === selectedSongId);
        await api.completePracticeSession({
          session_type: 'Song Breath Mapping',
          exercise_name: `${curSong?.song_title || 'Song'} - Phrase Practice`,
          duration_minutes: 5,
          notes: `Practised phrase breath support for: ${curSong?.song_title}`
        });
        if (onSessionSaved) onSessionSaved();
        setMessage('Phrase mastered! +5 min practice logged to MySQL.');
      }
    } catch (err) {
      console.error('Failed to toggle phrase status:', err);
    }
  };

  const handleDeletePhrase = async (phraseId) => {
    try {
      await api.deleteSongPhrase(phraseId);
      setPhrases(prev => prev.filter(p => p.id !== phraseId));
    } catch (err) {
      console.error('Failed to delete phrase:', err);
    }
  };

  const selectedSong = songs.find(s => s.id === selectedSongId);

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #EAE5F3',
      borderRadius: '18px',
      padding: '22px 26px',
      boxShadow: '0 2px 10px rgba(25, 27, 53, 0.02)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#7C3AED',
            backgroundColor: '#F4F0FF',
            padding: '2.5px 8px',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '4px'
          }}>
            SONG-BASED BREATH APPLICATION
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#191B35', margin: 0 }}>
            Song Phrase Breath Mapping
          </h3>
        </div>

        <button
          onClick={() => setIsCreatingSong(!isCreatingSong)}
          className="dash-btn-primary"
          style={{ padding: '7px 14px', fontSize: '0.78rem' }}
        >
          <Plus size={14} />
          <span>{isCreatingSong ? 'Close Form' : 'Map New Song'}</span>
        </button>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#77728A', margin: '0 0 14px 0', lineHeight: 1.45 }}>
        Singing isn't just about exercises — it's about knowing <strong>where to inhale</strong>, <strong>how to sustain airflow</strong>, and <strong>when to take recovery breaths</strong> while singing your actual songs.
      </p>

      {/* New Song Creator Form */}
      {isCreatingSong && (
        <form onSubmit={handleCreateSong} style={{
          backgroundColor: '#F8FAF8',
          border: '1px solid #EAE5F3',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px'
        }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#191B35', margin: '0 0 16px 0' }}>
            Add Song For Phrase Mapping
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191B35', display: 'block', marginBottom: '6px' }}>
                Song Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Caro Mio Ben / Sound of Silence"
                value={songForm.song_title}
                onChange={(e) => setSongForm({ ...songForm, song_title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #EAE5F3',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191B35', display: 'block', marginBottom: '6px' }}>
                Language
              </label>
              <input
                type="text"
                placeholder="e.g., Italian, English, Hindi, Tamil"
                value={songForm.language}
                onChange={(e) => setSongForm({ ...songForm, language: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #EAE5F3',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191B35', display: 'block', marginBottom: '6px' }}>
                Song Genre / Type
              </label>
              <input
                type="text"
                placeholder="e.g., Classical Aria, Pop Ballad, Carnatic"
                value={songForm.song_type}
                onChange={(e) => setSongForm({ ...songForm, song_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #EAE5F3',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="dash-btn-primary"
            style={{ padding: '10px 22px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Creating Song...' : 'Save Song & Start Mapping'}</span>
          </button>
        </form>
      )}

      {/* Song Selector Pills */}
      {songs.length > 0 ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {songs.map(song => (
            <button
              key={song.id}
              onClick={() => setSelectedSongId(song.id)}
              style={{
                padding: '8px 18px',
                borderRadius: '9999px',
                border: selectedSongId === song.id ? '2px solid #7C3AED' : '1px solid #EAE5F3',
                backgroundColor: selectedSongId === song.id ? '#F4F0FF' : '#FFFFFF',
                color: selectedSongId === song.id ? '#191B35' : '#77728A',
                fontWeight: selectedSongId === song.id ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Music size={15} color={selectedSongId === song.id ? '#7C3AED' : '#77728A'} />
              <span>{song.song_title}</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({song.language || 'General'})</span>
            </button>
          ))}
        </div>
      ) : (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#F8FAF8',
          borderRadius: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ margin: '0 0 12px 0', color: '#77728A' }}>
            No songs mapped yet. Click <strong>Map New Song</strong> above to add your first vocal song!
          </p>
        </div>
      )}

      {/* Active Song Phrase Sequence */}
      {selectedSong && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            borderBottom: '1px solid #EAE5F3',
            paddingBottom: '12px'
          }}>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#191B35', margin: '0 0 4px 0' }}>
                {selectedSong.song_title}
              </h4>
              <span style={{ fontSize: '0.82rem', color: '#77728A' }}>
                {selectedSong.song_type} · {selectedSong.language}
              </span>
            </div>

            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#7C3AED',
              backgroundColor: '#F4F0FF',
              padding: '4px 12px',
              borderRadius: '9999px'
            }}>
              {phrases.filter(p => p.completion_status === 'completed').length} of {phrases.length} phrases mastered
            </span>
          </div>

          {/* Phrase List with Visual Breathing Indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
            {phrases.map((phrase) => {
              const isDone = phrase.completion_status === 'completed';
              return (
                <div
                  key={phrase.id}
                  style={{
                    backgroundColor: isDone ? '#F4F9F6' : '#FFFFFF',
                    border: `1px solid ${isDone ? '#7C3AED' : '#EAE5F3'}`,
                    borderRadius: '16px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleTogglePhraseStatus(phrase.id, phrase.completion_status)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {isDone ? (
                          <CheckCircle2 size={22} color="#7C3AED" />
                        ) : (
                          <Circle size={22} color="#77728A" />
                        )}
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7C3AED' }}>
                        PHRASE {phrase.phrase_number}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeletePhrase(phrase.id)}
                      title="Delete phrase"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Lyrics / Phrase Text */}
                  <div style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: '#191B35',
                    fontFamily: 'serif',
                    fontStyle: 'italic',
                    padding: '4px 0'
                  }}>
                    "{phrase.phrase_text}"
                  </div>

                  {/* Visual Indicator Flow Diagram */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    padding: '10px 14px',
                    backgroundColor: '#F8F7FC',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    color: '#191B35'
                  }}>
                    <span style={{
                      backgroundColor: '#7C3AED',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      [Inhale]
                    </span>
                    <span style={{ color: '#7C3AED', fontWeight: 600 }}>{phrase.inhale_position}</span>
                    <ArrowRight size={14} color="#77728A" />
                    <span style={{
                      backgroundColor: '#241442',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      [Sing Phrase]
                    </span>
                    <ArrowRight size={14} color="#77728A" />
                    <span style={{
                      backgroundColor: '#F4F0FF',
                      color: '#191B35',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      [Exhale Flow]
                    </span>
                    <span style={{ color: '#77728A' }}>{phrase.exhale_guidance}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Phrase Form to Selected Song */}
          <form onSubmit={handleAddPhrase} style={{
            backgroundColor: '#F8FAF8',
            border: '1px dashed #7C3AED',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <h5 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#191B35', margin: 0 }}>
              Add Next Phrase & Breath Markers
            </h5>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191B35', display: 'block', marginBottom: '4px' }}>
                Phrase Lyrics / Text *
              </label>
              <input
                type="text"
                required
                placeholder="Type or paste the next lyrical phrase..."
                value={phraseForm.phrase_text}
                onChange={(e) => setPhraseForm({ ...phraseForm, phrase_text: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #EAE5F3',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191B35', display: 'block', marginBottom: '4px' }}>
                  Inhalation Point
                </label>
                <select
                  value={phraseForm.inhale_position}
                  onChange={(e) => setPhraseForm({ ...phraseForm, inhale_position: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #EAE5F3',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Before phrase (deep 360° diaphragmatic inhale)">Before phrase (deep 360° diaphragmatic inhale)</option>
                  <option value="Catch-breath between lines (relaxed lower belly)">Catch-breath between lines (relaxed lower belly)</option>
                  <option value="Micro-breath on consonant release">Micro-breath on consonant release</option>
                  <option value="Recovery breath after high sustained note">Recovery breath after high sustained note</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#191B35', display: 'block', marginBottom: '4px' }}>
                  Exhalation Guidance
                </label>
                <select
                  value={phraseForm.exhale_guidance}
                  onChange={(e) => setPhraseForm({ ...phraseForm, exhale_guidance: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #EAE5F3',
                    fontSize: '0.88rem',
                    backgroundColor: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Controlled sustained steady airflow">Controlled sustained steady airflow</option>
                  <option value="Appoggio support through crescendo">Appoggio support through crescendo</option>
                  <option value="Light gentle airflow for pianissimo">Light gentle airflow for pianissimo</option>
                  <option value="Staccato rhythmic abdominal pulses">Staccato rhythmic abdominal pulses</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="dash-btn-primary"
              style={{ width: 'fit-content' }}
            >
              <Plus size={16} />
              <span>{saving ? 'Adding...' : 'Add Phrase to Song'}</span>
            </button>
          </form>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '16px',
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: '#F4F0FF',
          color: '#191B35',
          fontSize: '0.88rem',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
