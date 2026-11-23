import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Upload, CheckCircle2, AlertCircle, FileAudio, Loader2 } from 'lucide-react';

export default function AudioRecorderUploader({ taskId, onAudioSubmitted, disabled = false }) {
  const [mode, setMode] = useState('record'); // 'record' | 'upload'
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFileUrl, setUploadFileUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notes, setNotes] = useState('');

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up media streams and URLs on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (uploadFileUrl) URL.revokeObjectURL(uploadFileUrl);
    };
  }, [audioUrl, uploadFileUrl]);

  // Start in-browser recording
  const startRecording = async () => {
    try {
      setErrorMessage('');
      chunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      setErrorMessage('Microphone access denied or unavailable. You can use the "Upload Audio File" option below instead.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Reset recording
  const handleReset = () => {
    if (isRecording) stopRecording();
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setUploadFile(null);
    if (uploadFileUrl) URL.revokeObjectURL(uploadFileUrl);
    setUploadFileUrl(null);
    setErrorMessage('');
  };

  // Handle file picker selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Audio file size exceeds the 25MB limit.');
      return;
    }

    setErrorMessage('');
    setUploadFile(file);
    const url = URL.createObjectURL(file);
    setUploadFileUrl(url);
  };

  // Submit audio to backend
  const handleSubmit = async () => {
    const fileToSend = mode === 'record' ? audioBlob : uploadFile;
    if (!fileToSend) {
      setErrorMessage('Please record or select an audio file first.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const formData = new FormData();
      if (mode === 'record') {
        const ext = audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
        formData.append('audio', fileToSend, `vocal-phrase-recording-${Date.now()}.${ext}`);
        formData.append('duration_seconds', recordingSeconds.toString());
      } else {
        formData.append('audio', fileToSend, fileToSend.name);
      }
      formData.append('notes', notes.trim() || 'Vocal breath phrase demonstration');
      formData.append('metadata', JSON.stringify({
        source: mode,
        submission_timestamp: new Date().toISOString()
      }));

      if (onAudioSubmitted) {
        await onAudioSubmitted(formData);
      }
      handleReset();
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Failed to upload audio recording.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-recorder-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setMode('record'); handleReset(); }}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: mode === 'record' ? '1.5px solid #7C3AED' : '1px solid #EAE5F3',
              backgroundColor: mode === 'record' ? '#F4F0FF' : '#FFFFFF',
              color: mode === 'record' ? '#191B35' : '#77728A',
              fontWeight: mode === 'record' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Mic size={14} />
            <span>Record Voice</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('upload'); handleReset(); }}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: mode === 'upload' ? '1.5px solid #7C3AED' : '1px solid #EAE5F3',
              backgroundColor: mode === 'upload' ? '#F4F0FF' : '#FFFFFF',
              color: mode === 'upload' ? '#191B35' : '#77728A',
              fontWeight: mode === 'upload' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            <span>Upload File</span>
          </button>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#77728A' }}>
          Formats: MP3, WAV, M4A, WebM (Max 25MB)
        </span>
      </div>

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '10px',
          color: '#991B1B',
          fontSize: '0.82rem',
          marginBottom: '14px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* RECORD MODE */}
      {mode === 'record' && (
        <div style={{ textAlign: 'center', padding: '16px 10px' }}>
          {!audioUrl && !isRecording && (
            <div>
              <p style={{ fontSize: '0.86rem', color: '#77728A', margin: '0 0 14px 0' }}>
                Position yourself comfortably, sing your assigned musical phrase with mindful breath support, and click below to record.
              </p>
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled}
                style={{
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  backgroundColor: '#7C3AED',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)'
                }}
              >
                <Mic size={18} />
                <span>Start Microphone Recording</span>
              </button>
            </div>
          )}

          {isRecording && (
            <div>
              <div style={{ marginBottom: '12px' }}>
                <div className="recording-live-indicator">
                  <span className="recording-pulse-dot" />
                  <span>RECORDING LIVE: {formatSeconds(recordingSeconds)}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#77728A', margin: '0 0 14px 0' }}>
                Sing phrase smoothly with sustained airflow. Click stop when finished.
              </p>
              <button
                type="button"
                onClick={stopRecording}
                style={{
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.25)'
                }}
              >
                <Square size={16} />
                <span>Stop Recording</span>
              </button>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#191B35', display: 'block', marginBottom: '8px' }}>
                  Recording Preview ({formatSeconds(recordingSeconds)})
                </span>
                <audio controls src={audioUrl} style={{ width: '100%', maxWidth: '450px', height: '40px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAE5F3',
                    color: '#77728A',
                    fontSize: '0.8rem',
                    fontWeight: 650,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Re-record</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UPLOAD MODE */}
      {mode === 'upload' && (
        <div style={{ textAlign: 'center', padding: '16px 10px' }}>
          {!uploadFile ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.aac"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '2px dashed #9690A7',
                  color: '#191B35',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                  maxWidth: '380px'
                }}
              >
                <FileAudio size={28} color="#7C3AED" />
                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Browse Audio File</span>
                <span style={{ fontSize: '0.74rem', color: '#77728A' }}>Select MP3, WAV, M4A or WebM file from your device</span>
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
                <FileAudio size={18} color="#7C3AED" />
                <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#191B35' }}>{uploadFile.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#77728A' }}>({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <audio controls src={uploadFileUrl} style={{ width: '100%', maxWidth: '450px', height: '40px', marginBottom: '12px' }} />
              <div>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAE5F3',
                    color: '#77728A',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submission notes and Submit Button */}
      {(audioUrl || uploadFile) && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #EAE5F3' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 650, color: '#191B35', marginBottom: '4px' }}>
              Add Practice Notes for Teacher (Optional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Practised with Appoggio focus on Phrase 1-4. Recorded at moderate tempo."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #EAE5F3',
                fontSize: '0.82rem',
                color: '#191B35',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || disabled}
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 750,
                fontSize: '0.86rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(124, 58, 237, 0.2)'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-animate" />
                  <span>Uploading to Secure Storage...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Submit Recording for Review</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
