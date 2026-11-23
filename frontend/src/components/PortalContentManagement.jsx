import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Globe,
  Layers,
  BookOpen,
  Film,
  Image as ImageIcon,
  Music,
  Target,
  FileText,
  Activity,
  HelpCircle,
  Database,
  FileSpreadsheet,
  Wind,
  Lightbulb,
  MessageSquare,
  Calendar,
  Flame,
  Award,
  Sliders,
  FolderOpen,
  History,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Check,
  X,
  Search,
  Filter,
  ArrowUpRight,
  RotateCcw,
  Sparkles,
  Volume2,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Save,
  Eye,
  RefreshCw
} from 'lucide-react';

export default function PortalContentManagement({ subTab = 'dashboard', onNavigateSubTab, isSuperAdmin = false }) {
  // Global CMS state
  const [activeSubTab, setActiveSubTab] = useState(subTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard metrics state
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Sections (Homepage, Certificate, etc.)
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    page_slug: 'homepage',
    section_key: '',
    section_title: '',
    headline: '',
    subheadline: '',
    body_content: '',
    cta_button_text: '',
    cta_button_url: '',
    media_url: '',
    status: 'PUBLISHED',
    display_order: 1
  });

  // Media Library state
  const [mediaList, setMediaList] = useState([]);
  const [mediaFilterType, setMediaFilterType] = useState('ALL');
  const [mediaSearch, setMediaSearch] = useState('');
  const [selectedMediaForPreview, setSelectedMediaForPreview] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Modules & Stages state
  const [modules, setModules] = useState([]);
  const [editingModule, setEditingModule] = useState(null);
  const [stages, setStages] = useState([]);
  const [editingStage, setEditingStage] = useState(null);

  // Objectives, Exercises & Quiz state
  const [objectives, setObjectives] = useState([]);
  const [breathingLevels, setBreathingLevels] = useState([]);
  const [editingBreathingLevel, setEditingBreathingLevel] = useState(null);
  const [postureIndicators, setPostureIndicators] = useState([]);
  const [editingPostureIndicator, setEditingPostureIndicator] = useState(null);
  const [mythFactQuestions, setMythFactQuestions] = useState([]);
  const [editingMythFact, setEditingMythFact] = useState(null);

  // Revisions state
  const [revisions, setRevisions] = useState([]);

  // Sync prop changes
  useEffect(() => {
    if (subTab) setActiveSubTab(subTab);
  }, [subTab]);

  // Initial Data Fetch
  useEffect(() => {
    loadTabContent(activeSubTab);
  }, [activeSubTab]);

  const loadTabContent = async (tab) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'dashboard') {
        const res = await api.getCmsDashboardStats();
        if (res.success) {
          setStats(res.stats);
          setRecentActivity(res.recentActivity || []);
        }
      } else if (tab === 'homepage' || tab === 'certificate' || tab === 'educational') {
        const slug = tab === 'certificate' ? 'certificate' : (tab === 'educational' ? 'stage_01' : 'homepage');
        const res = await api.getCmsSections({ page_slug: slug });
        if (res.success) setSections(res.sections || []);
      } else if (['media', 'videos', 'images', 'audio'].includes(tab)) {
        let typeFilter = 'ALL';
        if (tab === 'videos') typeFilter = 'VIDEO';
        if (tab === 'images') typeFilter = 'IMAGE';
        if (tab === 'audio') typeFilter = 'AUDIO';
        setMediaFilterType(typeFilter);
        const res = await api.getCmsMedia({ file_type: typeFilter, search: mediaSearch });
        if (res.success) setMediaList(res.media || []);
      } else if (tab === 'modules') {
        const res = await api.getCmsModules();
        if (res.success) setModules(res.modules || []);
      } else if (tab === 'stages' || tab === 'curriculum') {
        const res = await api.getCmsStages();
        if (res.success) setStages(res.stages || []);
      } else if (tab === 'objectives') {
        const res = await api.getAdminStageObjectives(1);
        if (res.success) setObjectives(res.objectives || []);
      } else if (tab === 'exercises' || tab === 'breathing') {
        const [levelsRes, indicatorsRes] = await Promise.all([
          api.getBreathingLevels ? api.getBreathingLevels() : Promise.resolve({ success: false }),
          api.adminGetPostureSection ? api.adminGetPostureSection(1) : Promise.resolve({ success: false })
        ]);
        if (levelsRes.success) setBreathingLevels(levelsRes.levels || []);
        if (indicatorsRes.success) setPostureIndicators(indicatorsRes.indicators || []);
      } else if (tab === 'assessments' || tab === 'questions') {
        const res = await (api.adminGetMythFactQuestions ? api.adminGetMythFactQuestions() : Promise.resolve({ success: false }));
        if (res.success) setMythFactQuestions(res.questions || []);
      } else if (tab === 'revisions') {
        const res = await api.getCmsRevisions();
        if (res.success) setRevisions(res.revisions || []);
      }
    } catch (err) {
      console.error('[CMS Load Error]:', err);
      setError(err.message || 'Failed to load content management data.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Section CRUD Handlers
  // -------------------------------------------------------------
  const handleOpenCreateSection = () => {
    setSelectedSection(null);
    setSectionForm({
      page_slug: activeSubTab === 'certificate' ? 'certificate' : 'homepage',
      section_key: '',
      section_title: '',
      headline: '',
      subheadline: '',
      body_content: '',
      cta_button_text: '',
      cta_button_url: '',
      media_url: '',
      status: 'PUBLISHED',
      display_order: sections.length + 1
    });
    setIsEditingSection(true);
  };

  const handleOpenEditSection = (sec) => {
    setSelectedSection(sec);
    setSectionForm({
      page_slug: sec.page_slug,
      section_key: sec.section_key,
      section_title: sec.section_title,
      headline: sec.headline || '',
      subheadline: sec.subheadline || '',
      body_content: sec.body_content || '',
      cta_button_text: sec.cta_button_text || '',
      cta_button_url: sec.cta_button_url || '',
      media_url: sec.media_url || '',
      status: sec.status || 'PUBLISHED',
      display_order: sec.display_order || 1
    });
    setIsEditingSection(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (selectedSection) {
        const res = await api.updateCmsSection(selectedSection.id, sectionForm);
        if (res.success) {
          setSuccessMsg(`Section "${sectionForm.section_title}" updated successfully.`);
          setIsEditingSection(false);
          loadTabContent(activeSubTab);
        }
      } else {
        const res = await api.createCmsSection(sectionForm);
        if (res.success) {
          setSuccessMsg(`New section "${sectionForm.section_title}" created and published.`);
          setIsEditingSection(false);
          loadTabContent(activeSubTab);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to save section.');
    }
  };

  const handleTogglePublishSection = async (sec) => {
    try {
      if (sec.status === 'PUBLISHED') {
        await api.unpublishCmsSection(sec.id);
        setSuccessMsg(`Section "${sec.section_title}" unpublished (set to Draft).`);
      } else {
        await api.publishCmsSection(sec.id);
        setSuccessMsg(`Section "${sec.section_title}" is now LIVE on the portal!`);
      }
      loadTabContent(activeSubTab);
    } catch (err) {
      setError(err.message || 'Failed to toggle publication status.');
    }
  };

  const handleDeleteSection = async (sec) => {
    if (!window.confirm(`Are you sure you want to delete "${sec.section_title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteCmsSection(sec.id);
      setSuccessMsg(`Section "${sec.section_title}" deleted.`);
      loadTabContent(activeSubTab);
    } catch (err) {
      setError(err.message || 'Failed to delete section.');
    }
  };

  // -------------------------------------------------------------
  // Media Upload & Management Handlers
  // -------------------------------------------------------------
  const handleUploadMedia = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please choose a file to upload.');
      return;
    }
    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('alt_text', uploadAltText);
      formData.append('caption', uploadCaption);

      const res = await api.uploadCmsMedia(formData);
      if (res.success) {
        setSuccessMsg(`Media asset "${uploadFile.name}" uploaded successfully!`);
        setUploadModalOpen(false);
        setUploadFile(null);
        setUploadAltText('');
        setUploadCaption('');
        loadTabContent(activeSubTab);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload media asset.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (m) => {
    if (!window.confirm(`Delete media asset "${m.file_name}"?`)) return;
    try {
      await api.deleteCmsMedia(m.id);
      setSuccessMsg(`Asset "${m.file_name}" removed from library.`);
      loadTabContent(activeSubTab);
    } catch (err) {
      setError(err.message || 'Failed to delete media asset.');
    }
  };

  // -------------------------------------------------------------
  // Module Update Handler
  // -------------------------------------------------------------
  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      await api.updateCmsModule(editingModule.id, editingModule);
      setSuccessMsg(`Module "${editingModule.title}" updated.`);
      setEditingModule(null);
      loadTabContent('modules');
    } catch (err) {
      setError(err.message || 'Failed to update module.');
    }
  };

  // -------------------------------------------------------------
  // Stage Update Handler
  // -------------------------------------------------------------
  const handleSaveStage = async (e) => {
    e.preventDefault();
    try {
      await api.updateCmsStage(editingStage.id, editingStage);
      setSuccessMsg(`Stage "${editingStage.title}" updated.`);
      setEditingStage(null);
      loadTabContent('stages');
    } catch (err) {
      setError(err.message || 'Failed to update stage.');
    }
  };

  // -------------------------------------------------------------
  // Revisions Rollback
  // -------------------------------------------------------------
  const handleRollback = async (revId) => {
    if (!window.confirm(`Roll back to revision #${revId}?`)) return;
    try {
      await api.rollbackCmsRevision(revId);
      setSuccessMsg(`Successfully restored revision #${revId}!`);
      loadTabContent(activeSubTab);
    } catch (err) {
      setError(err.message || 'Failed to roll back revision.');
    }
  };

  return (
    <div className="cms-portal-container" style={{ padding: '0 4px' }}>
      {/* Top Banner Alert Messages */}
      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#991B1B',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#166534',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: CONTENT DASHBOARD OVERVIEW
          ========================================================================= */}
      {activeSubTab === 'dashboard' && stats && (
        <div>
          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            <div className="dash-stat-card" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#77728A', fontWeight: 600 }}>PUBLISHED ITEMS</span>
                <Globe size={18} color="#7C3AED" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191B35' }}>{stats.totalPublished}</div>
              <div style={{ fontSize: '0.78rem', color: '#10B981', marginTop: '4px' }}>● Live on frontend</div>
            </div>

            <div className="dash-stat-card" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#77728A', fontWeight: 600 }}>DRAFT ITEMS</span>
                <FileText size={18} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191B35' }}>{stats.draftContent}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '4px' }}>Unpublished changes</div>
            </div>

            <div className="dash-stat-card" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#77728A', fontWeight: 600 }}>VIDEOS</span>
                <Film size={18} color="#2563EB" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191B35' }}>{stats.totalVideos}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '4px' }}>HD Instructional Videos</div>
            </div>

            <div className="dash-stat-card" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#77728A', fontWeight: 600 }}>IMAGES &amp; GIFS</span>
                <ImageIcon size={18} color="#EC4899" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191B35' }}>{(stats.totalImages || 0) + (stats.totalGifs || 0)}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '4px' }}>{stats.totalGifs} Animations / {stats.totalImages} Photos</div>
            </div>

            <div className="dash-stat-card" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#77728A', fontWeight: 600 }}>AUDIO &amp; SONGS</span>
                <Music size={18} color="#8B5CF6" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191B35' }}>{stats.totalAudio}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '4px' }}>Waveform / Tracks</div>
            </div>

            <div className="dash-stat-card" style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#77728A', fontWeight: 600 }}>CURRICULUM STAGES</span>
                <Layers size={18} color="#14B8A6" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#191B35' }}>{stats.totalStages}</div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '4px' }}>Across {stats.totalModules} modules</div>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Quick Content Management Shortcuts</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <button
                onClick={() => onNavigateSubTab ? onNavigateSubTab('homepage') : setActiveSubTab('homepage')}
                className="dash-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Globe size={16} />
                <span>Edit Homepage</span>
              </button>
              <button
                onClick={() => onNavigateSubTab ? onNavigateSubTab('modules') : setActiveSubTab('modules')}
                className="dash-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Layers size={16} />
                <span>Manage Modules</span>
              </button>
              <button
                onClick={() => onNavigateSubTab ? onNavigateSubTab('media') : setActiveSubTab('media')}
                className="dash-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FolderOpen size={16} />
                <span>Media Library</span>
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="dash-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Upload size={16} />
                <span>Upload Media Asset</span>
              </button>
              <button
                onClick={() => onNavigateSubTab ? onNavigateSubTab('assessments') : setActiveSubTab('assessments')}
                className="dash-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <HelpCircle size={16} />
                <span>Question Bank</span>
              </button>
            </div>
          </div>

          {/* Recent Content Revisions Audit Trail */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Recent Content Activity &amp; Publication History</h3>
              <button
                onClick={() => onNavigateSubTab ? onNavigateSubTab('revisions') : setActiveSubTab('revisions')}
                style={{ fontSize: '0.85rem', color: '#7C3AED', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View Full Audit History &rarr;
              </button>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#77728A', fontSize: '0.9rem' }}>
                No recent modifications logged yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                      <th style={{ padding: '10px 12px' }}>Timestamp</th>
                      <th style={{ padding: '10px 12px' }}>Admin</th>
                      <th style={{ padding: '10px 12px' }}>Entity</th>
                      <th style={{ padding: '10px 12px' }}>Action</th>
                      <th style={{ padding: '10px 12px' }}>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #EAE5F3' }}>
                        <td style={{ padding: '10px 12px', color: '#77728A' }}>{new Date(r.created_at).toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.admin_username}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', backgroundColor: '#F3E8FF', color: '#6B21A8' }}>
                            {r.entity_type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: r.action === 'PUBLISH' ? '#DCFCE7' : (r.action === 'DELETE' ? '#FEE2E2' : '#EFF6FF'),
                            color: r.action === 'PUBLISH' ? '#166534' : (r.action === 'DELETE' ? '#991B1B' : '#1E40AF')
                          }}>
                            {r.action}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#374151' }}>{r.change_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: HOMEPAGE & PAGE SECTIONS MANAGEMENT
          ========================================================================= */}
      {(['homepage', 'certificate', 'educational'].includes(activeSubTab)) && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {activeSubTab === 'homepage' && 'Homepage Content & Hero Sections'}
                {activeSubTab === 'certificate' && 'Stage 5 Completion & Certificate Wording'}
                {activeSubTab === 'educational' && 'Stage 01 Educational Content Blocks'}
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#77728A', marginTop: '4px' }}>
                Real-time MySQL database content. Edits reflect immediately on user-facing portal upon publishing.
              </div>
            </div>
            <button
              onClick={handleOpenCreateSection}
              className="dash-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={16} />
              <span>Add New Section</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                  <th style={{ padding: '10px 12px' }}>Order</th>
                  <th style={{ padding: '10px 12px' }}>Section Key</th>
                  <th style={{ padding: '10px 12px' }}>Section Title</th>
                  <th style={{ padding: '10px 12px' }}>Headline Preview</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Media Asset</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map(sec => (
                  <tr key={sec.id} style={{ borderBottom: '1px solid #EAE5F3' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#7C3AED' }}>#{sec.display_order}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#4B5563' }}>{sec.section_key}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{sec.section_title}</td>
                    <td style={{ padding: '12px', color: '#1F2937', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sec.headline || sec.subheadline || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: sec.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                        color: sec.status === 'PUBLISHED' ? '#166534' : '#92400E'
                      }}>
                        {sec.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem' }}>
                      {sec.media_url ? (
                        <a href={sec.media_url} target="_blank" rel="noreferrer" style={{ color: '#7C3AED', textDecoration: 'underline' }}>
                          View Media
                        </a>
                      ) : (
                        <span style={{ color: '#9CA3AF' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleTogglePublishSection(sec)}
                          title={sec.status === 'PUBLISHED' ? 'Unpublish' : 'Publish Live'}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            backgroundColor: sec.status === 'PUBLISHED' ? '#FFFBEB' : '#ECFDF5',
                            color: sec.status === 'PUBLISHED' ? '#B45309' : '#047857',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600
                          }}
                        >
                          {sec.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleOpenEditSection(sec)}
                          title="Edit Content"
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                        >
                          <Edit3 size={15} color="#4F46E5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(sec)}
                          title="Delete"
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} color="#DC2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: MEDIA LIBRARY (VIDEOS, IMAGES, GIFS, AUDIO)
          ========================================================================= */}
      {(['media', 'videos', 'images', 'audio'].includes(activeSubTab)) && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Centralized Media Library</h3>
              <div style={{ fontSize: '0.82rem', color: '#77728A', marginTop: '4px' }}>
                Secure media registry for videos, diagrams, GIFs, audio guides, and singer photos.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="dash-btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Upload size={16} />
                <span>Upload New Asset</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', borderRadius: '8px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
              {['ALL', 'VIDEO', 'IMAGE', 'GIF', 'AUDIO'].map(type => (
                <button
                  key={type}
                  onClick={() => { setMediaFilterType(type); api.getCmsMedia({ file_type: type, search: mediaSearch }).then(res => res.success && setMediaList(res.media)); }}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: mediaFilterType === type ? '#7C3AED' : '#FFFFFF',
                    color: mediaFilterType === type ? '#FFFFFF' : '#4B5563'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '360px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search file name or caption..."
                value={mediaSearch}
                onChange={(e) => {
                  setMediaSearch(e.target.value);
                  api.getCmsMedia({ file_type: mediaFilterType, search: e.target.value }).then(res => res.success && setMediaList(res.media));
                }}
                style={{ width: '100%', padding: '6px 12px 6px 34px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Media Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            {mediaList.map(m => (
              <div
                key={m.id}
                style={{
                  border: '1px solid #EAE5F3',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Media Thumbnail / Preview Area */}
                <div
                  onClick={() => setSelectedMediaForPreview(m)}
                  style={{
                    height: '140px',
                    backgroundColor: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {m.file_type === 'IMAGE' || m.file_type === 'GIF' ? (
                    <img
                      src={m.storage_path}
                      alt={m.alt_text}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : m.file_type === 'VIDEO' ? (
                    <div style={{ color: '#FFFFFF', textAlign: 'center' }}>
                      <Film size={32} style={{ margin: '0 auto 6px auto', opacity: 0.9 }} />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Click to Preview Video</div>
                    </div>
                  ) : m.file_type === 'AUDIO' ? (
                    <div style={{ color: '#A78BFA', textAlign: 'center' }}>
                      <Volume2 size={32} style={{ margin: '0 auto 6px auto' }} />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Audio Waveform Track</div>
                    </div>
                  ) : (
                    <FileText size={32} color="#94A3B8" />
                  )}

                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    color: '#FFFFFF',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {m.file_type}
                  </span>
                </div>

                {/* Media Details */}
                <div style={{ padding: '12px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937', wordBreak: 'break-all' }}>
                      {m.original_name || m.file_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '2px' }}>
                      {(m.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {m.mime_type}
                    </div>
                    {m.caption && (
                      <div style={{ fontSize: '0.75rem', color: '#4B5563', marginTop: '4px', fontStyle: 'italic' }}>
                        {m.caption}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                    <button
                      onClick={() => setSelectedMediaForPreview(m)}
                      style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(m)}
                      style={{ fontSize: '0.75rem', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: LEARNING MODULES MANAGEMENT
          ========================================================================= */}
      {activeSubTab === 'modules' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>Curriculum Learning Modules</h3>
          <div style={{ fontSize: '0.82rem', color: '#77728A', marginBottom: '20px' }}>
            Manage Module 1 (The Hidden Engine) through Module 5, titles, publication status, and order.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                  <th style={{ padding: '10px 12px' }}>Mod #</th>
                  <th style={{ padding: '10px 12px' }}>Title</th>
                  <th style={{ padding: '10px 12px' }}>Category</th>
                  <th style={{ padding: '10px 12px' }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Available</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {modules.map(mod => (
                  <tr key={mod.id} style={{ borderBottom: '1px solid #EAE5F3' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#7C3AED' }}>MOD-{mod.module_number}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{mod.title}</td>
                    <td style={{ padding: '12px', color: '#4B5563' }}>{mod.category}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: mod.status === 'IN_PROGRESS' ? '#DCFCE7' : '#F3F4F6',
                        color: mod.status === 'IN_PROGRESS' ? '#166534' : '#6B7280'
                      }}>
                        {mod.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{mod.is_available ? '✅ Unlocked' : '🔒 Locked'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => setEditingModule({ ...mod })}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5' }}
                      >
                        Edit Module
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: CURRICULUM STAGES MANAGEMENT
          ========================================================================= */}
      {(activeSubTab === 'stages' || activeSubTab === 'curriculum') && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>Module 1: 5 Progressive Stages</h3>
          <div style={{ fontSize: '0.82rem', color: '#77728A', marginBottom: '20px' }}>
            Edit Stage 1 through Stage 5 titles, subtitles, prerequisites, and instructional text.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                  <th style={{ padding: '10px 12px' }}>Stage</th>
                  <th style={{ padding: '10px 12px' }}>Title</th>
                  <th style={{ padding: '10px 12px' }}>Subtitle</th>
                  <th style={{ padding: '10px 12px' }}>Description</th>
                  <th style={{ padding: '10px 12px' }}>Active</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {stages.map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid #EAE5F3' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#7C3AED' }}>Stage 0{st.stage_number}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{st.title}</td>
                    <td style={{ padding: '12px', color: '#6B7280' }}>{st.subtitle}</td>
                    <td style={{ padding: '12px', color: '#374151', maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.description || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>{st.is_active ? '✅ Active' : '❌ Inactive'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => setEditingStage({ ...st })}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5' }}
                      >
                        Edit Stage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 6: OBJECTIVES, EXERCISES, ASSESSMENTS & REVISION AUDIT
          ========================================================================= */}
      {activeSubTab === 'revisions' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '24px', border: '1px solid #EAE5F3' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>Content Revision &amp; Safe Restoration Audit</h3>
          <div style={{ fontSize: '0.82rem', color: '#77728A', marginBottom: '20px' }}>
            Snapshot history of every administrative creation, modification, and publication event with one-click restore.
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.78rem' }}>
                  <th style={{ padding: '10px 12px' }}>ID</th>
                  <th style={{ padding: '10px 12px' }}>Date</th>
                  <th style={{ padding: '10px 12px' }}>Admin</th>
                  <th style={{ padding: '10px 12px' }}>Entity</th>
                  <th style={{ padding: '10px 12px' }}>Action</th>
                  <th style={{ padding: '10px 12px' }}>Summary</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Restore</th>
                </tr>
              </thead>
              <tbody>
                {revisions.map(rev => (
                  <tr key={rev.id} style={{ borderBottom: '1px solid #EAE5F3' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>#{rev.id}</td>
                    <td style={{ padding: '10px 12px', color: '#6B7280' }}>{new Date(rev.created_at).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{rev.admin_username}</td>
                    <td style={{ padding: '10px 12px' }}>{rev.entity_type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: rev.action === 'PUBLISH' ? '#DCFCE7' : (rev.action === 'DELETE' ? '#FEE2E2' : '#EFF6FF'),
                        color: rev.action === 'PUBLISH' ? '#166534' : (rev.action === 'DELETE' ? '#991B1B' : '#1E40AF')
                      }}>
                        {rev.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{rev.change_summary}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      {rev.previous_state ? (
                        <button
                          onClick={() => handleRollback(rev.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#7C3AED',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <RotateCcw size={13} />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: SECTION EDIT / CREATE MODAL
          ========================================================================= */}
      {isEditingSection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {selectedSection ? `Edit Section: ${selectedSection.section_title}` : 'Create New Portal Section'}
              </h3>
              <button onClick={() => setIsEditingSection(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Section Key (Unique)</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(selectedSection)}
                    value={sectionForm.section_key}
                    onChange={(e) => setSectionForm({ ...sectionForm, section_key: e.target.value })}
                    placeholder="e.g. hero, what_is_breath"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Section Title</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.section_title}
                    onChange={(e) => setSectionForm({ ...sectionForm, section_title: e.target.value })}
                    placeholder="Human readable title"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Headline / Main Heading</label>
                <input
                  type="text"
                  value={sectionForm.headline}
                  onChange={(e) => setSectionForm({ ...sectionForm, headline: e.target.value })}
                  placeholder="Primary headline on frontend"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Subheadline</label>
                <input
                  type="text"
                  value={sectionForm.subheadline}
                  onChange={(e) => setSectionForm({ ...sectionForm, subheadline: e.target.value })}
                  placeholder="Subheading or summary sentence"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Body Content Paragraphs</label>
                <textarea
                  rows={4}
                  value={sectionForm.body_content}
                  onChange={(e) => setSectionForm({ ...sectionForm, body_content: e.target.value })}
                  placeholder="Explanatory text, instructions, or article content"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Call To Action Button Text</label>
                  <input
                    type="text"
                    value={sectionForm.cta_button_text}
                    onChange={(e) => setSectionForm({ ...sectionForm, cta_button_text: e.target.value })}
                    placeholder="e.g. JOURNEY, Get Started"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Button Link / Anchor</label>
                  <input
                    type="text"
                    value={sectionForm.cta_button_url}
                    onChange={(e) => setSectionForm({ ...sectionForm, cta_button_url: e.target.value })}
                    placeholder="e.g. #journey-goals or /login"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Media Asset URL or Storage Path</label>
                  <input
                    type="text"
                    value={sectionForm.media_url}
                    onChange={(e) => setSectionForm({ ...sectionForm, media_url: e.target.value })}
                    placeholder="/hero-singer.jpeg, /IMG_7993.MP4"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Publication Status</label>
                  <select
                    value={sectionForm.status}
                    onChange={(e) => setSectionForm({ ...sectionForm, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                  >
                    <option value="PUBLISHED">PUBLISHED (Live)</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingSection(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px' }}
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: MEDIA UPLOAD MODAL
          ========================================================================= */}
      {uploadModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Upload Portal Media Asset</h3>
              <button onClick={() => setUploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadMedia} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                border: '2px dashed #D1D5DB',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#F9FAFB'
              }}>
                <Upload size={32} color="#7C3AED" style={{ margin: '0 auto 10px auto' }} />
                <input
                  type="file"
                  required
                  accept="video/mp4,video/webm,image/png,image/jpeg,image/webp,image/gif,image/svg+xml,audio/wav,audio/mp3,audio/ogg"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  style={{ display: 'block', margin: '0 auto', fontSize: '0.85rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '8px' }}>
                  Supports MP4, WebM, PNG, JPG, GIF, WebP, SVG, WAV, MP3 (Up to 65 MB)
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Alt Text (Accessibility)</label>
                <input
                  type="text"
                  placeholder="Descriptive label for screen readers"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Caption / Internal Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Stage 01 primary instructional video"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="dash-btn-primary"
                  style={{ padding: '8px 20px', borderRadius: '8px' }}
                >
                  {uploading ? 'Uploading...' : 'Upload Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: MEDIA PREVIEW MODAL
          ========================================================================= */}
      {selectedMediaForPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '720px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{selectedMediaForPreview.original_name || selectedMediaForPreview.file_name}</h4>
              <button onClick={() => setSelectedMediaForPreview(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#000000', borderRadius: '12px', overflow: 'hidden', minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {selectedMediaForPreview.file_type === 'IMAGE' || selectedMediaForPreview.file_type === 'GIF' ? (
                <img src={selectedMediaForPreview.storage_path} alt={selectedMediaForPreview.alt_text} style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }} />
              ) : selectedMediaForPreview.file_type === 'VIDEO' ? (
                <video controls src={selectedMediaForPreview.storage_path} style={{ width: '100%', maxHeight: '420px' }} />
              ) : selectedMediaForPreview.file_type === 'AUDIO' ? (
                <audio controls src={selectedMediaForPreview.storage_path} style={{ width: '80%' }} />
              ) : (
                <div style={{ color: '#FFFFFF', padding: '20px' }}>File preview not supported for this type.</div>
              )}
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#4B5563', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div><strong>Type:</strong> {selectedMediaForPreview.file_type} ({selectedMediaForPreview.mime_type})</div>
              <div><strong>Size:</strong> {(selectedMediaForPreview.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Storage Path:</strong> <code>{selectedMediaForPreview.storage_path}</code></div>
              {selectedMediaForPreview.alt_text && <div style={{ gridColumn: 'span 2' }}><strong>Alt Text:</strong> {selectedMediaForPreview.alt_text}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => setSelectedMediaForPreview(null)}
                className="dash-btn-primary"
                style={{ padding: '6px 18px', fontSize: '0.85rem' }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT MODULE MODAL
          ========================================================================= */}
      {editingModule && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '26px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Edit Module: {editingModule.title}</h3>
              <button onClick={() => setEditingModule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveModule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Module Title</label>
                <input
                  type="text"
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Description</label>
                <textarea
                  rows={3}
                  value={editingModule.description}
                  onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Status</label>
                  <select
                    value={editingModule.status}
                    onChange={(e) => setEditingModule({ ...editingModule, status: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS (Active)</option>
                    <option value="COMING_SOON">COMING_SOON (Locked)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Availability</label>
                  <select
                    value={editingModule.is_available ? '1' : '0'}
                    onChange={(e) => setEditingModule({ ...editingModule, is_available: e.target.value === '1' })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  >
                    <option value="1">Unlocked (Students Can Enter)</option>
                    <option value="0">Locked</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingModule(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF' }}>Cancel</button>
                <button type="submit" className="dash-btn-primary" style={{ padding: '8px 20px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: EDIT STAGE MODAL
          ========================================================================= */}
      {editingStage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            padding: '26px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Edit Stage 0{editingStage.stage_number}: {editingStage.title}</h3>
              <button onClick={() => setEditingStage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveStage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Stage Title</label>
                <input
                  type="text"
                  value={editingStage.title}
                  onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Subtitle</label>
                <input
                  type="text"
                  value={editingStage.subtitle}
                  onChange={(e) => setEditingStage({ ...editingStage, subtitle: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Description</label>
                <textarea
                  rows={3}
                  value={editingStage.description}
                  onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Active Status</label>
                <select
                  value={editingStage.is_active ? '1' : '0'}
                  onChange={(e) => setEditingStage({ ...editingStage, is_active: e.target.value === '1' })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingStage(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#FFFFFF' }}>Cancel</button>
                <button type="submit" className="dash-btn-primary" style={{ padding: '8px 20px' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
