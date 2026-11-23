import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MediaUploadField from './MediaUploadField';
import {
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Film,
  Play,
  RotateCcw,
  Sparkles,
  Eye,
  ExternalLink
} from 'lucide-react';

export default function WelcomePageManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for all homepage sections
  const [heroForm, setHeroForm] = useState({
    headline: 'EVERY VOICE HAS A STORY.',
    subheadline: 'A comprehensive training platform for singers to build vocal strength, control, and confidence for effortless singing.',
    cta_button_text: 'JOURNEY',
    cta_button_url: '#journey-goals',
    media_url: '/hero-singer.jpeg'
  });

  const [breathForm, setBreathForm] = useState({
    headline: 'The Science of Breath Management',
    subheadline: 'Understanding inhalation, diaphragmatic expansion, and controlled exhalation.',
    body_content: 'Breath management is not simply taking a deep breath; it is the art of regulating subglottic air pressure, thoracic support, and vocal tract resonance to sustain phrases effortlessly without vocal strain.',
    media_url: '/IMG_7993.MP4'
  });

  const [postureForm, setPostureForm] = useState({
    headline: 'Posture Drives Breath, Breath Powers Voice',
    subheadline: 'Align your head, shoulders, ribs, knees, and feet for maximum pulmonary capacity.',
    body_content: 'Physical alignment is the foundation of singing. When the skeleton is stacked properly, the lungs expand unimpeded and the diaphragm lowers smoothly.',
    media_url: '/posture_animation_HD.gif',
    secondary_media_url: '/converted_HD_loop.gif'
  });

  const [goalsForm, setGoalsForm] = useState({
    headline: 'Choose Your Personalized Vocal Path',
    subheadline: 'Select your core goal to customize your practice routines and diagnostic feedback.',
    goals: [
      { id: 'learn-singing', title: 'I want to learn singing.', desc: 'Foundations of pitch, ear training and fundamental vocalization.' },
      { id: 'improve-breathing', title: 'I want to improve my breathing.', desc: 'Master diaphragmatic support, lung capacity, and steady airflow.' },
      { id: 'develop-technique', title: 'I want to develop my vocal technique.', desc: 'Refine agility, vibrato, register blending, and vocal resonance.' },
      { id: 'explore-classical', title: 'I want to explore classical singing.', desc: 'Immerse in classical pedagogy, Carnatic/Hindustani, or operatic arias.' },
      { id: 'prepare-performances', title: 'I want to prepare for performances.', desc: 'Build stage presence, microphone command, and performance endurance.' },
      { id: 'vocal-trainer', title: 'I am a vocal trainer.', desc: 'Access pedagogical tools, breath telemetry, and vocal diagnostic exercises.' }
    ]
  });

  const [footerForm, setFooterForm] = useState({
    headline: 'No Tre(ou)ble – Voice Pedagogy Studio',
    body_content: '© 2026 No Tre(ou)ble. All rights reserved. Vocal breath management, kinetic simulation, and diagnostic learning system.'
  });

  // Track raw section IDs from MySQL
  const [sectionIds, setSectionIds] = useState({});

  const loadHomepageContent = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getCmsSections({ page_slug: 'homepage' });
      if (res && res.success && res.sections) {
        const idMap = {};
        res.sections.forEach(sec => {
          idMap[sec.section_key] = sec.id;
          if (sec.section_key === 'hero') {
            setHeroForm({
              headline: sec.headline || 'EVERY VOICE HAS A STORY.',
              subheadline: sec.subheadline || '',
              cta_button_text: sec.cta_button_text || 'JOURNEY',
              cta_button_url: sec.cta_button_url || '#journey-goals',
              media_url: sec.media_url || '/hero-singer.jpeg'
            });
          } else if (sec.section_key === 'what_is_breath') {
            setBreathForm({
              headline: sec.headline || '',
              subheadline: sec.subheadline || '',
              body_content: sec.body_content || '',
              media_url: sec.media_url || '/IMG_7993.MP4'
            });
          } else if (sec.section_key === 'kinetic_posture') {
            let extra = {};
            try { extra = typeof sec.extra_settings === 'string' ? JSON.parse(sec.extra_settings) : (sec.extra_settings || {}); } catch(e){}
            setPostureForm({
              headline: sec.headline || '',
              subheadline: sec.subheadline || '',
              body_content: sec.body_content || '',
              media_url: sec.media_url || '/posture_animation_HD.gif',
              secondary_media_url: extra.secondaryMediaUrl || '/converted_HD_loop.gif'
            });
          } else if (sec.section_key === 'musical_goals') {
            let extra = {};
            try { extra = typeof sec.extra_settings === 'string' ? JSON.parse(sec.extra_settings) : (sec.extra_settings || {}); } catch(e){}
            setGoalsForm({
              headline: sec.headline || 'Choose Your Personalized Vocal Path',
              subheadline: sec.subheadline || '',
              goals: extra.goalsList || goalsForm.goals
            });
          } else if (sec.section_key === 'footer') {
            setFooterForm({
              headline: sec.headline || '',
              body_content: sec.body_content || ''
            });
          }
        });
        setSectionIds(idMap);
      }
    } catch (err) {
      if (err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Administrative privileges')) {
        console.warn('CMS Sections fetch returned 403 (unauthorized or non-admin session)');
        setError('Administrative privileges required to manage homepage content.');
        return;
      }
      console.error('Error loading homepage CMS:', err);
      setError(err.message || 'Failed to load homepage content from MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomepageContent();
  }, []);

  const handleSaveAll = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');

      // 1. Save Hero
      if (sectionIds.hero) {
        await api.updateCmsSection(sectionIds.hero, {
          section_title: 'Hero / Welcome Banner',
          headline: heroForm.headline,
          subheadline: heroForm.subheadline,
          cta_button_text: heroForm.cta_button_text,
          cta_button_url: heroForm.cta_button_url,
          media_url: heroForm.media_url,
          status: 'PUBLISHED'
        });
      }

      // 2. Save What is Breath
      if (sectionIds.what_is_breath) {
        await api.updateCmsSection(sectionIds.what_is_breath, {
          section_title: 'What is Breath Management?',
          headline: breathForm.headline,
          subheadline: breathForm.subheadline,
          body_content: breathForm.body_content,
          media_url: breathForm.media_url,
          status: 'PUBLISHED'
        });
      }

      // 3. Save Kinetic Posture
      if (sectionIds.kinetic_posture) {
        await api.updateCmsSection(sectionIds.kinetic_posture, {
          section_title: 'Kinetic Posture & Breathing Mechanics',
          headline: postureForm.headline,
          subheadline: postureForm.subheadline,
          body_content: postureForm.body_content,
          media_url: postureForm.media_url,
          extra_settings: JSON.stringify({ secondaryMediaUrl: postureForm.secondary_media_url }),
          status: 'PUBLISHED'
        });
      }

      // 4. Save Musical Goals
      if (sectionIds.musical_goals) {
        await api.updateCmsSection(sectionIds.musical_goals, {
          section_title: 'What is Your Musical Journey?',
          headline: goalsForm.headline,
          subheadline: goalsForm.subheadline,
          extra_settings: JSON.stringify({ goalsList: goalsForm.goals }),
          status: 'PUBLISHED'
        });
      }

      // 5. Save Footer
      if (sectionIds.footer) {
        await api.updateCmsSection(sectionIds.footer, {
          section_title: 'Portal Footer & Copyright',
          headline: footerForm.headline,
          body_content: footerForm.body_content,
          status: 'PUBLISHED'
        });
      }

      setSuccessMsg('All Welcome Page content, headlines, card images, and media successfully saved & published live to the homepage!');
      setTimeout(() => setSuccessMsg(''), 5000);
      loadHomepageContent();
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleGoalChange = (idx, field, value) => {
    const nextGoals = [...goalsForm.goals];
    nextGoals[idx] = { ...nextGoals[idx], [field]: value };
    setGoalsForm({ ...goalsForm, goals: nextGoals });
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#77728A' }}>
        Loading Welcome Page configuration from MySQL...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '18px', padding: '26px', border: '1px solid #EAE5F3' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: '#191B35' }}>
            Welcome Page Content &amp; Media Management
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#77728A' }}>
            Alter the homepage hero text, singer image, call-to-action button, posture animation GIFs, and musical goal cards in one place.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="dash-btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Eye size={15} />
            <span>Preview Homepage</span>
          </a>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="dash-btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '10px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#991B1B', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '10px 16px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '10px', color: '#166534', marginBottom: '18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* SECTION 1: HERO BANNER */}
        <div style={{ background: '#F8F7FC', padding: '20px', borderRadius: '14px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ backgroundColor: '#7C3AED', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>SECTION 1</span>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>Hero Banner &amp; Main Headline</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                Main Heading
              </label>
              <input
                type="text"
                value={heroForm.headline}
                onChange={(e) => setHeroForm({ ...heroForm, headline: e.target.value })}
                placeholder="EVERY VOICE HAS A STORY."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#77728A', display: 'block', marginTop: '2px' }}>
                Rendered on the welcome page with stylized two-line typography and gradient.
              </span>
            </div>

            <div>
              <MediaUploadField
                label="Hero Singer Portrait Image"
                value={heroForm.media_url}
                onChange={(url) => setHeroForm({ ...heroForm, media_url: url })}
                mediaType="image"
                description="Right-side portrait image on the welcome screen."
                placeholder="/hero-singer.jpeg"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                Description Paragraph
              </label>
              <textarea
                rows={2}
                value={heroForm.subheadline}
                onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                Call To Action Button Label
              </label>
              <input
                type="text"
                value={heroForm.cta_button_text}
                onChange={(e) => setHeroForm({ ...heroForm, cta_button_text: e.target.value })}
                placeholder="JOURNEY"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>
                CTA Button Scroll Target
              </label>
              <input
                type="text"
                value={heroForm.cta_button_url}
                onChange={(e) => setHeroForm({ ...heroForm, cta_button_url: e.target.value })}
                placeholder="#journey-goals"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: THE SCIENCE OF BREATH MANAGEMENT */}
        <div style={{ background: '#F8F7FC', padding: '20px', borderRadius: '14px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ backgroundColor: '#7C3AED', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>SECTION 2</span>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>What is Breath Management? (Concept &amp; Video)</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Headline</label>
              <input
                type="text"
                value={breathForm.headline}
                onChange={(e) => setBreathForm({ ...breathForm, headline: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
              />
            </div>

            <div>
              <MediaUploadField
                label="Instructional Video"
                value={breathForm.media_url}
                onChange={(url) => setBreathForm({ ...breathForm, media_url: url })}
                mediaType="video"
                description="Instructional MP4/WebM video explaining breath control."
                placeholder="/IMG_7993.MP4"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Body Explanation</label>
              <textarea
                rows={2}
                value={breathForm.body_content}
                onChange={(e) => setBreathForm({ ...breathForm, body_content: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: KINETIC POSTURE & ANIMATIONS */}
        <div style={{ background: '#F8F7FC', padding: '20px', borderRadius: '14px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ backgroundColor: '#7C3AED', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>SECTION 3</span>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>Kinetic Posture &amp; Breathing Animations (GIFs)</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <MediaUploadField
                label="Posture Animation (GIF / Video)"
                value={postureForm.media_url}
                onChange={(url) => setPostureForm({ ...postureForm, media_url: url })}
                mediaType="image"
                description="Kinetic posture animation loop on the welcome screen."
                placeholder="/posture_animation_HD.gif"
              />
            </div>

            <div>
              <MediaUploadField
                label="Thoracic Expansion (GIF / Video)"
                value={postureForm.secondary_media_url}
                onChange={(url) => setPostureForm({ ...postureForm, secondary_media_url: url })}
                mediaType="image"
                description="Secondary ribcage thoracic loop animation."
                placeholder="/converted_HD_loop.gif"
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Posture Section Summary</label>
              <textarea
                rows={2}
                value={postureForm.body_content}
                onChange={(e) => setPostureForm({ ...postureForm, body_content: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: MUSICAL GOALS CARDS */}
        <div style={{ background: '#F8F7FC', padding: '20px', borderRadius: '14px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ backgroundColor: '#7C3AED', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>SECTION 4</span>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>What is Your Musical Journey? (6 Goal Cards)</h4>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Section Heading</label>
            <input
              type="text"
              value={goalsForm.headline}
              onChange={(e) => setGoalsForm({ ...goalsForm, headline: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {goalsForm.goals.map((g, idx) => (
              <div key={g.id || idx} style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: '10px', border: '1px solid #EAE5F3' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED' }}>Card #{idx + 1}</span>
                <input
                  type="text"
                  value={g.title}
                  onChange={(e) => handleGoalChange(idx, 'title', e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.82rem', fontWeight: 700, margin: '6px 0' }}
                />
                <textarea
                  rows={2}
                  value={g.desc}
                  onChange={(e) => handleGoalChange(idx, 'desc', e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '0.78rem', resize: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: FOOTER & COPYRIGHT */}
        <div style={{ background: '#F8F7FC', padding: '20px', borderRadius: '14px', border: '1px solid #EAE5F3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ backgroundColor: '#7C3AED', color: '#FFFFFF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>FOOTER</span>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>Portal Footer &amp; Copyright Notice</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Brand Headline</label>
              <input
                type="text"
                value={footerForm.headline}
                onChange={(e) => setFooterForm({ ...footerForm, headline: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Copyright &amp; Rights Copy</label>
              <input
                type="text"
                value={footerForm.body_content}
                onChange={(e) => setFooterForm({ ...footerForm, body_content: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.88rem' }}
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={loadHomepageContent}
            className="dash-btn-outline"
            style={{ padding: '10px 18px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={15} />
            <span>Discard Changes</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="dash-btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Publishing...' : 'Save & Publish Live to Homepage'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
