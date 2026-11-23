import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Video,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Save,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  Edit3,
  Heading,
  Bold,
  List,
  Music,
  Volume2,
  ChevronDown,
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminTranscriptManager() {
  // Navigation & Selection States
  const [modules] = useState([
    { id: 1, title: 'Module 1: Breath Management' },
    { id: 2, title: 'Module 2: Pitch & Tone Production' },
    { id: 3, title: 'Module 3: Resonance & Articulation' },
    { id: 4, title: 'Module 4: Dynamic Control & Phrasing' },
    { id: 5, title: 'Module 5: Performance & Vocal Stamina' }
  ]);

  const [stages] = useState([
    { id: 1, title: 'Stage 01: Gain Attention' },
    { id: 2, title: 'Stage 02: Stimulate Recall' },
    { id: 3, title: 'Stage 03: How To Do It (Present Content)' },
    { id: 4, title: 'Stage 04: Assess Performance' },
    { id: 5, title: 'Stage 05: Provide Feedback & Practice' }
  ]);

  const [selectedModuleId, setSelectedModuleId] = useState(1);
  const [selectedStageId, setSelectedStageId] = useState(3);
  const [curriculumVideos, setCurriculumVideos] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(5);

  // Transcript Records
  const [transcriptsList, setTranscriptsList] = useState([]);
  const [currentTranscriptId, setCurrentTranscriptId] = useState(null);

  // Editor Form State
  const [formData, setFormData] = useState({
    title: 'Stage 3 Part 1: How Breathing Works - Instructional Transcript',
    transcript_content: '',
    has_spoken_dialogue: true,
    language: 'en',
    publication_status: 'DRAFT'
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const textareaRef = useRef(null);

  // Load all curriculum videos and all transcripts on mount
  useEffect(() => {
    loadVideosAndTranscripts();
  }, []);

  // When selected video changes, load existing transcript if available
  useEffect(() => {
    if (selectedVideoId) {
      loadTranscriptForVideo(selectedVideoId);
    }
  }, [selectedVideoId]);

  const loadVideosAndTranscripts = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [vidsRes, listRes] = await Promise.all([
        api.adminGetVideosForTranscript(),
        api.adminGetTranscripts()
      ]);

      if (vidsRes.success) {
        setCurriculumVideos(vidsRes.videos || []);
        // Auto-select first video if not set
        if (!selectedVideoId && vidsRes.videos?.length > 0) {
          const s3v = vidsRes.videos.find(v => v.stage_id === 3) || vidsRes.videos[0];
          setSelectedVideoId(s3v.id);
        }
      }

      if (listRes.success) {
        setTranscriptsList(listRes.transcripts || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load video transcripts.');
    } finally {
      setLoading(false);
    }
  };

  const loadTranscriptForVideo = async (videoId) => {
    try {
      const res = await api.adminGetTranscriptByVideo(videoId);
      if (res.success && res.transcript) {
        const t = res.transcript;
        setCurrentTranscriptId(t.id);
        setFormData({
          title: t.title || '',
          transcript_content: t.transcript_content || '',
          has_spoken_dialogue: t.has_spoken_dialogue === 1 || t.has_spoken_dialogue === true,
          language: t.language || 'en',
          publication_status: t.publication_status || 'DRAFT'
        });
      } else {
        // No transcript yet for this video
        setCurrentTranscriptId(null);
        const vid = curriculumVideos.find(v => v.id === videoId);
        setFormData({
          title: vid ? `${vid.title} - Video Transcript` : 'Video Transcript',
          transcript_content: '',
          has_spoken_dialogue: true,
          language: 'en',
          publication_status: 'DRAFT'
        });
      }
    } catch (err) {
      console.warn('Error loading transcript for video:', err.message);
    }
  };

  // Method B: Audio transcription draft generator
  const handleGenerateDraft = async () => {
    if (!selectedVideoId) {
      setErrorMsg('Please select a video first.');
      return;
    }
    try {
      setGeneratingDraft(true);
      setErrorMsg('');
      const res = await api.adminGenerateDraftTranscript(selectedVideoId);
      if (res.success && res.draft) {
        setFormData(prev => ({
          ...prev,
          title: res.draft.title || prev.title,
          transcript_content: res.draft.transcript_content || '',
          has_spoken_dialogue: res.draft.has_spoken_dialogue === 1,
          language: res.draft.language || 'en'
        }));
        setSuccessMsg('Method B Audio/Lesson Transcription draft generated. Please review and refine the text before publishing.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not generate draft transcript.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Toolbar Formatting Helpers
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selectedText = text.substring(start, end) || defaultText;

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setFormData(prev => ({ ...prev, transcript_content: newText }));

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const handleInsertTimestamp = () => {
    const ts = prompt('Enter timestamp in MM:SS format (e.g. 00:15):', '00:00');
    if (ts) {
      const formatted = ts.startsWith('[') ? ts : `[${ts.trim()}]`;
      insertFormatting(`${formatted} `);
    }
  };

  // Save as Draft or Publish
  const handleSave = async (statusToSet = 'DRAFT') => {
    if (!selectedVideoId) {
      setErrorMsg('Please select a video.');
      return;
    }
    if (!formData.title.trim()) {
      setErrorMsg('Transcript title is required.');
      return;
    }
    if (!formData.transcript_content.trim()) {
      setErrorMsg('Transcript content cannot be empty. Please enter spoken dialogue or demonstration observation notes.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        video_id: selectedVideoId,
        module_id: selectedModuleId,
        stage_id: selectedStageId,
        title: formData.title,
        transcript_content: formData.transcript_content,
        has_spoken_dialogue: formData.has_spoken_dialogue ? 1 : 0,
        language: formData.language,
        publication_status: statusToSet
      };

      let res;
      if (currentTranscriptId) {
        res = await api.adminUpdateTranscript(currentTranscriptId, payload);
      } else {
        res = await api.adminCreateTranscript(payload);
      }

      if (res.success) {
        setSuccessMsg(
          statusToSet === 'PUBLISHED'
            ? '✓ Video transcript published successfully! Vocalists can now read along on the lesson page.'
            : '✓ Video transcript saved as Draft. It remains hidden from students until published.'
        );
        if (res.transcript?.id) {
          setCurrentTranscriptId(res.transcript.id);
        }
        setFormData(prev => ({ ...prev, publication_status: statusToSet }));
        await loadVideosAndTranscripts();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save transcript.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Transcript
  const handleDelete = async (idToDelete) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.adminDeleteTranscript(idToDelete);
      if (res.success) {
        setSuccessMsg('Video transcript deleted successfully.');
        setDeleteConfirmId(null);
        if (currentTranscriptId === idToDelete) {
          setCurrentTranscriptId(null);
          setFormData({
            title: 'Video Transcript',
            transcript_content: '',
            has_spoken_dialogue: true,
            language: 'en',
            publication_status: 'DRAFT'
          });
        }
        await loadVideosAndTranscripts();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete transcript.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVideo = curriculumVideos.find(v => v.id === selectedVideoId);
  const filteredVideos = curriculumVideos.filter(v => v.stage_id === selectedStageId);

  // Render Preview
  const renderPreviewElements = (content) => {
    if (!content) {
      return (
        <div style={{ color: '#9CA3AF', fontStyle: 'italic', padding: '20px 0' }}>
          No transcript content entered yet. Switch to Editor mode or generate a draft.
        </div>
      );
    }

    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} style={{ height: 10 }} />;

      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E1B4B', margin: '16px 0 6px 0' }}>
            {trimmed.replace(/^###\s+/, '')}
          </h4>
        );
      }

      if (trimmed.startsWith('- ')) {
        return (
          <li key={idx} style={{ margin: '4px 0 4px 20px', color: '#374151', fontSize: '0.94rem', lineHeight: 1.6 }}>
            {trimmed.replace(/^- /, '')}
          </li>
        );
      }

      // Simple inline token parsing for timestamps and bold
      const parts = trimmed.split(/(\[\d{1,2}:\d{2}\]|\*\*.*?\*\*)/g);
      return (
        <p key={idx} style={{ margin: '0 0 10px 0', fontSize: '0.94rem', lineHeight: 1.68, color: '#334155' }}>
          {parts.map((p, i) => {
            if (/^\[\d{1,2}:\d{2}\]$/.test(p)) {
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#6D28D9',
                    background: '#EDE9FE',
                    padding: '2px 7px',
                    borderRadius: 6,
                    marginRight: 6
                  }}
                >
                  <Clock size={11} /> {p.replace(/[[\]]/g, '')}
                </span>
              );
            }
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={i} style={{ color: '#0F172A' }}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </p>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: '22px 26px',
          border: '1px solid #EAE5F3',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#7C3AED',
                backgroundColor: '#F3E8FF',
                padding: '3px 9px',
                borderRadius: 6,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            >
              <FileText size={13} /> Curriculum Studio
            </span>
            <span style={{ color: '#9CA3AF' }}>•</span>
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              Authorized Video Transcript Management
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 4px', color: '#191B35' }}>
            Video Transcript Studio
          </h2>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748B' }}>
            Manage accurate, accessible, paragraph-formatted transcripts with timestamps for all curriculum videos.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={loadVideosAndTranscripts}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#475569',
              fontSize: '0.82rem',
              fontWeight: 650,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'dash-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#065F46',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Selectors & Editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* Step 1: Video Selection Strip */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: '22px 24px',
            border: '1px solid #EAE5F3'
          }}
        >
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.98rem', fontWeight: 800, color: '#191B35' }}>
            1. Select Curriculum Video Target
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* Module Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Learning Module
              </label>
              <select
                value={selectedModuleId}
                onChange={e => setSelectedModuleId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.86rem',
                  color: '#1E293B',
                  fontWeight: 600
                }}
              >
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Stage Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Curriculum Stage
              </label>
              <select
                value={selectedStageId}
                onChange={e => setSelectedStageId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#F8FAFC',
                  fontSize: '0.86rem',
                  color: '#1E293B',
                  fontWeight: 600
                }}
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Video Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                Curriculum Video
              </label>
              <select
                value={selectedVideoId}
                onChange={e => setSelectedVideoId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1.5px solid #7C3AED',
                  backgroundColor: '#FFFFFF',
                  fontSize: '0.86rem',
                  color: '#1E293B',
                  fontWeight: 700
                }}
              >
                {filteredVideos.length === 0 ? (
                  <option value="">No videos registered in this stage</option>
                ) : (
                  filteredVideos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.title || `Video #${v.id}`} ({v.transcript_status || 'No Transcript'})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Active Video Info Banner */}
          {selectedVideo && (
            <div
              style={{
                marginTop: 18,
                padding: '12px 16px',
                borderRadius: 10,
                backgroundColor: '#FAF5FF',
                border: '1px solid #E9D5FF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: '#7C3AED',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Video size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#191B35', fontSize: '0.9rem' }}>
                    {selectedVideo.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 1 }}>
                    URL: <span style={{ fontFamily: 'monospace' }}>{selectedVideo.content_url || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 6,
                    backgroundColor: formData.publication_status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                    color: formData.publication_status === 'PUBLISHED' ? '#15803D' : '#B45309'
                  }}
                >
                  Status: {formData.publication_status}
                </span>

                {/* Method B Trigger */}
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={generatingDraft}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #DDD6FE',
                    backgroundColor: '#FFFFFF',
                    color: '#6D28D9',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Method B: Generate transcription draft from video"
                >
                  <Sparkles size={13} />
                  <span>{generatingDraft ? 'Generating Draft...' : 'Method B: Audio Transcript Draft'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Transcript Editor & Preview */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid #EAE5F3'
          }}
        >
          {/* Header & Mode Switcher */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#191B35' }}>
                2. Transcript Content &amp; Formatting
              </h4>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Enter verified spoken words or structured lesson observations. No placeholders.
              </p>
            </div>

            {/* Edit / Preview Tabs */}
            <div style={{ display: 'flex', gap: 6, backgroundColor: '#F1F5F9', padding: 4, borderRadius: 8 }}>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: !previewMode ? '#FFFFFF' : 'transparent',
                  color: !previewMode ? '#191B35' : '#64748B',
                  fontWeight: !previewMode ? 750 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: !previewMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                <Edit3 size={13} /> Edit Mode
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: previewMode ? '#FFFFFF' : 'transparent',
                  color: previewMode ? '#7C3AED' : '#64748B',
                  fontWeight: previewMode ? 750 : 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: previewMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                <Eye size={13} /> Student Preview
              </button>
            </div>
          </div>

          {/* Form Fields Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 16 }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                Transcript Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Stage 3 Part 1: How Breathing Works - Instructional Transcript"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  color: '#1E293B',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Language */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                Language
              </label>
              <select
                value={formData.language}
                onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  boxSizing: 'border-box'
                }}
              >
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
              </select>
            </div>

            {/* Has Spoken Dialogue Toggle */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 5 }}>
                Dialogue Nature
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  backgroundColor: formData.has_spoken_dialogue ? '#F0FDF4' : '#FAF5FF',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  color: formData.has_spoken_dialogue ? '#15803D' : '#6B21A8'
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.has_spoken_dialogue}
                  onChange={e => setFormData(prev => ({ ...prev, has_spoken_dialogue: e.target.checked }))}
                />
                <span>{formData.has_spoken_dialogue ? 'Spoken Dialogue' : 'Instrumental / Demo'}</span>
              </label>
            </div>
          </div>

          {!previewMode ? (
            /* EDITOR MODE */
            <div>
              {/* Rich-Text Formatting Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderBottom: 'none',
                  borderRadius: '10px 10px 0 0',
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginRight: 6 }}>
                  Quick Format:
                </span>

                <button
                  type="button"
                  onClick={() => insertFormatting('### ', '\n', 'Section Heading')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                  title="Insert Heading (###)"
                >
                  <Heading size={12} /> Heading
                </button>

                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**', 'bold text')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                  title="Make text bold (**text**)"
                >
                  <Bold size={12} /> Bold
                </button>

                <button
                  type="button"
                  onClick={() => insertFormatting('- ', '\n', 'Key instruction point')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                  title="Insert Bullet Item (- )"
                >
                  <List size={12} /> Bullet Item
                </button>

                <button
                  type="button"
                  onClick={handleInsertTimestamp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #C4B5FD',
                    backgroundColor: '#F3E8FF',
                    color: '#6D28D9',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Insert timestamp tag like [00:15]"
                >
                  <Clock size={12} /> + Timestamp
                </button>

                <div style={{ flexGrow: 1 }} />

                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Markdown &amp; [MM:SS] timestamps supported
                </span>
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={formData.transcript_content}
                onChange={e => setFormData(prev => ({ ...prev, transcript_content: e.target.value }))}
                placeholder="Method A: Enter exact spoken transcript with [MM:SS] timestamps and paragraphs here...
Or click 'Method B: Audio Transcript Draft' above to automatically transcribe lesson demonstration."
                rows={14}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '0 0 10px 10px',
                  border: '1px solid #CBD5E1',
                  fontFamily: 'Consolas, Monaco, monospace',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: '#1E293B',
                  backgroundColor: '#FFFFFF',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          ) : (
            /* PREVIEW MODE: Live simulation of Student VideoTranscriptSection */
            <div
              style={{
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: '24px',
                backgroundColor: '#FAF8FC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#059669',
                    backgroundColor: '#D1FAE5',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}
                >
                  Previewing Student View
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                  Title: <strong>{formData.title || 'Video Transcript'}</strong>
                </span>
              </div>

              {!formData.has_spoken_dialogue && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: 10,
                    padding: '10px 14px',
                    marginBottom: 16,
                    color: '#6B21A8',
                    fontSize: '0.88rem'
                  }}
                >
                  <Music size={18} style={{ flexShrink: 0, color: '#9333EA' }} />
                  <div>
                    <strong>[♪ Instrumental / Demonstration video with no spoken dialogue]</strong>
                    <div style={{ fontSize: '0.82rem', color: '#7E22CE', marginTop: 2 }}>
                      The notes below outline the key physiological movements and breathing instructions demonstrated in this lesson.
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 10,
                  border: '1px solid #EAE5F3',
                  padding: '20px 24px'
                }}
              >
                {renderPreviewElements(formData.transcript_content)}
              </div>
            </div>
          )}

          {/* Action Buttons Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid #EAE5F3',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            {/* Delete button (if transcript exists) */}
            <div>
              {currentTranscriptId && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(currentTranscriptId)}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    backgroundColor: '#FEF2F2',
                    color: '#991B1B',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} /> Delete Transcript
                </button>
              )}
            </div>

            {/* Save Draft & Publish Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => handleSave('DRAFT')}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#334155',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Save size={15} /> Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSave('PUBLISHED')}
                disabled={loading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 22px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                }}
              >
                <Send size={15} /> Publish Transcript
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: All Managed Transcripts Directory */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: '24px',
            border: '1px solid #EAE5F3'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>
                Curriculum Transcripts Directory ({transcriptsList.length})
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Complete list of video transcripts across modules with live publication states.
              </p>
            </div>
          </div>

          {transcriptsList.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '0.86rem' }}>
              No transcripts created yet. Use the editor above to create your first transcript.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #E2E8F0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>Target Video</th>
                    <th style={{ padding: '10px 12px' }}>Stage</th>
                    <th style={{ padding: '10px 12px' }}>Transcript Title</th>
                    <th style={{ padding: '10px 12px' }}>Dialogue</th>
                    <th style={{ padding: '10px 12px' }}>Status</th>
                    <th style={{ padding: '10px 12px' }}>Updated</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transcriptsList.map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        backgroundColor: currentTranscriptId === t.id ? '#FAF5FF' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 700, color: '#1E293B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Video size={14} color="#7C3AED" />
                          <span>{t.video_title || `Video #${t.video_id}`}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#64748B' }}>
                        Stage {t.stage_id}
                      </td>
                      <td style={{ padding: '12px', color: '#1E293B', fontWeight: 600 }}>
                        {t.title}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {t.has_spoken_dialogue ? (
                          <span style={{ color: '#059669', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Volume2 size={12} /> Spoken
                          </span>
                        ) : (
                          <span style={{ color: '#7C3AED', fontSize: '0.76rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Music size={12} /> Demo / Inst.
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: t.publication_status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                            color: t.publication_status === 'PUBLISHED' ? '#15803D' : '#B45309'
                          }}
                        >
                          {t.publication_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748B', fontSize: '0.78rem' }}>
                        {t.updated_at ? new Date(t.updated_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVideoId(t.video_id);
                              setSelectedStageId(t.stage_id);
                              setSelectedModuleId(t.module_id || 1);
                              window.scrollTo({ top: 100, behavior: 'smooth' });
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#FFFFFF',
                              color: '#334155',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(t.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid #FECACA',
                              backgroundColor: '#FFF1F2',
                              color: '#BE123C',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: '24px 28px',
              maxWidth: 450,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              <Trash2 size={22} />
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 800, color: '#191B35' }}>
              Delete Video Transcript?
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to delete this transcript? Vocalists will no longer be able to view it under the lesson video.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={loading}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.84rem',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
