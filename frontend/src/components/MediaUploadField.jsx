import React, { useState, useRef } from 'react';
import { Upload, Trash2, Image as ImageIcon, Video as VideoIcon, Box, FileAudio, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MediaUploadField({
  label,
  value = '',
  onChange,
  mediaType = 'image', // 'image' | 'video' | 'audio' | 'model'
  description,
  accept,
  placeholder = 'Select or upload file...'
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef(null);

  const defaultAccept = {
    image: 'image/*,.png,.jpg,.jpeg,.webp,.gif,.svg',
    video: 'video/*,.mp4,.webm,.ogg',
    audio: 'audio/*,.mp3,.wav,.ogg,.m4a',
    model: '.glb,.gltf,video/*,image/*,.gif'
  }[mediaType] || '*/*';

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt_text', file.name);

      const res = await api.uploadCmsMedia(formData);
      if (res && res.success && res.media?.storage_path) {
        onChange(res.media.storage_path);
        setUploadSuccess(`Uploaded "${file.name}" successfully!`);
        setTimeout(() => setUploadSuccess(''), 3500);
      } else {
        throw new Error(res?.message || 'Failed to upload file.');
      }
    } catch (err) {
      console.error('Media upload error:', err);
      setUploadError(err.message || 'File upload failed. Please try a valid media file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isVideo = mediaType === 'video' || (value && (value.endsWith('.mp4') || value.endsWith('.webm') || value.endsWith('.ogg') || value.includes('mov_bbb')));
  const is3DModel = mediaType === 'model' && value && (value.endsWith('.glb') || value.endsWith('.gltf'));
  const isAudio = mediaType === 'audio' || (value && (value.endsWith('.mp3') || value.endsWith('.wav') || value.endsWith('.m4a')));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4B5563', margin: 0 }}>
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowManualUrl(!showManualUrl)}
            style={{
              background: 'none',
              border: 'none',
              color: '#7C3AED',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontWeight: 650,
              padding: 0
            }}
          >
            {showManualUrl ? 'Hide URL input' : 'Edit path / URL'}
          </button>
        </div>
      )}

      {/* Visual Live Preview Box */}
      <div style={{
        borderRadius: 12,
        border: '1.5px solid #EAE5F3',
        backgroundColor: '#FFFFFF',
        padding: '10px 14px',
        boxShadow: '0 1px 3px rgba(25, 27, 53, 0.04)',
        display: 'flex',
        flexDirection: isVideo ? 'column' : 'row',
        alignItems: isVideo ? 'stretch' : 'center',
        gap: 12
      }}>
        {/* Media Preview Slot */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
          {value ? (
            isVideo ? (
              <video
                src={value}
                controls
                style={{
                  width: '100%',
                  maxHeight: 180,
                  borderRadius: 8,
                  backgroundColor: '#0F172A',
                  objectFit: 'contain'
                }}
              />
            ) : isAudio ? (
              <audio src={value} controls style={{ width: '100%', height: 38 }} />
            ) : is3DModel ? (
              <div style={{
                width: 90,
                height: 70,
                borderRadius: 8,
                backgroundColor: '#EDE9FE',
                color: '#6D28D9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}>
                <Box size={26} />
                <span style={{ fontSize: '0.66rem', fontWeight: 800 }}>3D MODEL</span>
              </div>
            ) : (
              <img
                src={value}
                alt={label || 'Media preview'}
                style={{
                  width: 90,
                  height: 70,
                  borderRadius: 8,
                  objectFit: 'cover',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8F7FF'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )
          ) : (
            <div style={{
              width: 80,
              height: 64,
              borderRadius: 8,
              backgroundColor: '#F1F5F9',
              color: '#94A3B8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4
            }}>
              {mediaType === 'video' ? <VideoIcon size={22} /> : mediaType === 'model' ? <Box size={22} /> : mediaType === 'audio' ? <FileAudio size={22} /> : <ImageIcon size={22} />}
              <span style={{ fontSize: '0.62rem', fontWeight: 650 }}>No File</span>
            </div>
          )}
        </div>

        {/* Media Controls & Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.78rem',
            fontFamily: 'monospace',
            color: '#1E293B',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 6,
            fontWeight: 600
          }} title={value}>
            {value || <span style={{ color: '#94A3B8', fontFamily: 'inherit' }}>No media file chosen</span>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="file"
              ref={fileInputRef}
              accept={accept || defaultAccept}
              onChange={handleFileSelected}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                cursor: uploading ? 'wait' : 'pointer',
                transition: 'background-color 0.15s ease'
              }}
            >
              <Upload size={13} />
              <span>{uploading ? 'Uploading...' : value ? 'Replace File' : 'Upload File'}</span>
            </button>

            {value && (
              <>
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 650,
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    borderRadius: 6,
                    textDecoration: 'none'
                  }}
                  title="Open media in new tab"
                >
                  <ExternalLink size={12} />
                  <span>Preview</span>
                </a>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 650,
                    backgroundColor: '#FEF2F2',
                    color: '#DC2626',
                    border: '1px solid #FCA5A5',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                  title="Remove this media"
                >
                  <Trash2 size={12} />
                  <span>Remove</span>
                </button>
              </>
            )}
          </div>

          {/* Upload Status / Alerts */}
          {uploadSuccess && (
            <div style={{ marginTop: 6, fontSize: '0.74rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <Check size={13} /> {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div style={{ marginTop: 6, fontSize: '0.74rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <AlertCircle size={13} /> {uploadError}
            </div>
          )}
        </div>
      </div>

      {/* Direct URL input fallback */}
      {showManualUrl && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            fontSize: '0.84rem',
            boxSizing: 'border-box',
            marginTop: 2
          }}
        />
      )}

      {description && (
        <span style={{ fontSize: '0.72rem', color: '#77728A', display: 'block', marginTop: 2 }}>
          {description}
        </span>
      )}
    </div>
  );
}
