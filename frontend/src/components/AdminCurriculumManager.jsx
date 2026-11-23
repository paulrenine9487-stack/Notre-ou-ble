import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MediaUploadField from './MediaUploadField';
import AdminTranscriptManager from './AdminTranscriptManager';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  X,
  ExternalLink,
  Award,
  Video,
  FileText,
  Music,
  HelpCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wind,
  Sparkles,
  Lightbulb,
  Megaphone,
  CalendarCheck,
  RotateCw,
  Eye,
  EyeOff,
  Upload,
  Download,
  Layers,
  Settings,
  Play,
  Repeat
} from 'lucide-react';

export default function AdminCurriculumManager() {
  const [modulesList, setModulesList] = useState([
    { id: 1, module_number: 1, title: 'The Hidden Engine: Breath Control & Vocal Stamina', description: 'Learn posture, diaphragmatic breathing, breath control and vocal stamina for singing.', status: 'IN_PROGRESS', is_available: 1, category: 'Breath' },
    { id: 2, module_number: 2, title: 'Tuning the Instrument: Ear-to-Voice Precision', description: 'Develop accurate pitch recognition, listening skills and voice control.', status: 'COMING_SOON', is_available: 0, category: 'Pitch Correction' },
    { id: 3, module_number: 3, title: 'Breaking the Ceiling: Singing High Notes Without Strain', description: 'Learn techniques for developing vocal range and singing higher notes comfortably.', status: 'COMING_SOON', is_available: 0, category: 'High Notes' },
    { id: 4, module_number: 4, title: 'Sculpting Words: Shaping Vowels and Consonants', description: 'Improve pronunciation, vowel formation, consonant clarity and vocal articulation.', status: 'COMING_SOON', is_available: 0, category: 'Pronunciation & Diction' },
    { id: 5, module_number: 5, title: 'Making It Yours: Phrasing, Emotion, and Musical Style', description: 'Develop musical expression, phrasing, interpretation and individual singing style.', status: 'COMING_SOON', is_available: 0, category: 'Style of the Song' }
  ]);
  const [selectedModuleId, setSelectedModuleId] = useState(1);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleSaving, setModuleSaving] = useState(false);

  const [stages, setStages] = useState([]);
  const [selectedStageNum, setSelectedStageNum] = useState(1);
  const [activeSubTab, setActiveSubTab] = useState('content'); // content | submissions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submissions, setSubmissions] = useState(null);

  // Form states for modals/dialogs
  const [editStageModal, setEditStageModal] = useState(null);
  const [editingObjective, setEditingObjective] = useState(null);
  const [newObjective, setNewObjective] = useState({
    title_line_1: '',
    title_line_2: '',
    description: '',
    icon: 'Lightbulb',
    display_order: 1,
    is_active: true
  });
  const [newQuestion, setNewQuestion] = useState({ question: '', instructions: '', display_order: 1 });
  const [newTip, setNewTip] = useState({ title: '', description: '', icon: 'Wind', display_order: 1 });
  const [newSong, setNewSong] = useState({ title: '', artist: '', media_url: '', instructions: '', media_type: 'audio', display_order: 1 });
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', challenge_type: 'myth_or_fact', total_marks: 50, passing_score: 30, configuration: { questions: [] } });

  // Stage 1 & Stage 3 Video Edit States
  const [editingStage1Video, setEditingStage1Video] = useState(null);
  const [stage1VideoSaving, setStage1VideoSaving] = useState(false);
  const [editingStage3Video, setEditingStage3Video] = useState(null);
  const [stage3VideoSaving, setStage3VideoSaving] = useState(false);
  const [showStage3TranscriptQuickBox, setShowStage3TranscriptQuickBox] = useState(false);

  // Content Row Edit States
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingTip, setEditingTip] = useState(null);
  const [editingSongItem, setEditingSongItem] = useState(null);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);
  const [editingChallenge, setEditingChallenge] = useState(null);

  // Grading state for written assessments
  const [gradingItem, setGradingItem] = useState(null);
  const [gradeScore, setGradeScore] = useState(85);
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Stage 03 Part 02 Management State
  const [part2Data, setPart2Data] = useState(null);
  const [editingPart2, setEditingPart2] = useState({ title: '', subtitle: '', model_asset_url: '' });
  const [newIndicator, setNewIndicator] = useState({ title: '', description: '', body_region: 'head', icon: 'head', display_order: 1 });
  const [newChecklistItem, setNewChecklistItem] = useState({ item_text: '', display_order: 1, is_required: true });
  const [breathingLevels, setBreathingLevels] = useState([]);

  // Stage 03 Part 02 Song Practice State
  const [songPracticeData, setSongPracticeData] = useState(null);
  const [editingSong, setEditingSong] = useState({
    song_title: '',
    artist_name: '',
    subtitle: '',
    instructions: '',
    audio_file: '',
    default_repeat_count: 1,
    min_repeat_count: 1,
    max_repeat_count: 3,
    continuous_loop_enabled: true
  });
  const [songStudents, setSongStudents] = useState([]);
  const [selectedAdminSongLevelKey, setSelectedAdminSongLevelKey] = useState('beginner');
  const [levelScoreInputs, setLevelScoreInputs] = useState({});
  const [songAudioUploading, setSongAudioUploading] = useState(false);
  const [scoreUploading, setScoreUploading] = useState(false);

  const loadPart2Data = async () => {
    try {
      const res = await api.adminGetPartSection(1);
      if (res && res.success) {
        setPart2Data(res);
        setEditingPart2({
          title: res.part?.title || 'Part 2 • Step 1: Posture',
          subtitle: res.part?.subtitle || 'Stand tall, stay relaxed',
          model_asset_url: res.part?.model_asset_url || ''
        });
      }
      const bRes = await api.adminGetBreathingLevels();
      if (bRes && bRes.success) {
        setBreathingLevels(bRes.levels || []);
      }
      const songRes = await api.adminGetSongPractice();
      if (songRes && songRes.success && songRes.song) {
        setSongPracticeData(songRes);
        setEditingSong({
          song_title: songRes.song.song_title || '',
          artist_name: songRes.song.artist_name || '',
          subtitle: songRes.song.subtitle || '',
          instructions: songRes.song.instructions || '',
          audio_file: songRes.song.audio_file || '',
          default_repeat_count: songRes.song.default_repeat_count || 1,
          min_repeat_count: songRes.song.min_repeat_count || 1,
          max_repeat_count: songRes.song.max_repeat_count || 3,
          continuous_loop_enabled: songRes.song.continuous_loop_enabled !== false
        });
      }
      const stRes = await api.adminGetSongStudents();
      if (stRes && stRes.success) {
        setSongStudents(stRes.students || []);
      }
    } catch (e) {
      console.warn('Could not load part2 in admin:', e);
    }
  };

  // Stage 04: Myth or Fact Management State
  const [mfQuestions, setMfQuestions] = useState([]);
  const [mfStudents, setMfStudents] = useState([]);
  const [editingMfQuestion, setEditingMfQuestion] = useState(null);
  const [newMfQuestion, setNewMfQuestion] = useState({
    statement: '',
    correct_answer: 'MYTH',
    explanation: '',
    display_order: 1
  });

  // Stage 04: Learning Reflection Pinboard Management State
  const [reflectionList, setReflectionList] = useState([]);
  const [reflectionSearch, setReflectionSearch] = useState('');
  const [selectedReflectionDetail, setSelectedReflectionDetail] = useState(null);

  const loadReflectionData = async () => {
    try {
      const res = await api.adminGetLearningReflections({
        moduleId: 1,
        stageId: 4,
        search: reflectionSearch
      });
      if (res && res.success) {
        setReflectionList(res.reflections || []);
      }
    } catch (e) {
      console.warn('Could not load admin learning reflections:', e);
    }
  };

  const loadMythFactData = async () => {
    try {
      const qRes = await api.adminGetMythFactQuestions();
      if (qRes && qRes.success) {
        setMfQuestions(qRes.questions || []);
      }
      const sRes = await api.adminGetMythFactStudentResults();
      if (sRes && sRes.success) {
        setMfStudents(sRes.students || []);
      }
    } catch (e) {
      console.warn('Could not load Myth or Fact admin data:', e);
    }
  };

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getAdminCurriculum();
      if (res.success) {
        setStages(res.stages || []);
      } else {
        setError(res.message || 'Failed to load curriculum.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async () => {
    try {
      const res = await api.getAdminModules();
      if (res && res.success && res.modules && res.modules.length > 0) {
        setModulesList(res.modules);
      }
    } catch (e) {
      console.warn('Could not load modules:', e);
    }
  };

  const handleSaveModule = async (moduleId, data) => {
    try {
      setModuleSaving(true);
      const res = await api.updateAdminModule(moduleId, data);
      if (res && res.success) {
        showSuccess('Module details updated and saved in MySQL!');
        setEditingModule(null);
        await loadModules();
      } else {
        alert(res?.message || 'Failed to update module.');
      }
    } catch (e) {
      alert(e.message || 'Error updating module.');
    } finally {
      setModuleSaving(false);
    }
  };

  const loadStudentSubmissions = async () => {
    try {
      const res = await api.getAdminStudentSubmissions();
      if (res.success) {
        setSubmissions(res.submissions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadModules();
    loadCurriculum();
    loadStudentSubmissions();
    loadPart2Data();
    loadMythFactData();
    loadReflectionData();
  }, []);

  const currentStage = stages.find(s => s.stage_number === selectedStageNum) || stages[0];

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Synchronize Stage 1 and Stage 3 video editing states
  useEffect(() => {
    if (!currentStage) return;
    if (currentStage.stage_number === 1) {
      const v = currentStage.content?.find(c => c.content_type === 'intro_video' || c.content_type === 'video');
      if (v) {
        setEditingStage1Video({
          id: v.id,
          title: v.title || 'Introduction to Breath Management',
          description: v.description || 'Watch this visual guide to understand how comfortable diaphragmatic breathing creates effortless vocal support.',
          content_url: v.content_url || '/IMG_7993.MP4'
        });
      }
    } else if (currentStage.stage_number === 3) {
      const v = currentStage.content?.find(c => c.content_type === 'teaching_video' || c.content_type === 'video');
      if (v) {
        setEditingStage3Video({
          id: v.id,
          title: v.title || 'Part 1 • How breathing works',
          description: v.description || 'Watch the full video before moving to the practice guide',
          content_url: v.content_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
        });
      }
    }
  }, [currentStage]);

  const handleSaveStage1Video = async () => {
    if (!editingStage1Video?.id) return;
    try {
      setStage1VideoSaving(true);
      const res = await api.updateAdminStageContent(editingStage1Video.id, {
        title: editingStage1Video.title,
        description: editingStage1Video.description,
        content_url: editingStage1Video.content_url
      });
      if (res && res.success) {
        showSuccess('Stage 01 Introduction Video saved in MySQL!');
        await loadCurriculum();
      }
    } catch (e) {
      alert(e.message || 'Error updating introduction video');
    } finally {
      setStage1VideoSaving(false);
    }
  };

  const handleSaveStage3Video = async () => {
    if (!editingStage3Video?.id) return;
    try {
      setStage3VideoSaving(true);
      const res = await api.updateAdminStageContent(editingStage3Video.id, {
        title: editingStage3Video.title,
        description: editingStage3Video.description,
        content_url: editingStage3Video.content_url
      });
      if (res && res.success) {
        showSuccess('Stage 03 Teaching Video saved in MySQL!');
        await loadCurriculum();
      }
    } catch (e) {
      alert(e.message || 'Error updating teaching video');
    } finally {
      setStage3VideoSaving(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion?.id) return;
    try {
      const res = await api.updateAdminRecallQuestion(editingQuestion.id, {
        question: editingQuestion.question,
        instructions: editingQuestion.instructions
      });
      if (res && res.success) {
        showSuccess('Recall question updated successfully!');
        setEditingQuestion(null);
        await loadCurriculum();
      }
    } catch (e) {
      alert(e.message || 'Error updating question');
    }
  };

  const handleSaveTip = async () => {
    if (!editingTip?.id) return;
    try {
      const res = await api.updateAdminTip(editingTip.id, {
        title: editingTip.title,
        description: editingTip.description
      });
      if (res && res.success) {
        showSuccess('Breathing tip updated successfully!');
        setEditingTip(null);
        await loadCurriculum();
      }
    } catch (e) {
      alert(e.message || 'Error updating tip');
    }
  };

  const handleSaveSongItem = async () => {
    if (!editingSongItem?.id) return;
    try {
      const res = await api.updateAdminSong(editingSongItem.id, {
        title: editingSongItem.title,
        artist: editingSongItem.artist,
        media_url: editingSongItem.media_url
      });
      if (res && res.success) {
        showSuccess('Practice song updated successfully!');
        setEditingSongItem(null);
        await loadCurriculum();
      }
    } catch (e) {
      alert(e.message || 'Error updating song');
    }
  };

  const handleSaveIndicator = async () => {
    if (!editingIndicator?.id) return;
    try {
      const res = await api.adminUpdatePostureIndicator(editingIndicator.id, {
        title: editingIndicator.title,
        body_region: editingIndicator.body_region,
        description: editingIndicator.description
      });
      if (res && res.success) {
        showSuccess('Posture indicator updated!');
        setEditingIndicator(null);
        await loadPart2Data();
      }
    } catch (e) {
      alert(e.message || 'Error updating indicator');
    }
  };

  const handleSaveChecklistItem = async () => {
    if (!editingChecklistItem?.id) return;
    try {
      const res = await api.adminUpdatePostureChecklistItem(editingChecklistItem.id, {
        item_text: editingChecklistItem.item_text
      });
      if (res && res.success) {
        showSuccess('Checklist item updated!');
        setEditingChecklistItem(null);
        await loadPart2Data();
      }
    } catch (e) {
      alert(e.message || 'Error updating checklist item');
    }
  };

  const handleSaveChallenge = async () => {
    if (!editingChallenge?.id) return;
    try {
      const res = await api.updateAdminChallenge(editingChallenge.id, {
        title: editingChallenge.title,
        description: editingChallenge.description
      });
      if (res && res.success) {
        showSuccess('Challenge updated successfully!');
        setEditingChallenge(null);
        await loadCurriculum();
      }
    } catch (e) {
      alert(e.message || 'Error updating challenge');
    }
  };

  // Stage update
  const handleSaveStageInfo = async (stageId, data) => {
    try {
      const res = await api.updateAdminStage(stageId, data);
      if (res.success) {
        showSuccess('Stage details updated in MySQL!');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Content update
  const handleUpdateContent = async (contentId, data) => {
    try {
      const res = await api.updateAdminStageContent(contentId, data);
      if (res.success) {
        showSuccess('Content updated in MySQL!');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Objectives handlers (3D Interactive Flip Cards)
  const handleAddObjective = async () => {
    const t1 = (newObjective.title_line_1 || '').trim();
    const t2 = (newObjective.title_line_2 || '').trim();
    if (!t1 && !t2) {
      alert('Please enter at least Title Line 1 or Line 2.');
      return;
    }
    try {
      const res = await api.createAdminObjective({
        stage_id: currentStage.id,
        title: `${t1} ${t2}`.trim(),
        title_line_1: t1,
        title_line_2: t2,
        description: (newObjective.description || '').trim(),
        icon: newObjective.icon || 'Lightbulb',
        display_order: parseInt(newObjective.display_order, 10) || (currentStage.objectives?.length || 0) + 1,
        is_active: newObjective.is_active !== false
      });
      if (res.success) {
        showSuccess('Objective card created successfully!');
        setNewObjective({
          title_line_1: '',
          title_line_2: '',
          description: '',
          icon: 'Lightbulb',
          display_order: (currentStage.objectives?.length || 0) + 2,
          is_active: true
        });
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSaveEditObjective = async () => {
    if (!editingObjective) return;
    const t1 = (editingObjective.title_line_1 || '').trim();
    const t2 = (editingObjective.title_line_2 || '').trim();
    try {
      const res = await api.updateAdminObjective(editingObjective.id, {
        title: `${t1} ${t2}`.trim(),
        title_line_1: t1,
        title_line_2: t2,
        description: (editingObjective.description || '').trim(),
        icon: editingObjective.icon || 'Lightbulb',
        display_order: parseInt(editingObjective.display_order, 10) || 1,
        is_active: editingObjective.is_active !== false
      });
      if (res.success) {
        showSuccess('Objective card updated successfully!');
        setEditingObjective(null);
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleObjectiveActive = async (obj) => {
    try {
      const res = await api.updateAdminObjective(obj.id, {
        is_active: !obj.is_active
      });
      if (res.success) {
        showSuccess(`Objective card ${obj.is_active ? 'disabled' : 'enabled'}.`);
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteObjective = async (id) => {
    if (!window.confirm('Are you sure you want to delete this objective card?')) return;
    try {
      const res = await api.deleteAdminObjective(id);
      if (res.success) {
        showSuccess('Objective deleted.');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Questions handlers
  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim()) return;
    try {
      const res = await api.createAdminRecallQuestion({
        stage_id: currentStage.id,
        ...newQuestion
      });
      if (res.success) {
        showSuccess('Recall question added!');
        setNewQuestion({ question: '', instructions: '', display_order: (currentStage.recallQuestions?.length || 0) + 1 });
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await api.deleteAdminRecallQuestion(id);
      if (res.success) {
        showSuccess('Recall question deleted.');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Tips handlers
  const handleAddTip = async () => {
    if (!newTip.title.trim()) return;
    try {
      const res = await api.createAdminTip({
        stage_id: currentStage.id,
        ...newTip
      });
      if (res.success) {
        showSuccess('Breathing tip added!');
        setNewTip({ title: '', description: '', icon: 'Wind', display_order: (currentStage.tips?.length || 0) + 1 });
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteTip = async (id) => {
    if (!window.confirm('Delete this tip?')) return;
    try {
      const res = await api.deleteAdminTip(id);
      if (res.success) {
        showSuccess('Tip deleted.');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Song handlers
  const handleAddSong = async () => {
    if (!newSong.title.trim()) return;
    try {
      const res = await api.createAdminSong({
        stage_id: currentStage.id,
        ...newSong
      });
      if (res.success) {
        showSuccess('Song added!');
        setNewSong({ title: '', artist: '', media_url: '', instructions: '', media_type: 'audio', display_order: (currentStage.songs?.length || 0) + 1 });
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteSong = async (id) => {
    if (!window.confirm('Delete this song?')) return;
    try {
      const res = await api.deleteAdminSong(id);
      if (res.success) {
        showSuccess('Song deleted.');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Part 2 Interactive Practice Handlers
  const handleSavePart2Info = async () => {
    try {
      const res = await api.adminUpdatePartSection(1, editingPart2);
      if (res.success) {
        showSuccess('Part 2 Section info updated in MySQL!');
        loadPart2Data();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddPostureIndicator = async () => {
    if (!newIndicator.title.trim()) return;
    try {
      const res = await api.adminCreatePostureIndicator(1, newIndicator);
      if (res.success) {
        showSuccess('Posture Indicator added!');
        setNewIndicator({ title: '', description: '', body_region: 'head', icon: 'head', display_order: 1 });
        loadPart2Data();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeletePostureIndicator = async (id) => {
    if (!window.confirm('Delete this indicator?')) return;
    try {
      const res = await api.adminDeletePostureIndicator(id);
      if (res.success) {
        showSuccess('Indicator deleted.');
        loadPart2Data();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddPostureChecklistItem = async () => {
    if (!newChecklistItem.item_text.trim()) return;
    try {
      const res = await api.adminCreatePostureChecklistItem(1, newChecklistItem);
      if (res.success) {
        showSuccess('Posture checklist item added!');
        setNewChecklistItem({ item_text: '', display_order: 1, is_required: true });
        loadPart2Data();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeletePostureChecklistItem = async (id) => {
    if (!window.confirm('Delete this checklist item?')) return;
    try {
      const res = await api.adminDeletePostureChecklistItem(id);
      if (res.success) {
        showSuccess('Checklist item deleted.');
        loadPart2Data();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUpdateBreathingLevel = async (levelKey, data) => {
    try {
      const res = await api.adminUpdateBreathingLevel(levelKey, data);
      if (res.success) {
        showSuccess(`Breathing timing for ${levelKey} updated!`);
        loadPart2Data();
      } else {
        alert(res.message || 'Failed to update level.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Step 3: Sing it – Song Practice Handlers
  const handleSaveSongPracticeMetadata = async () => {
    try {
      const res = await api.adminUpdateSongPractice(editingSong);
      if (res && res.success) {
        showSuccess('Song practice metadata updated in MySQL!');
        loadPart2Data();
      } else {
        alert(res?.message || 'Failed to update song metadata.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUploadSongAudio = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('audio', file);
    try {
      setSongAudioUploading(true);
      const res = await api.adminUploadSongAudio(formData);
      if (res && res.success) {
        showSuccess('Song practice audio guide uploaded!');
        setEditingSong(prev => ({ ...prev, audio_file: res.audio_file }));
        loadPart2Data();
      } else {
        alert(res?.message || 'Failed to upload audio.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setSongAudioUploading(false);
    }
  };

  const handleUploadScoreSheet = async (levelId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('score_file', file);
    try {
      setScoreUploading(true);
      const res = await api.adminUploadSongScore(levelId, formData);
      if (res && res.success) {
        showSuccess('Score sheet file uploaded!');
        loadPart2Data();
      } else {
        alert(res?.message || 'Failed to upload score sheet.');
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setScoreUploading(false);
    }
  };

  const handleSaveLevelScore = async (levelId) => {
    const targetLevel = songPracticeData?.levels?.find(l => l.id === levelId);
    const input = levelScoreInputs[levelId] || {};
    const scoreFile = input.score_file !== undefined ? input.score_file : (targetLevel?.score_file || (targetLevel?.level_key === 'beginner' ? '/1 break.png' : ''));

    try {
      setScoreUploading(true);
      const res = await api.adminUploadSongScore(levelId, {
        score_file: scoreFile
      });
      if (res && res.success) {
        showSuccess(`${targetLevel?.level_name || 'Level'} score sheet saved in MySQL!`);
        await loadPart2Data();
      } else {
        alert(res?.message || 'Failed to save score sheet.');
      }
    } catch (e) {
      alert(e.message || 'Error saving score sheet.');
    } finally {
      setScoreUploading(false);
    }
  };

  const handleResetStudentSong = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to reset all song practice progress for ${username}?`)) return;
    try {
      const res = await api.adminResetStudentSongProgress(userId);
      if (res && res.success) {
        showSuccess(`Practice records reset for ${username}.`);
        loadPart2Data();
      } else {
        alert(res?.message || 'Failed to reset student progress.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportSongStudentsCSV = () => {
    if (!songStudents || songStudents.length === 0) {
      alert('No student records to export.');
      return;
    }
    const headers = ['User ID', 'Name', 'Email', 'Song', 'Beginner Marked', 'Beginner Total', 'Beginner Status', 'Intermediate Marked', 'Intermediate Total', 'Intermediate Status', 'Advanced Marked', 'Advanced Total', 'Advanced Status', 'Max Repeat Loops', 'Total Sessions', 'Last Practice Date'];
    const rows = songStudents.map(s => [
      s.user_id,
      `"${s.username || ''}"`,
      `"${s.email || ''}"`,
      `"${s.song_title || 'Snowman'}"`,
      s.beginner_marked,
      s.beginner_total,
      s.beginner_status,
      s.intermediate_marked,
      s.intermediate_total,
      s.intermediate_status,
      s.advanced_marked,
      s.advanced_total,
      s.advanced_status,
      s.max_repeat,
      s.total_sessions,
      s.last_practice_date ? new Date(s.last_practice_date).toLocaleString() : 'N/A'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `song_practice_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Challenges handlers
  const handleDeleteChallenge = async (id) => {
    if (!window.confirm('Delete this challenge?')) return;
    try {
      const res = await api.deleteAdminChallenge(id);
      if (res.success) {
        showSuccess('Challenge deleted.');
        loadCurriculum();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // Stage 04: Breathe Right: Fact or Myth? Handlers
  const handleSaveMfQuestion = async (id, data) => {
    try {
      const res = await api.adminUpdateMythFactQuestion(id, data);
      if (res && res.success) {
        showSuccess('Myth or Fact question updated!');
        setEditingMfQuestion(null);
        loadMythFactData();
        loadCurriculum();
      } else {
        alert(res?.message || 'Failed to update question.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleAddMfQuestion = async () => {
    if (!newMfQuestion.statement.trim() || !newMfQuestion.explanation.trim()) {
      alert('Please fill out statement and explanation.');
      return;
    }
    try {
      const res = await api.adminCreateMythFactQuestion(newMfQuestion);
      if (res && res.success) {
        showSuccess('New Myth or Fact question added!');
        setNewMfQuestion({
          statement: '',
          correct_answer: 'MYTH',
          explanation: '',
          display_order: (mfQuestions.length || 0) + 1
        });
        loadMythFactData();
        loadCurriculum();
      } else {
        alert(res?.message || 'Failed to add question.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteMfQuestion = async (id) => {
    if (!window.confirm('Delete this question from Myth or Fact challenge?')) return;
    try {
      const res = await api.adminDeleteMythFactQuestion(id);
      if (res && res.success) {
        showSuccess('Question deleted.');
        loadMythFactData();
        loadCurriculum();
      } else {
        alert(res?.message || 'Failed to delete question.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleResetMfStudent = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to reset Myth or Fact quiz records for ${username}?`)) return;
    try {
      const res = await api.adminResetStudentMythFact(userId);
      if (res && res.success) {
        showSuccess(`Myth or Fact quiz records reset for ${username}.`);
        loadMythFactData();
      } else {
        alert(res?.message || 'Failed to reset student records.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportMfCSV = () => {
    if (!mfStudents || mfStudents.length === 0) {
      alert('No student records to export.');
      return;
    }
    const headers = ['User ID', 'Name', 'Email', 'Total Attempts', 'Best Score', 'Best Percentage', 'Latest Score', 'Latest Percentage', 'Latest Status', 'Correct Answers', 'Incorrect Answers', 'Last Attempt Date'];
    const rows = mfStudents.map(s => [
      s.user_id,
      `"${s.username || ''}"`,
      `"${s.email || ''}"`,
      s.total_attempts || 0,
      s.best_score || 0,
      `${s.best_percentage || 0}%`,
      s.latest_score || 0,
      `${s.latest_percentage || 0}%`,
      s.latest_status || 'NOT_STARTED',
      s.total_correct_answers || 0,
      s.total_incorrect_answers || 0,
      s.last_attempt_date ? new Date(s.last_attempt_date).toLocaleString() : 'N/A'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `myth_or_fact_students_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stage 04: Learning Reflection Handlers
  const handleResetReflection = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to reset the learning reflection for ${username}?`)) return;
    try {
      const res = await api.adminResetStudentReflection(userId);
      if (res && res.success) {
        showSuccess(`Learning reflection reset for ${username}.`);
        loadReflectionData();
      } else {
        alert(res?.message || 'Failed to reset reflection.');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const handleExportReflectionsCSV = () => {
    if (!reflectionList || reflectionList.length === 0) {
      alert('No reflections to export.');
      return;
    }
    const headers = ['User ID', 'Username', 'Email', 'Status', 'What I Know', 'What I Want', 'What I Have Learned', 'Submitted At', 'Updated At', 'Versions'];
    const rows = reflectionList.map(r => [
      r.user_id,
      `"${r.username || ''}"`,
      `"${r.email || ''}"`,
      r.status,
      `"${(r.question_1_answer || '').replace(/"/g, '""')}"`,
      `"${(r.question_2_answer || '').replace(/"/g, '""')}"`,
      `"${(r.question_3_answer || '').replace(/"/g, '""')}"`,
      r.submitted_at || '',
      r.updated_at || '',
      r.version_count || 1
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stage04_Learning_Reflections_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Grade written assessment
  const handleGradeAssessment = async () => {
    if (!gradingItem) return;
    try {
      const res = await api.gradeAdminWrittenAssessment(gradingItem.id, {
        assessment_score: gradeScore,
        reviewer_feedback: gradeFeedback
      });
      if (res.success) {
        showSuccess('Assessment graded and feedback submitted!');
        setGradingItem(null);
        loadStudentSubmissions();
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, border: '1px solid #EAE5F3' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
            LEARNING MANAGEMENT SYSTEM
          </span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#143137', margin: '4px 0 0 0' }}>
            5-Stage Breath Management Curriculum Studio
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#77728A', margin: '4px 0 0 0' }}>
            Manage and edit all content, videos, objectives, recall questions, tips, songs, and challenges live in MySQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setActiveSubTab('content')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 750,
              border: activeSubTab === 'content' ? '2px solid #7C3AED' : '1px solid #EAE5F3',
              backgroundColor: activeSubTab === 'content' ? '#EBF5F1' : '#FFFFFF',
              color: activeSubTab === 'content' ? '#15966A' : '#77728A',
              cursor: 'pointer'
            }}
          >
            Curriculum Content
          </button>
          <button
            onClick={() => setActiveSubTab('submissions')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 750,
              border: activeSubTab === 'submissions' ? '2px solid #7C3AED' : '1px solid #EAE5F3',
              backgroundColor: activeSubTab === 'submissions' ? '#EBF5F1' : '#FFFFFF',
              color: activeSubTab === 'submissions' ? '#15966A' : '#77728A',
              cursor: 'pointer'
            }}
          >
            Student Submissions Review
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', background: '#E2F3EB', border: '1px solid #A7F3D0', borderRadius: 10, color: '#065F46', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10, color: '#991B1B', marginBottom: 20, fontSize: '0.9rem' }}>
          <AlertCircle size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#77728A' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          Loading curriculum...
        </div>
      ) : activeSubTab === 'submissions' ? (
        /* Submissions Review View */
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#143137', marginBottom: 16 }}>
            Live Student Submissions Across the 5 Stages
          </h4>

          {/* Written Assessments awaiting grading */}
          <div style={{ marginBottom: 28 }}>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#7C3AED', marginBottom: 10 }}>
              Written Assessments ({submissions?.writtenAssessments?.length || 0})
            </h5>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A' }}>
                    <th style={{ padding: 10 }}>Student</th>
                    <th style={{ padding: 10 }}>Submission Date</th>
                    <th style={{ padding: 10 }}>Answer</th>
                    <th style={{ padding: 10 }}>Score</th>
                    <th style={{ padding: 10 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions?.writtenAssessments?.map(wa => (
                    <tr key={wa.id} style={{ borderBottom: '1px solid #F4F0FF' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{wa.username}</td>
                      <td style={{ padding: 10, color: '#77728A' }}>{new Date(wa.submitted_at).toLocaleDateString()}</td>
                      <td style={{ padding: 10, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {wa.answer}
                      </td>
                      <td style={{ padding: 10 }}>{wa.assessment_score !== null ? `${wa.assessment_score} / 100` : 'Ungraded'}</td>
                      <td style={{ padding: 10 }}>
                        <button
                          onClick={() => {
                            setGradingItem(wa);
                            setGradeScore(wa.assessment_score || 85);
                            setGradeFeedback(wa.reviewer_feedback || '');
                          }}
                          style={{ padding: '6px 12px', borderRadius: 6, backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
                        >
                          Grade / Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Challenge Attempts */}
          <div style={{ marginBottom: 28 }}>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#7C3AED', marginBottom: 10 }}>
              Interactive Challenge Attempts ({submissions?.challengeAttempts?.length || 0})
            </h5>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A' }}>
                    <th style={{ padding: 10 }}>Student</th>
                    <th style={{ padding: 10 }}>Challenge</th>
                    <th style={{ padding: 10 }}>Attempt #</th>
                    <th style={{ padding: 10 }}>Score</th>
                    <th style={{ padding: 10 }}>Status</th>
                    <th style={{ padding: 10 }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions?.challengeAttempts?.map(ca => (
                    <tr key={ca.id} style={{ borderBottom: '1px solid #F4F0FF' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{ca.username}</td>
                      <td style={{ padding: 10 }}>{ca.challenge_title}</td>
                      <td style={{ padding: 10 }}>#{ca.attempt_number}</td>
                      <td style={{ padding: 10, fontWeight: 700, color: '#15966A' }}>{ca.score} / {ca.total_marks} ({ca.percentage}%)</td>
                      <td style={{ padding: 10 }}>{ca.status}</td>
                      <td style={{ padding: 10, color: '#77728A' }}>{new Date(ca.completed_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Recordings */}
          <div>
            <h5 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#7C3AED', marginBottom: 10 }}>
              Student Audio Performances ({submissions?.recordings?.length || 0})
            </h5>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A' }}>
                    <th style={{ padding: 10 }}>Student</th>
                    <th style={{ padding: 10 }}>Song / Title</th>
                    <th style={{ padding: 10 }}>Duration</th>
                    <th style={{ padding: 10 }}>Date</th>
                    <th style={{ padding: 10 }}>Audio Playback</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions?.recordings?.map(rec => (
                    <tr key={rec.id} style={{ borderBottom: '1px solid #F4F0FF' }}>
                      <td style={{ padding: 10, fontWeight: 700 }}>{rec.username}</td>
                      <td style={{ padding: 10 }}>{rec.song_title || 'Breath Vocal Recording'}</td>
                      <td style={{ padding: 10 }}>{rec.duration_seconds}s</td>
                      <td style={{ padding: 10, color: '#77728A' }}>{new Date(rec.submitted_at).toLocaleString()}</td>
                      <td style={{ padding: 10 }}>
                        <audio controls src={api.getRecordingAudioUrl ? api.getRecordingAudioUrl(rec.id) : `/api/learning/recordings/${rec.id}/audio`} style={{ height: 32 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grading Modal */}
          {gradingItem && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 540, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#143137', marginBottom: 8 }}>
                  Grade Written Assessment for {gradingItem.username}
                </h4>
                <div style={{ background: '#F9FBF9', padding: 14, borderRadius: 10, marginBottom: 16, fontSize: '0.88rem', color: '#354E54', maxHeight: 180, overflowY: 'auto' }}>
                  <strong>Student Response:</strong>
                  <p style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap' }}>{gradingItem.answer}</p>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#143137', display: 'block', marginBottom: 4 }}>
                    Score Awarded (out of 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(parseInt(e.target.value, 10) || 0)}
                    style={{ width: 120, padding: 8, borderRadius: 8, border: '1px solid #EAE5F3' }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#143137', display: 'block', marginBottom: 4 }}>
                    Trainer Feedback & Advice
                  </label>
                  <textarea
                    rows={4}
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    placeholder="Provide constructive feedback for the singer..."
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #EAE5F3', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => setGradingItem(null)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #EAE5F3', background: '#FFFFFF', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGradeAssessment}
                    style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#FFFFFF', fontWeight: 750, cursor: 'pointer' }}
                  >
                    Save Grade
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Curriculum Content Management View */
        <div>
          {/* Module Selector Bar (1 to 5) */}
          <div style={{ marginBottom: 20, backgroundColor: '#FAF9FE', padding: '16px', borderRadius: 14, border: '1.5px solid #EAE5F3' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#201B45', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  CURRICULUM MODULES (SELECT TO MANAGE):
                </span>
                <span style={{ marginLeft: 8, fontSize: '0.76rem', color: '#77728A' }}>
                  Select a module to view and edit its tasks and configuration
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              {modulesList.map((m) => {
                const isModActive = selectedModuleId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedModuleId(m.id);
                      if (m.id === 1) setSelectedStageNum(1);
                      setEditingModule(null);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: isModActive ? '2px solid #7C3AED' : '1px solid #EAE5F3',
                      backgroundColor: isModActive ? '#201B45' : '#FFFFFF',
                      color: isModActive ? '#FFFFFF' : '#191B35',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isModActive ? '0 4px 14px rgba(32, 27, 69, 0.16)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, opacity: isModActive ? 0.9 : 0.7, textTransform: 'uppercase' }}>
                        Module {m.module_number || m.id}
                      </span>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                        backgroundColor: isModActive ? 'rgba(255,255,255,0.2)' : (m.status === 'COMING_SOON' ? '#FEF3C7' : '#DCFCE7'),
                        color: isModActive ? '#FFFFFF' : (m.status === 'COMING_SOON' ? '#92400E' : '#166534')
                      }}>
                        {m.status === 'COMING_SOON' ? 'Coming Soon' : 'Active'}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.82rem',
                      fontWeight: 750,
                      lineHeight: 1.3,
                      marginBottom: 4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isModActive ? 'rgba(255,255,255,0.7)' : '#77728A' }}>
                      {m.category || 'Vocal Training'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedModuleId !== 1 ? (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, border: '1.5px solid #EAE5F3' }}>
              {(() => {
                const currentMod = modulesList.find(m => m.id === selectedModuleId) || modulesList[0];
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
                          MODULE {currentMod.module_number || currentMod.id} CONFIGURATION
                        </span>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191B35', margin: '4px 0 0 0' }}>
                          {currentMod.title}
                        </h4>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        backgroundColor: currentMod.status === 'COMING_SOON' ? '#FEF3C7' : '#DCFCE7',
                        color: currentMod.status === 'COMING_SOON' ? '#92400E' : '#166534'
                      }}>
                        {currentMod.status === 'COMING_SOON' ? 'Locked (Coming Soon)' : 'Published & Available'}
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const t = e.target.title.value;
                        const d = e.target.description.value;
                        const s = e.target.status.value;
                        const avail = e.target.is_available.checked;
                        handleSaveModule(currentMod.id, { title: t, description: d, status: s, is_available: avail });
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                    >
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#191B35', marginBottom: 6 }}>
                          Module Title:
                        </label>
                        <input
                          type="text"
                          name="title"
                          defaultValue={currentMod.title}
                          required
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#191B35', marginBottom: 6 }}>
                          Pedagogical Description:
                        </label>
                        <textarea
                          name="description"
                          defaultValue={currentMod.description}
                          rows={3}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#191B35', marginBottom: 6 }}>
                            Publication Status:
                          </label>
                          <select
                            name="status"
                            defaultValue={currentMod.status}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.88rem', backgroundColor: '#FFFFFF' }}
                          >
                            <option value="COMING_SOON">COMING_SOON (Locked badge on Learner Dashboard)</option>
                            <option value="IN_PROGRESS">IN_PROGRESS (Under active curriculum authoring)</option>
                            <option value="PUBLISHED">PUBLISHED (Fully unlocked for students)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#191B35', marginBottom: 6 }}>
                            Student Portal Availability:
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAF8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 650 }}>
                            <input
                              type="checkbox"
                              name="is_available"
                              defaultChecked={!!currentMod.is_available}
                            />
                            <span>Make module clickable on Learner Dashboard</span>
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                        <button
                          type="submit"
                          disabled={moduleSaving}
                          style={{
                            padding: '10px 24px',
                            borderRadius: 10,
                            backgroundColor: '#201B45',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.86rem',
                            fontWeight: 750,
                            cursor: moduleSaving ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <Save size={16} />
                          <span>{moduleSaving ? 'Saving Changes...' : 'Save Module Details in MySQL'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div>
              {/* Task / Stage Selection for Module 1 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
                    TASKS FOR MODULE 1 (THE HIDDEN ENGINE):
                  </span>
                  <span style={{ fontSize: '0.74rem', color: '#77728A' }}>
                    Select a task to edit all videos, descriptions, cards, and interactive exercises on this single page
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                  {stages.map((st) => {
                    const isSelected = st.stage_number === selectedStageNum;
                    const taskTitles = {
                      1: 'Task 1: Introduction & Objective Cards',
                      2: 'Task 2: Diagnostic Self-Audit & Recall Questions',
                      3: 'Task 3: Posture Anatomy, Breathing & Song Practice',
                      4: "Task 4: Fact or Myth Quiz & Learning Reflections",
                      5: 'Task 5: Practice Commitments & Certificate'
                    };
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStageNum(st.stage_number)}
                        style={{
                          padding: '9px 14px',
                          borderRadius: 10,
                          border: isSelected ? '2px solid #7C3AED' : '1px solid #EAE5F3',
                          backgroundColor: isSelected ? '#F4F0FF' : '#FFFFFF',
                          color: isSelected ? '#201B45' : '#77728A',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            backgroundColor: isSelected ? '#7C3AED' : '#EAE5F3',
                            color: isSelected ? '#FFFFFF' : '#77728A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}
                        >
                          {st.stage_number}
                        </span>
                        <span>{taskTitles[st.stage_number] || st.title || st.stage_title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

          {currentStage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Stage Metadata Card */}
              <div style={{ background: '#F9FBF9', border: '1px solid #DFEBE3', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
                      STAGE {currentStage.stage_number} DETAILS
                    </span>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#143137', margin: '2px 0 0 0' }}>
                      {currentStage.title || currentStage.stage_title}
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: '#77728A' }}>
                      Subtitle: {currentStage.subtitle || currentStage.stage_subtitle}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditStageModal(currentStage)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #7C3AED', backgroundColor: '#FFFFFF', color: '#15966A', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    <Edit2 size={13} /> Edit Title/Subtitle
                  </button>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#354E54', margin: 0 }}>
                  {currentStage.description || currentStage.stage_description}
                </p>
              </div>

              {/* Stage 1: Introduction Video Management (Full CRUD) */}
              {currentStage.stage_number === 1 && editingStage1Video && (
                <div style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 14,
                  padding: 20,
                  boxShadow: '0 2px 8px rgba(25, 27, 53, 0.03)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Video size={18} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                        Stage 01: Introduction Video &amp; Orientation Media (Full CRUD)
                      </h4>
                      <p style={{ fontSize: '0.80rem', color: '#77728A', margin: '2px 0 0 0' }}>
                        Manage the Stage 1 orientation video watched by students upon entering the breath curriculum.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Video Title
                      </label>
                      <input
                        type="text"
                        value={editingStage1Video.title}
                        onChange={(e) => setEditingStage1Video({ ...editingStage1Video, title: e.target.value })}
                        placeholder="Introduction to Breath Management"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                        Description / Student Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={editingStage1Video.description}
                        onChange={(e) => setEditingStage1Video({ ...editingStage1Video, description: e.target.value })}
                        placeholder="Watch this visual guide to understand how comfortable diaphragmatic breathing creates effortless vocal support..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <MediaUploadField
                        label="Stage 01 Video File / Stream URL"
                        value={editingStage1Video.content_url}
                        onChange={(url) => setEditingStage1Video({ ...editingStage1Video, content_url: url })}
                        mediaType="video"
                        description="Upload an MP4 or WebM video file, or supply a stream/storage URL."
                        placeholder="/IMG_7993.MP4"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      disabled={stage1VideoSaving}
                      onClick={handleSaveStage1Video}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '9px 18px',
                        borderRadius: 8,
                        backgroundColor: '#7C3AED',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 750,
                        fontSize: '0.84rem',
                        cursor: stage1VideoSaving ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                      }}
                    >
                      <Save size={15} />
                      <span>{stage1VideoSaving ? 'Saving Changes...' : 'Save Introduction Video'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 1: 3D Interactive Flip Card Objectives Management */}
              {currentStage.stage_number === 1 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                        Stage 01: 3D Flip Card Objectives ({currentStage.objectives?.length || 0})
                      </h4>
                      <p style={{ fontSize: '0.80rem', color: '#77728A', margin: '3px 0 0 0' }}>
                        Manage front-side titles, icons, and back-side learning descriptions live in MySQL.
                      </p>
                    </div>
                  </div>

                  {/* Objective Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 14, marginBottom: 20 }}>
                    {currentStage.objectives?.map(obj => {
                      const isEditing = editingObjective?.id === obj.id;
                      const line1 = obj.title_line_1 || obj.title?.split(' ')[0] || '';
                      const line2 = obj.title_line_2 || obj.title?.split(' ').slice(1).join(' ') || obj.title || '';

                      if (isEditing) {
                        return (
                          <div
                            key={obj.id}
                            style={{
                              background: '#FFFFFF',
                              border: '2px solid #7C3AED',
                              borderRadius: 14,
                              padding: 16,
                              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.12)'
                            }}
                          >
                            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#7C3AED', marginBottom: 10 }}>
                              Edit Objective Card #{obj.id}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                                    Front Line 1 (e.g. Maintain)
                                  </label>
                                  <input
                                    type="text"
                                    value={editingObjective.title_line_1 || ''}
                                    onChange={(e) => setEditingObjective({ ...editingObjective, title_line_1: e.target.value })}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                                    Front Line 2 (e.g. POSTURE)
                                  </label>
                                  <input
                                    type="text"
                                    value={editingObjective.title_line_2 || ''}
                                    onChange={(e) => setEditingObjective({ ...editingObjective, title_line_2: e.target.value })}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                                  Back Side Full Description
                                </label>
                                <textarea
                                  rows={3}
                                  value={editingObjective.description || ''}
                                  onChange={(e) => setEditingObjective({ ...editingObjective, description: e.target.value })}
                                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                                    Icon
                                  </label>
                                  <select
                                    value={editingObjective.icon || 'Lightbulb'}
                                    onChange={(e) => setEditingObjective({ ...editingObjective, icon: e.target.value })}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                  >
                                    <option value="Lightbulb">Lightbulb (Posture)</option>
                                    <option value="Wind">Wind (Breathing)</option>
                                    <option value="Megaphone">Megaphone (Vocal Techniques)</option>
                                    <option value="CalendarCheck">CalendarCheck (Practice Routine)</option>
                                    <option value="Music">Music (Performance)</option>
                                    <option value="Sparkles">Sparkles (Pillars)</option>
                                    <option value="Activity">Activity (Monitoring)</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                                    Order #
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={editingObjective.display_order || 1}
                                    onChange={(e) => setEditingObjective({ ...editingObjective, display_order: e.target.value })}
                                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                  />
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingObjective(null)}
                                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', color: '#475569', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 650 }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveEditObjective}
                                  style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#FFFFFF', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  Save Card
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={obj.id}
                          style={{
                            background: '#FFFFFF',
                            border: obj.is_active ? '1.5px solid #D6E4FF' : '1.5px dashed #CBD5E1',
                            borderRadius: 14,
                            padding: 16,
                            opacity: obj.is_active ? 1 : 0.65,
                            boxShadow: '0 2px 8px rgba(30, 58, 138, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 12
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563EB', background: '#EFF6FF', padding: '3px 8px', borderRadius: 6 }}>
                                CARD #{obj.display_order} · {obj.icon}
                              </span>
                              <span style={{ fontSize: '0.70rem', fontWeight: 700, color: obj.is_active ? '#059669' : '#64748B', background: obj.is_active ? '#ECFDF5' : '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                                {obj.is_active ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </div>
                            <div style={{ fontSize: '1.02rem', fontWeight: 850, color: '#1E3A8A' }}>
                              <span style={{ fontWeight: 600, color: '#475569', marginRight: 6 }}>{line1}</span>
                              {line2}
                            </div>
                            <p style={{ fontSize: '0.80rem', color: '#64748B', margin: '6px 0 0 0', lineHeight: 1.45 }}>
                              {obj.description}
                            </p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleObjectiveActive(obj)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'none',
                                border: 'none',
                                color: obj.is_active ? '#059669' : '#64748B',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title={obj.is_active ? 'Disable card' : 'Enable card'}
                            >
                              {obj.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                              <span>{obj.is_active ? 'Enabled' : 'Disabled'}</span>
                            </button>

                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => setEditingObjective({
                                  ...obj,
                                  title_line_1: line1,
                                  title_line_2: line2
                                })}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                <Edit2 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteObjective(obj.id)}
                                style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.74rem', cursor: 'pointer' }}
                                title="Delete card"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Objective Card Form */}
                  <div style={{ background: '#F8F7FC', border: '1.5px dashed #7C3AED', borderRadius: 16, padding: 18 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7C3AED', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={16} />
                      <span>Add New 3D Flip Objective Card</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                          Front Line 1 (e.g. Maintain)
                        </label>
                        <input
                          type="text"
                          placeholder="Maintain"
                          value={newObjective.title_line_1}
                          onChange={(e) => setNewObjective({ ...newObjective, title_line_1: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                          Front Line 2 (e.g. POSTURE)
                        </label>
                        <input
                          type="text"
                          placeholder="POSTURE"
                          value={newObjective.title_line_2}
                          onChange={(e) => setNewObjective({ ...newObjective, title_line_2: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                          Icon
                        </label>
                        <select
                          value={newObjective.icon}
                          onChange={(e) => setNewObjective({ ...newObjective, icon: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        >
                          <option value="Lightbulb">Lightbulb (Posture)</option>
                          <option value="Wind">Wind (Breathing)</option>
                          <option value="Megaphone">Megaphone (Vocal Techniques)</option>
                          <option value="CalendarCheck">CalendarCheck (Practice Routine)</option>
                          <option value="Music">Music (Performance)</option>
                          <option value="Sparkles">Sparkles (Pillars)</option>
                          <option value="Activity">Activity (Monitoring)</option>
                        </select>
                      </div>
                      <div />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 10, alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                          Back Side Description
                        </label>
                        <input
                          type="text"
                          placeholder="Demonstrate correct singing posture..."
                          value={newObjective.description}
                          onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddObjective}
                        style={{ padding: '9px 20px', borderRadius: 8, backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', fontWeight: 750, fontSize: '0.84rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Add Card
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 2: Knowledge Recall Questions */}
              {currentStage.stage_number === 2 && (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#143137', marginBottom: 12 }}>
                    Stage 02: Knowledge Recall Questions ({currentStage.recallQuestions?.length || 0})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                    {currentStage.recallQuestions?.map((q, idx) => {
                      const isEditing = editingQuestion?.id === q.id;
                      return (
                        <div key={q.id} style={{ background: '#FFFFFF', border: isEditing ? '1.5px solid #7C3AED' : '1px solid #DFEBE3', borderRadius: 12, padding: 14 }}>
                          {isEditing ? (
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7C3AED', marginBottom: 8 }}>
                                Edit Recall Question #{idx + 1}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 8 }}>
                                <input
                                  type="text"
                                  value={editingQuestion.question}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                                  placeholder="Recall Question..."
                                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                />
                                <input
                                  type="text"
                                  value={editingQuestion.instructions || ''}
                                  onChange={(e) => setEditingQuestion({ ...editingQuestion, instructions: e.target.value })}
                                  placeholder="Student instructions / tip..."
                                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingQuestion(null)}
                                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.75rem', fontWeight: 650, cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveQuestion}
                                  style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Save Question
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#143137' }}>
                                  {idx + 1}. {q.question}
                                </div>
                                {q.instructions && <div style={{ fontSize: '0.78rem', color: '#77728A', marginTop: 2 }}>Instructions: {q.instructions}</div>}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingQuestion({ ...q })}
                                  style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  title="Edit question"
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  title="Delete question"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Question Form */}
                  <div style={{ background: '#F4F0FF', border: '1px dashed #7C3AED', borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7C3AED', marginBottom: 10 }}>
                      + Add New Knowledge Recall Question
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Recall Question..."
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        style={{ padding: 8, borderRadius: 8, border: '1px solid #EAE5F3', fontSize: '0.85rem' }}
                      />
                      <input
                        type="text"
                        placeholder="Student instructions / tip..."
                        value={newQuestion.instructions}
                        onChange={(e) => setNewQuestion({ ...newQuestion, instructions: e.target.value })}
                        style={{ padding: 8, borderRadius: 8, border: '1px solid #EAE5F3', fontSize: '0.85rem' }}
                      />
                      <button
                        onClick={handleAddQuestion}
                        style={{ padding: '8px 16px', borderRadius: 8, backgroundColor: '#7C3AED', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 3: Tips & Songs */}
              {currentStage.stage_number === 3 && (
                <div>
                  {/* Stage 03 Part 01: Teaching Video Management (Full CRUD) */}
                  {editingStage3Video && (
                    <div style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: 14,
                      padding: 20,
                      marginBottom: 24,
                      boxShadow: '0 2px 8px rgba(25, 27, 53, 0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Video size={18} />
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                            Stage 03 · Part 1: Teaching Video Management (Full CRUD)
                          </h4>
                          <p style={{ fontSize: '0.80rem', color: '#77728A', margin: '2px 0 0 0' }}>
                            Manage the core instructional video for "How breathing works" in Stage 03.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
                        <div>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Video Title
                          </label>
                          <input
                            type="text"
                            value={editingStage3Video.title}
                            onChange={(e) => setEditingStage3Video({ ...editingStage3Video, title: e.target.value })}
                            placeholder="Part 1 • How breathing works"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Description / Instructions
                          </label>
                          <textarea
                            rows={2}
                            value={editingStage3Video.description}
                            onChange={(e) => setEditingStage3Video({ ...editingStage3Video, description: e.target.value })}
                            placeholder="Watch the full video before moving to the practice guide..."
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.86rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                          <MediaUploadField
                            label="Part 1 Teaching Video File / URL"
                            value={editingStage3Video.content_url}
                            onChange={(url) => setEditingStage3Video({ ...editingStage3Video, content_url: url })}
                            mediaType="video"
                            description="Upload an MP4 or WebM video file, or supply a stream/storage URL."
                            placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          type="button"
                          onClick={() => setShowStage3TranscriptQuickBox(prev => !prev)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 16px',
                            borderRadius: 8,
                            backgroundColor: showStage3TranscriptQuickBox ? '#EDE9FE' : '#FFFFFF',
                            color: '#6D28D9',
                            border: '1px solid #DDD6FE',
                            fontWeight: 750,
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          <FileText size={15} />
                          <span>{showStage3TranscriptQuickBox ? 'Hide Transcript Editor' : 'Manage Video Transcript'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={stage3VideoSaving}
                          onClick={handleSaveStage3Video}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '9px 18px',
                            borderRadius: 8,
                            backgroundColor: '#7C3AED',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 750,
                            fontSize: '0.84rem',
                            cursor: stage3VideoSaving ? 'wait' : 'pointer',
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          <Save size={15} />
                          <span>{stage3VideoSaving ? 'Saving Changes...' : 'Save Teaching Video'}</span>
                        </button>
                      </div>

                      {showStage3TranscriptQuickBox && (
                        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1.5px dashed #CBD5E1' }}>
                          <AdminTranscriptManager />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tips list */}
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#143137', marginBottom: 12 }}>
                    Stage 03: Breath Management Tips Cards ({currentStage.tips?.length || 0})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {currentStage.tips?.map(t => {
                      const isEditing = editingTip?.id === t.id;
                      return (
                        <div key={t.id} style={{ background: '#FFFFFF', border: isEditing ? '1.5px solid #7C3AED' : '1px solid #DFEBE3', borderRadius: 12, padding: 12 }}>
                          {isEditing ? (
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7C3AED', marginBottom: 6 }}>
                                Edit Breathing Tip
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                                <input
                                  type="text"
                                  value={editingTip.title}
                                  onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                                  placeholder="Tip title..."
                                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                />
                                <textarea
                                  rows={2}
                                  value={editingTip.description}
                                  onChange={(e) => setEditingTip({ ...editingTip, description: e.target.value })}
                                  placeholder="Tip description..."
                                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', fontFamily: 'inherit' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingTip(null)}
                                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.74rem', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveTip}
                                  style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#FFFFFF', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Save Tip
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 750, color: '#143137' }}>{t.title}</div>
                                <div style={{ fontSize: '0.78rem', color: '#77728A', marginTop: 2 }}>{t.description}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingTip({ ...t })}
                                  style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                  title="Edit tip"
                                >
                                  <Edit2 size={11} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTip(t.id)}
                                  style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                  title="Delete tip"
                                >
                                  <Trash2 size={11} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Songs list */}
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#143137', marginBottom: 12 }}>
                    Practice Songs ({currentStage.songs?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {currentStage.songs?.map(s => {
                      const isEditing = editingSongItem?.id === s.id;
                      return (
                        <div key={s.id} style={{ background: '#FFFFFF', border: isEditing ? '1.5px solid #7C3AED' : '1px solid #DFEBE3', borderRadius: 12, padding: 14 }}>
                          {isEditing ? (
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7C3AED', marginBottom: 8 }}>
                                Edit Practice Song #{s.id}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                <input
                                  type="text"
                                  value={editingSongItem.title}
                                  onChange={(e) => setEditingSongItem({ ...editingSongItem, title: e.target.value })}
                                  placeholder="Song Title"
                                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                />
                                <input
                                  type="text"
                                  value={editingSongItem.artist}
                                  onChange={(e) => setEditingSongItem({ ...editingSongItem, artist: e.target.value })}
                                  placeholder="Artist Name"
                                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                                />
                              </div>
                              <div style={{ marginBottom: 10 }}>
                                <MediaUploadField
                                  label="Song Audio / Track File"
                                  value={editingSongItem.media_url}
                                  onChange={(url) => setEditingSongItem({ ...editingSongItem, media_url: url })}
                                  mediaType="audio"
                                  description="Upload an audio file (MP3, WAV, M4A) or enter the path."
                                  placeholder="/audio/practice_song.mp3"
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingSongItem(null)}
                                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.75rem', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveSongItem}
                                  style={{ padding: '5px 14px', borderRadius: 6, border: 'none', background: '#7C3AED', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Save Song
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 750, color: '#143137' }}>{s.title} ({s.artist})</div>
                                <div style={{ fontSize: '0.78rem', color: '#77728A', marginTop: 2 }}>Audio Track: {s.media_url || 'None'}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingSongItem({ ...s })}
                                  style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  title="Edit song"
                                >
                                  <Edit2 size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSong(s.id)}
                                  style={{ padding: '5px 9px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  title="Delete song"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage 03 Part 02: Interactive Practice Management */}
                  <div style={{ marginTop: 32, padding: 22, background: '#F8FAFC', borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#168B7A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                          Part 02: Interactive Practice Management (Posture / Breathe / Song)
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: '#77728A', margin: '2px 0 0 0' }}>
                          Manage the 3D model posture viewer, 5 anatomical indicators, checklist points, and tab settings.
                        </p>
                      </div>
                    </div>

                    {/* Part 2 Info Form */}
                    <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#143137', margin: '0 0 12px 0' }}>
                        General Part 2 Header & 3D Model Asset
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Step Title
                          </label>
                          <input
                            type="text"
                            value={editingPart2.title}
                            onChange={(e) => setEditingPart2({ ...editingPart2, title: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={editingPart2.subtitle}
                            onChange={(e) => setEditingPart2({ ...editingPart2, subtitle: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <MediaUploadField
                            label="Interactive 3D Posture Model or Animation (.glb / .gltf / .mp4 / .gif)"
                            value={editingPart2.model_asset_url}
                            onChange={(url) => setEditingPart2({ ...editingPart2, model_asset_url: url })}
                            mediaType="model"
                            accept=".glb,.gltf,video/*,image/*,.gif"
                            description="Upload a 3D model asset or video/GIF loop demonstration."
                            placeholder="/models/posture_mannequin.glb"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSavePart2Info}
                        style={{ padding: '8px 18px', borderRadius: 8, background: '#168B7A', color: '#FFFFFF', border: 'none', fontWeight: 750, fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        Save Part 2 Info
                      </button>
                    </div>

                    {/* Posture Indicators (5 Anatomical Points) */}
                    <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#143137', margin: '0 0 12px 0' }}>
                        Anatomical Posture Indicators ({part2Data?.indicators?.length || 0})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {part2Data?.indicators?.map(ind => {
                          const isEditing = editingIndicator?.id === ind.id;
                          return (
                            <div key={ind.id} style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: isEditing ? '1.5px solid #168B7A' : '1px solid #E2E8F0' }}>
                              {isEditing ? (
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#168B7A', marginBottom: 6 }}>
                                    Edit Anatomical Indicator
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input
                                      type="text"
                                      value={editingIndicator.title}
                                      onChange={(e) => setEditingIndicator({ ...editingIndicator, title: e.target.value })}
                                      placeholder="Title..."
                                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                    />
                                    <input
                                      type="text"
                                      value={editingIndicator.description}
                                      onChange={(e) => setEditingIndicator({ ...editingIndicator, description: e.target.value })}
                                      placeholder="Technique explanation..."
                                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                    />
                                    <select
                                      value={editingIndicator.body_region}
                                      onChange={(e) => setEditingIndicator({ ...editingIndicator, body_region: e.target.value })}
                                      style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                    >
                                      <option value="head">head</option>
                                      <option value="shoulders">shoulders</option>
                                      <option value="ribs">ribs</option>
                                      <option value="knees">knees</option>
                                      <option value="feet">feet</option>
                                    </select>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingIndicator(null)}
                                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.74rem', cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveIndicator}
                                      style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#168B7A', color: '#FFFFFF', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Save Indicator
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 750, color: '#1E293B' }}>
                                      {ind.title} <span style={{ fontSize: '0.7rem', color: '#168B7A', background: '#E2F3EB', padding: '1px 6px', borderRadius: 4 }}>{ind.body_region}</span>
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>{ind.description}</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingIndicator({ ...ind })}
                                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                      title="Edit indicator"
                                    >
                                      <Edit2 size={11} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePostureIndicator(ind.id)}
                                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                      title="Delete indicator"
                                    >
                                      <Trash2 size={11} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Indicator Form */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr auto', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Title (e.g. Spine long)"
                          value={newIndicator.title}
                          onChange={(e) => setNewIndicator({ ...newIndicator, title: e.target.value })}
                          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                        />
                        <input
                          type="text"
                          placeholder="Technique explanation"
                          value={newIndicator.description}
                          onChange={(e) => setNewIndicator({ ...newIndicator, description: e.target.value })}
                          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                        />
                        <select
                          value={newIndicator.body_region}
                          onChange={(e) => setNewIndicator({ ...newIndicator, body_region: e.target.value })}
                          style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                        >
                          <option value="head">head</option>
                          <option value="shoulders">shoulders</option>
                          <option value="ribs">ribs</option>
                          <option value="knees">knees</option>
                          <option value="feet">feet</option>
                        </select>
                        <button
                          type="button"
                          onClick={handleAddPostureIndicator}
                          style={{ padding: '7px 14px', borderRadius: 6, background: '#168B7A', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          Add Indicator
                        </button>
                      </div>
                    </div>

                    {/* Posture Checklist Items */}
                    <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#143137', margin: '0 0 12px 0' }}>
                        Posture Checklist Items ({part2Data?.checklist?.length || 0})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {part2Data?.checklist?.map(item => {
                          const isEditing = editingChecklistItem?.id === item.id;
                          return (
                            <div key={item.id} style={{ padding: 10, background: '#F8FAFC', borderRadius: 8, border: isEditing ? '1.5px solid #168B7A' : '1px solid #E2E8F0' }}>
                              {isEditing ? (
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#168B7A', marginBottom: 6 }}>
                                    Edit Checklist Point
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                    <input
                                      type="text"
                                      value={editingChecklistItem.item_text}
                                      onChange={(e) => setEditingChecklistItem({ ...editingChecklistItem, item_text: e.target.value })}
                                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingChecklistItem(null)}
                                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: '0.74rem', cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveChecklistItem}
                                      style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#168B7A', color: '#FFFFFF', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Save Point
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <CheckCircle2 size={15} color="#168B7A" />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{item.item_text}</span>
                                    {item.is_required && (
                                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '1px 5px', borderRadius: 4 }}>
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingChecklistItem({ ...item })}
                                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                      title="Edit point"
                                    >
                                      <Edit2 size={11} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePostureChecklistItem(item.id)}
                                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                      title="Delete point"
                                    >
                                      <Trash2 size={11} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Checklist Item Form */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Checklist point text..."
                          value={newChecklistItem.item_text}
                          onChange={(e) => setNewChecklistItem({ ...newChecklistItem, item_text: e.target.value })}
                          style={{ flex: 1, padding: '7px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                        />
                        <button
                          type="button"
                          onClick={handleAddPostureChecklistItem}
                          style={{ padding: '7px 14px', borderRadius: 6, background: '#168B7A', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                        >
                          Add Point
                        </button>
                      </div>
                    </div>

                    {/* Breathing Level Timing Configuration (Step 2: Breathe) */}
                    <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0', marginTop: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Wind size={18} color="#0D9488" />
                        <h5 style={{ fontSize: '0.96rem', fontWeight: 750, color: '#143137', margin: 0 }}>
                          Step 2: Breathe – Pacing & Duration Configuration ({breathingLevels.length} Levels)
                        </h5>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 14px 0' }}>
                        Configure the exact Inhale, Hold, and Exhale timing parameters for Beginner, Intermediate, and Advanced practice levels.
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                        {breathingLevels.map((lvl) => (
                          <div
                            key={lvl.level_key}
                            style={{
                              border: '1px solid #CBD5E1',
                              borderRadius: 10,
                              padding: 14,
                              background: '#F8FAFC',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.90rem', fontWeight: 800, color: '#0F766E' }}>
                                {lvl.level_name} Level
                              </span>
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#E2F3EB', color: '#0F766E', padding: '2px 7px', borderRadius: 4 }}>
                                {lvl.daily_practice_duration}
                              </span>
                            </div>

                            {/* Inputs for Inhale, Hold, Exhale, Daily Duration */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: '0.74rem' }}>
                              <div>
                                <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: 2 }}>Inhale (s)</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  defaultValue={lvl.inhale_duration}
                                  id={`admin-inhale-${lvl.level_key}`}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                                />
                                <span style={{ fontSize: '0.64rem', color: '#94A3B8' }}>{lvl.level_key === 'advanced' ? '0.5–1s' : `${lvl.inhale_duration}s`}</span>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: 2 }}>Hold (s)</label>
                                <input
                                  type="number"
                                  step="1"
                                  defaultValue={lvl.hold_duration}
                                  id={`admin-hold-${lvl.level_key}`}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                                />
                                <span style={{ fontSize: '0.64rem', color: '#94A3B8' }}>{lvl.level_key === 'beginner' ? '2–4s' : lvl.level_key === 'advanced' ? '0s' : '2s'}</span>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontWeight: 700, color: '#475569', marginBottom: 2 }}>Exhale (s)</label>
                                <input
                                  type="number"
                                  step="1"
                                  defaultValue={lvl.exhale_duration}
                                  id={`admin-exhale-${lvl.level_key}`}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                                />
                                <span style={{ fontSize: '0.64rem', color: '#94A3B8' }}>{lvl.level_key === 'beginner' ? '8–12s' : lvl.level_key === 'intermediate' ? '15–25s' : '30+s'}</span>
                              </div>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 2 }}>Daily Practice Duration</label>
                              <input
                                type="text"
                                defaultValue={lvl.daily_practice_duration}
                                id={`admin-daily-${lvl.level_key}`}
                                style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const inhale = parseFloat(document.getElementById(`admin-inhale-${lvl.level_key}`).value);
                                const hold = parseFloat(document.getElementById(`admin-hold-${lvl.level_key}`).value);
                                const exhale = parseFloat(document.getElementById(`admin-exhale-${lvl.level_key}`).value);
                                const daily = document.getElementById(`admin-daily-${lvl.level_key}`).value;
                                handleUpdateBreathingLevel(lvl.level_key, {
                                  inhale_duration: inhale,
                                  hold_duration: hold,
                                  exhale_duration: exhale,
                                  daily_practice_duration: daily
                                });
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: 6,
                                background: '#0D9488',
                                color: '#FFFFFF',
                                border: 'none',
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                marginTop: 4
                              }}
                            >
                              Save {lvl.level_name} Timings
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ========================================================= */}
                    {/* Step 3: Sing it – Song Practice Management ("Snowman") */}
                    {/* ========================================================= */}
                    <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', marginTop: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                            <Music size={18} />
                          </div>
                          <div>
                            <h5 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                              Step 3: Sing it – Song Practice Management ("Snowman")
                            </h5>
                            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0' }}>
                              Configure authorised audio guide, level score sheets, orange breathing markers, loop controls, and view student progress.
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#E2F3EB', color: '#0F766E', padding: '3px 10px', borderRadius: 9999 }}>
                          Connected to MySQL
                        </span>
                      </div>

                      {/* Section 1: Song Metadata & Audio Guide File */}
                      <div style={{ background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                        <h6 style={{ fontSize: '0.86rem', fontWeight: 750, color: '#1E293B', margin: '0 0 10px 0' }}>
                          Song Metadata & Authorised Audio Guide
                        </h6>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>Song Title</label>
                            <input
                              type="text"
                              value={editingSong.song_title}
                              onChange={(e) => setEditingSong({ ...editingSong, song_title: e.target.value })}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>Artist / Vocalist</label>
                            <input
                              type="text"
                              value={editingSong.artist_name}
                              onChange={(e) => setEditingSong({ ...editingSong, artist_name: e.target.value })}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>Audio Card Subtitle</label>
                            <input
                              type="text"
                              value={editingSong.subtitle}
                              onChange={(e) => setEditingSong({ ...editingSong, subtitle: e.target.value })}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>

                        {/* Learning Instructions */}
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                            Student Learning Instructions
                          </label>
                          <textarea
                            rows={3}
                            value={editingSong.instructions}
                            onChange={(e) => setEditingSong({ ...editingSong, instructions: e.target.value })}
                            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                          />
                        </div>

                        {/* Audio Guide File & Loop Controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                              Authorised Audio Guide URL / Path
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                value={editingSong.audio_file}
                                onChange={(e) => setEditingSong({ ...editingSong, audio_file: e.target.value })}
                                style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.8rem' }}
                              />
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: '#0D9488',
                                  color: '#FFFFFF',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: songAudioUploading ? 'not-allowed' : 'pointer'
                                }}
                              >
                                <Upload size={13} />
                                <span>{songAudioUploading ? 'Uploading...' : 'Upload WAV/MP3'}</span>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  disabled={songAudioUploading}
                                  onChange={handleUploadSongAudio}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: 3 }}>
                              Loop & Repeat Controls
                            </label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontSize: '0.74rem', color: '#475569' }}>Default Loops:</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  value={editingSong.default_repeat_count}
                                  onChange={(e) => setEditingSong({ ...editingSong, default_repeat_count: parseInt(e.target.value, 10) || 1 })}
                                  style={{ width: 45, padding: '4px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: '0.78rem' }}
                                />
                              </div>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.74rem', color: '#1E293B', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={editingSong.continuous_loop_enabled}
                                  onChange={(e) => setEditingSong({ ...editingSong, continuous_loop_enabled: e.target.checked })}
                                />
                                Continuous Loop (∞)
                              </label>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveSongPracticeMetadata}
                          style={{
                            padding: '7px 16px',
                            borderRadius: 6,
                            background: '#168B7A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Save Song Practice Settings
                        </button>
                      </div>

                      {/* Section 2: Difficulty Levels & Musical Score Sheets (Full CRUD) */}
                      <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <h6 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#1E293B', margin: 0 }}>
                              Difficulty Levels &amp; Musical Score Sheets
                            </h6>
                            <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0 0' }}>
                              Select a level (Beginner, Intermediate, Advanced) to upload and manage its sheet music score image.
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {['beginner', 'intermediate', 'advanced'].map((lvlKey) => (
                              <button
                                key={lvlKey}
                                type="button"
                                onClick={() => setSelectedAdminSongLevelKey(lvlKey)}
                                style={{
                                  padding: '5px 14px',
                                  borderRadius: 9999,
                                  fontSize: '0.78rem',
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  border: selectedAdminSongLevelKey === lvlKey ? 'none' : '1px solid #CBD5E1',
                                  background: selectedAdminSongLevelKey === lvlKey ? '#168B7A' : '#FFFFFF',
                                  color: selectedAdminSongLevelKey === lvlKey ? '#FFFFFF' : '#475569',
                                  boxShadow: selectedAdminSongLevelKey === lvlKey ? '0 2px 6px rgba(22, 139, 122, 0.3)' : 'none'
                                }}
                              >
                                {lvlKey.charAt(0).toUpperCase() + lvlKey.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Selected Level Score Sheet CRUD */}
                        {(() => {
                          const activeLevel = songPracticeData?.levels?.find(l => l.level_key === selectedAdminSongLevelKey) || {
                            id: selectedAdminSongLevelKey === 'beginner' ? 1 : selectedAdminSongLevelKey === 'intermediate' ? 2 : 3,
                            level_name: selectedAdminSongLevelKey.charAt(0).toUpperCase() + selectedAdminSongLevelKey.slice(1),
                            level_key: selectedAdminSongLevelKey,
                            total_notes: selectedAdminSongLevelKey === 'beginner' ? 12 : selectedAdminSongLevelKey === 'intermediate' ? 16 : 20,
                            score_file: selectedAdminSongLevelKey === 'beginner' ? '/1 break.png' : ''
                          };

                          const currentScoreFile = levelScoreInputs[activeLevel.id]?.score_file !== undefined
                            ? levelScoreInputs[activeLevel.id].score_file
                            : (activeLevel.score_file || (activeLevel.level_key === 'beginner' ? '/1 break.png' : ''));

                          return (
                            <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E2E8F0', padding: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#0F766E' }}>
                                    {activeLevel.level_name} Level Sheet Music
                                  </span>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}>
                                    Active Practice Level
                                  </span>
                                </div>
                              </div>

                              {/* Media Upload & Preview Field */}
                              <div style={{ marginBottom: 14 }}>
                                <MediaUploadField
                                  label={`${activeLevel.level_name} Score Sheet Image`}
                                  value={currentScoreFile}
                                  onChange={(url) => setLevelScoreInputs(prev => ({
                                    ...prev,
                                    [activeLevel.id]: {
                                      ...(prev[activeLevel.id] || {}),
                                      score_file: url
                                    }
                                  }))}
                                  mediaType="image"
                                  accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg"
                                  description={`Upload or specify the sheet music score image for ${activeLevel.level_name} vocalists.`}
                                  placeholder={activeLevel.level_key === 'beginner' ? '/1 break.png' : '/uploads/cms/score.png'}
                                />
                              </div>

                              {/* Save Level Score Sheet Button */}
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  type="button"
                                  disabled={scoreUploading}
                                  onClick={() => handleSaveLevelScore(activeLevel.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '8px 20px',
                                    borderRadius: 8,
                                    background: '#0D9488',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    fontSize: '0.82rem',
                                    fontWeight: 750,
                                    cursor: scoreUploading ? 'wait' : 'pointer',
                                    boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)'
                                  }}
                                >
                                  <Save size={14} />
                                  <span>{scoreUploading ? 'Saving...' : `Save ${activeLevel.level_name} Score Sheet`}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Section 3: Student Song Practice Records & Completion Tracking */}
                      <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                          <div>
                            <h6 style={{ fontSize: '0.90rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                              Student Song Practice Records ({songStudents.length} Students)
                            </h6>
                            <p style={{ fontSize: '0.74rem', color: '#64748B', margin: '2px 0 0 0' }}>
                              Track note-marking completion rates, repeat loops, and practice session history stored in MySQL.
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={handleExportSongStudentsCSV}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 12px',
                                borderRadius: 6,
                                background: '#F1F5F9',
                                border: '1px solid #CBD5E1',
                                color: '#334155',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Download size={13} />
                              Export CSV
                            </button>
                            <button
                              type="button"
                              onClick={loadPart2Data}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 12px',
                                borderRadius: 6,
                                background: '#E2F3EB',
                                border: 'none',
                                color: '#0F766E',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <RefreshCw size={13} />
                              Refresh
                            </button>
                          </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                            <thead>
                              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#475569' }}>
                                <th style={{ padding: '8px 10px' }}>Student</th>
                                <th style={{ padding: '8px 10px' }}>Beginner Progress</th>
                                <th style={{ padding: '8px 10px' }}>Intermediate Progress</th>
                                <th style={{ padding: '8px 10px' }}>Advanced Progress</th>
                                <th style={{ padding: '8px 10px' }}>Max Loops</th>
                                <th style={{ padding: '8px 10px' }}>Sessions</th>
                                <th style={{ padding: '8px 10px' }}>Last Activity</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {songStudents.length > 0 ? (
                                songStudents.map((s) => (
                                  <tr key={s.user_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '8px 10px' }}>
                                      <div style={{ fontWeight: 750, color: '#1E293B' }}>{s.username}</div>
                                      <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{s.email}</div>
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                      <span style={{
                                        padding: '2px 7px',
                                        borderRadius: 4,
                                        fontSize: '0.70rem',
                                        fontWeight: 700,
                                        background: s.beginner_status === 'COMPLETED' ? '#DCFCE7' : s.beginner_marked > 0 ? '#FEF3C7' : '#F1F5F9',
                                        color: s.beginner_status === 'COMPLETED' ? '#15803D' : s.beginner_marked > 0 ? '#B45309' : '#64748B'
                                      }}>
                                        {s.beginner_marked} / {s.beginner_total} notes ({s.beginner_status})
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                      <span style={{
                                        padding: '2px 7px',
                                        borderRadius: 4,
                                        fontSize: '0.70rem',
                                        fontWeight: 700,
                                        background: s.intermediate_status === 'COMPLETED' ? '#DCFCE7' : s.intermediate_marked > 0 ? '#FEF3C7' : '#F1F5F9',
                                        color: s.intermediate_status === 'COMPLETED' ? '#15803D' : s.intermediate_marked > 0 ? '#B45309' : '#64748B'
                                      }}>
                                        {s.intermediate_marked} / {s.intermediate_total} notes ({s.intermediate_status})
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px 10px' }}>
                                      <span style={{
                                        padding: '2px 7px',
                                        borderRadius: 4,
                                        fontSize: '0.70rem',
                                        fontWeight: 700,
                                        background: s.advanced_status === 'COMPLETED' ? '#DCFCE7' : s.advanced_marked > 0 ? '#FEF3C7' : '#F1F5F9',
                                        color: s.advanced_status === 'COMPLETED' ? '#15803D' : s.advanced_marked > 0 ? '#B45309' : '#64748B'
                                      }}>
                                        {s.advanced_marked} / {s.advanced_total} notes ({s.advanced_status})
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>{s.max_repeat || 1}x</td>
                                    <td style={{ padding: '8px 10px', fontWeight: 650 }}>{s.total_sessions || 0}</td>
                                    <td style={{ padding: '8px 10px', color: '#64748B', fontSize: '0.72rem' }}>
                                      {s.last_practice_date ? new Date(s.last_practice_date).toLocaleDateString() : '—'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                      <button
                                        type="button"
                                        onClick={() => handleResetStudentSong(s.user_id, s.username)}
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: 4,
                                          border: '1px solid #FECACA',
                                          background: '#FEF2F2',
                                          color: '#DC2626',
                                          fontSize: '0.70rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Reset
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>
                                    No student song practice records found yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 4: Interactive Challenges */}
              {currentStage.stage_number === 4 && (
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#143137', marginBottom: 12 }}>
                    Stage 04: Interactive Challenges ({(currentStage.challenges || []).filter(c => c.challenge_type !== 'matching_pairs').length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                    {(currentStage.challenges || []).filter(c => c.challenge_type !== 'matching_pairs').map(ch => {
                      const isEditing = editingChallenge?.id === ch.id;
                      return (
                        <div key={ch.id} style={{ background: '#FFFFFF', border: isEditing ? '1.5px solid #7C3AED' : '1px solid #DFEBE3', borderRadius: 12, padding: 16 }}>
                          {isEditing ? (
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7C3AED', marginBottom: 8 }}>
                                Edit Interactive Challenge
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>Title</label>
                                <input
                                  type="text"
                                  value={editingChallenge.title}
                                  onChange={(e) => setEditingChallenge({ ...editingChallenge, title: e.target.value })}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                />
                              </div>
                              <div style={{ marginBottom: 10 }}>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 3 }}>Description</label>
                                <textarea
                                  rows={2}
                                  value={editingChallenge.description}
                                  onChange={(e) => setEditingChallenge({ ...editingChallenge, description: e.target.value })}
                                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  onClick={handleSaveChallenge}
                                  style={{ padding: '5px 12px', borderRadius: 6, background: '#7C3AED', color: '#FFFFFF', border: 'none', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Save Changes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingChallenge(null)}
                                  style={{ padding: '5px 10px', borderRadius: 6, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontSize: '0.76rem', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
                                  {ch.challenge_type}
                                </span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => setEditingChallenge({ ...ch })}
                                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#7C3AED', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChallenge(ch.id)}
                                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 4, padding: '3px 7px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 700 }}
                                  >
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              </div>
                              <h5 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#143137', margin: 0, marginBottom: 4 }}>
                                {ch.title}
                              </h5>
                              <p style={{ fontSize: '0.8rem', color: '#77728A', margin: '0 0 10px 0' }}>{ch.description}</p>
                              <div style={{ fontSize: '0.75rem', color: '#77728A' }}>
                                Marks: {ch.total_marks} | Passing: {ch.passing_score}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage 04 Myth or Fact Management */}
                  <div style={{ marginTop: 24, background: '#FFFFFF', border: '1px solid #DFEBE3', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                          Breathe Right: Fact or Myth? Question & Quiz Management
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                          Manage the 6 questions, statements, correct answers, explanations, and review student quiz attempts.
                        </p>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}>
                        {mfQuestions.length} Questions Configured
                      </span>
                    </div>

                    {/* Add New Question Form */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 750, color: '#1E293B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Plus size={16} color="#0F766E" />
                        Add New Question
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 10 }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Statement / Question Text
                          </label>
                          <input
                            type="text"
                            value={newMfQuestion.statement}
                            onChange={(e) => setNewMfQuestion({ ...newMfQuestion, statement: e.target.value })}
                            placeholder="e.g. The more air I take in, the longer I can hold a note."
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Correct Answer
                          </label>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setNewMfQuestion({ ...newMfQuestion, correct_answer: 'MYTH' })}
                              style={{
                                flex: 1,
                                padding: '7px 10px',
                                borderRadius: 6,
                                border: newMfQuestion.correct_answer === 'MYTH' ? '2px solid #E11D48' : '1px solid #CBD5E1',
                                background: newMfQuestion.correct_answer === 'MYTH' ? '#FFE4E6' : '#FFFFFF',
                                color: newMfQuestion.correct_answer === 'MYTH' ? '#BE123C' : '#64748B',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              MYTH
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewMfQuestion({ ...newMfQuestion, correct_answer: 'FACT' })}
                              style={{
                                flex: 1,
                                padding: '7px 10px',
                                borderRadius: 6,
                                border: newMfQuestion.correct_answer === 'FACT' ? '2px solid #0D9488' : '1px solid #CBD5E1',
                                background: newMfQuestion.correct_answer === 'FACT' ? '#CCFBF1' : '#FFFFFF',
                                color: newMfQuestion.correct_answer === 'FACT' ? '#0F766E' : '#64748B',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                              }}
                            >
                              FACT
                            </button>
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                            Display Order
                          </label>
                          <input
                            type="number"
                            value={newMfQuestion.display_order}
                            onChange={(e) => setNewMfQuestion({ ...newMfQuestion, display_order: parseInt(e.target.value) || 1 })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                          Explanation (Why?)
                        </label>
                        <textarea
                          rows={2}
                          value={newMfQuestion.explanation}
                          onChange={(e) => setNewMfQuestion({ ...newMfQuestion, explanation: e.target.value })}
                          placeholder="e.g. Why? Taking in too much air can create tension. What matters is controlling airflow, not simply filling your lungs to maximum capacity."
                          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMfQuestion}
                        style={{
                          background: '#0D9488',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          padding: '8px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Plus size={15} />
                        Add Question
                      </button>
                    </div>

                    {/* Questions Table / List */}
                    <div style={{ marginBottom: 24, overflowX: 'auto' }}>
                      <h5 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#1E293B', marginBottom: 10 }}>
                        Current Quiz Questions ({mfQuestions.length})
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {mfQuestions.map((q, index) => {
                          const isEditing = editingMfQuestion?.id === q.id;
                          return (
                            <div
                              key={q.id || index}
                              style={{
                                background: isEditing ? '#F0FDFA' : '#FFFFFF',
                                border: isEditing ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                                borderRadius: 10,
                                padding: 14,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isEditing ? (
                                <div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 8 }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>
                                        Statement
                                      </label>
                                      <input
                                        type="text"
                                        value={editingMfQuestion.statement}
                                        onChange={(e) => setEditingMfQuestion({ ...editingMfQuestion, statement: e.target.value })}
                                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>
                                        Correct Answer
                                      </label>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button
                                          type="button"
                                          onClick={() => setEditingMfQuestion({ ...editingMfQuestion, correct_answer: 'MYTH' })}
                                          style={{
                                            flex: 1,
                                            padding: '5px 8px',
                                            borderRadius: 6,
                                            border: editingMfQuestion.correct_answer === 'MYTH' ? '2px solid #E11D48' : '1px solid #CBD5E1',
                                            background: editingMfQuestion.correct_answer === 'MYTH' ? '#FFE4E6' : '#FFFFFF',
                                            color: editingMfQuestion.correct_answer === 'MYTH' ? '#BE123C' : '#64748B',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          MYTH
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingMfQuestion({ ...editingMfQuestion, correct_answer: 'FACT' })}
                                          style={{
                                            flex: 1,
                                            padding: '5px 8px',
                                            borderRadius: 6,
                                            border: editingMfQuestion.correct_answer === 'FACT' ? '2px solid #0D9488' : '1px solid #CBD5E1',
                                            background: editingMfQuestion.correct_answer === 'FACT' ? '#CCFBF1' : '#FFFFFF',
                                            color: editingMfQuestion.correct_answer === 'FACT' ? '#0F766E' : '#64748B',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          FACT
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>
                                        Order
                                      </label>
                                      <input
                                        type="number"
                                        value={editingMfQuestion.display_order}
                                        onChange={(e) => setEditingMfQuestion({ ...editingMfQuestion, display_order: parseInt(e.target.value) || 1 })}
                                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                                      />
                                    </div>
                                  </div>
                                  <div style={{ marginBottom: 10 }}>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>
                                      Explanation
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={editingMfQuestion.explanation}
                                      onChange={(e) => setEditingMfQuestion({ ...editingMfQuestion, explanation: e.target.value })}
                                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMfQuestion(null)}
                                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveMfQuestion(q.id, editingMfQuestion)}
                                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#0D9488', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                    >
                                      <Save size={13} />
                                      Save Changes
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', color: '#475569', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                                      #{q.display_order || index + 1}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span style={{
                                          padding: '2px 8px',
                                          borderRadius: 4,
                                          fontSize: '0.70rem',
                                          fontWeight: 800,
                                          background: q.correct_answer === 'MYTH' ? '#FFE4E6' : '#CCFBF1',
                                          color: q.correct_answer === 'MYTH' ? '#E11D48' : '#0F766E'
                                        }}>
                                          {q.correct_answer}
                                        </span>
                                        <span style={{ fontSize: '0.88rem', fontWeight: 750, color: '#1E293B' }}>
                                          "{q.statement}"
                                        </span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>
                                        {q.explanation}
                                      </p>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMfQuestion({ ...q })}
                                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F766E', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Edit2 size={12} />
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMfQuestion(q.id)}
                                      style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <Trash2 size={12} />
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Student Performance & Quiz Records */}
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: 750, color: '#1E293B', margin: 0 }}>
                            Student Quiz Performance — Breathe Right: Fact or Myth?
                          </h5>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {mfStudents.length} Students have attempted this challenge
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportMfCSV}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#1E293B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Download size={13} />
                          Export CSV
                        </button>
                      </div>

                      <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                          <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                            <tr>
                              <th style={{ padding: '8px 10px' }}>Student</th>
                              <th style={{ padding: '8px 10px' }}>Attempts</th>
                              <th style={{ padding: '8px 10px' }}>Best Score</th>
                              <th style={{ padding: '8px 10px' }}>Latest Score</th>
                              <th style={{ padding: '8px 10px' }}>Correct / Incorrect</th>
                              <th style={{ padding: '8px 10px' }}>Last Attempt</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mfStudents && mfStudents.length > 0 ? (
                              mfStudents.map((s) => (
                                <tr key={s.user_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                  <td style={{ padding: '8px 10px' }}>
                                    <div style={{ fontWeight: 750, color: '#1E293B' }}>{s.username || `User #${s.user_id}`}</div>
                                    <div style={{ fontSize: '0.70rem', color: '#64748B' }}>{s.email}</div>
                                  </td>
                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#475569' }}>
                                    {s.total_attempts || 0}
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <span style={{
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      fontSize: '0.72rem',
                                      fontWeight: 800,
                                      background: s.best_score >= 50 ? '#DCFCE7' : s.best_score >= 30 ? '#FEF3C7' : '#FEE2E2',
                                      color: s.best_score >= 50 ? '#15803D' : s.best_score >= 30 ? '#B45309' : '#B91C1C'
                                    }}>
                                      {s.best_score || 0} / 60 ({s.best_percentage || 0}%)
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <span style={{
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      background: '#F1F5F9',
                                      color: '#334155'
                                    }}>
                                      {s.latest_score || 0} / 60 ({s.latest_percentage || 0}%)
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#475569' }}>
                                    <span style={{ color: '#0F766E', fontWeight: 700 }}>{s.correct_answers || 0}</span> / <span style={{ color: '#E11D48', fontWeight: 700 }}>{s.incorrect_answers || 0}</span>
                                  </td>
                                  <td style={{ padding: '8px 10px', color: '#64748B', fontSize: '0.72rem' }}>
                                    {s.last_attempt_date ? new Date(s.last_attempt_date).toLocaleDateString() : '—'}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleResetMfStudent(s.user_id, s.username)}
                                      style={{
                                        padding: '3px 8px',
                                        borderRadius: 4,
                                        border: '1px solid #FECACA',
                                        background: '#FEF2F2',
                                        color: '#DC2626',
                                        fontSize: '0.70rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Reset
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>
                                  No student Myth or Fact quiz records found yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Stage 04: Learning Reflection Pinboard Submissions */}
                  <div style={{ marginTop: 24, background: '#FFFFFF', border: '1px solid #DFEBE3', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#143137', margin: 0 }}>
                          Student Learning Reflections Pinboard (What Have You Learned?)
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0 0' }}>
                          Review student personal reflection sticky notes (What I Know, What I Want, What I Have Learned).
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#F0FDFA', color: '#0F766E', border: '1px solid #CCFBF1' }}>
                          {reflectionList.length} Reflections Submitted
                        </span>
                        <button
                          type="button"
                          onClick={handleExportReflectionsCSV}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#1E293B',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Download size={13} />
                          Export CSV
                        </button>
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem', textAlign: 'left' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
                          <tr>
                            <th style={{ padding: '8px 10px' }}>Student</th>
                            <th style={{ padding: '8px 10px' }}>What I Know</th>
                            <th style={{ padding: '8px 10px' }}>What I Want</th>
                            <th style={{ padding: '8px 10px' }}>What I Have Learned</th>
                            <th style={{ padding: '8px 10px' }}>Submitted / Updated</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reflectionList && reflectionList.length > 0 ? (
                            reflectionList.map((ref) => (
                              <tr key={ref.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '8px 10px', verticalAlign: 'top', minWidth: 140 }}>
                                  <div style={{ fontWeight: 750, color: '#1E293B' }}>{ref.username || `User #${ref.user_id}`}</div>
                                  <div style={{ fontSize: '0.70rem', color: '#64748B' }}>{ref.email}</div>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' }}>
                                    {ref.status || 'COMPLETED'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 10px', verticalAlign: 'top', maxWidth: 220 }}>
                                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '6px 8px', fontSize: '0.74rem', color: '#064E3B', lineHeight: 1.4 }}>
                                    {ref.question_1_answer}
                                  </div>
                                </td>
                                <td style={{ padding: '8px 10px', verticalAlign: 'top', maxWidth: 220 }}>
                                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, padding: '6px 8px', fontSize: '0.74rem', color: '#7C2D12', lineHeight: 1.4 }}>
                                    {ref.question_2_answer}
                                  </div>
                                </td>
                                <td style={{ padding: '8px 10px', verticalAlign: 'top', maxWidth: 220 }}>
                                  <div style={{ background: '#FAF5FF', border: '1px solid #DDD6FE', borderRadius: 6, padding: '6px 8px', fontSize: '0.74rem', color: '#4C1D95', lineHeight: 1.4 }}>
                                    {ref.question_3_answer}
                                  </div>
                                </td>
                                <td style={{ padding: '8px 10px', verticalAlign: 'top', color: '#64748B', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                  {ref.updated_at ? new Date(ref.updated_at).toLocaleDateString() : ref.submitted_at ? new Date(ref.submitted_at).toLocaleDateString() : '—'}
                                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>v{ref.version_count || 1}</div>
                                </td>
                                <td style={{ padding: '8px 10px', verticalAlign: 'top', textAlign: 'right' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleResetReflection(ref.user_id, ref.username)}
                                    style={{
                                      padding: '3px 8px',
                                      borderRadius: 4,
                                      border: '1px solid #FECACA',
                                      background: '#FEF2F2',
                                      color: '#DC2626',
                                      fontSize: '0.70rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reset
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#94A3B8' }}>
                                No student learning reflection submissions recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Stage Title/Subtitle Modal */}
          {editStageModal && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#143137', marginBottom: 14 }}>
                  Edit Stage {editStageModal.stage_number}
                </h4>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#143137', display: 'block', marginBottom: 4 }}>
                    Stage Title
                  </label>
                  <input
                    type="text"
                    defaultValue={editStageModal.title || editStageModal.stage_title}
                    id="edit-st-title"
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #EAE5F3', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#143137', display: 'block', marginBottom: 4 }}>
                    Subtitle
                  </label>
                  <input
                    type="text"
                    defaultValue={editStageModal.subtitle || editStageModal.stage_subtitle}
                    id="edit-st-subtitle"
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #EAE5F3', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#143137', display: 'block', marginBottom: 4 }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    defaultValue={editStageModal.description || editStageModal.stage_description}
                    id="edit-st-desc"
                    style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #EAE5F3', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    onClick={() => setEditStageModal(null)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #EAE5F3', background: '#FFFFFF', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const t = document.getElementById('edit-st-title').value;
                      const s = document.getElementById('edit-st-subtitle').value;
                      const d = document.getElementById('edit-st-desc').value;
                      handleSaveStageInfo(editStageModal.id, { title: t, subtitle: s, description: d });
                      setEditStageModal(null);
                    }}
                    style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#7C3AED', color: '#FFFFFF', fontWeight: 750, cursor: 'pointer' }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </div>
    )}
  </div>
);
}
