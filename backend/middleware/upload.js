const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.resolve(__dirname, '../uploads/audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strict whitelist of allowed extensions and mimetypes
const ALLOWED_EXTENSIONS = ['.webm', '.wav', '.mp3', '.m4a', '.ogg', '.aac', '.mp4'];

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp3',
  'audio/mpeg',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
  'video/webm' // Chrome MediaRecorder can output video/webm for audio streams
];

// Cryptographically secure storage with unguessable random filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const rawExt = (path.extname(file.originalname) || '.webm').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.webm';
    const randomHex = crypto.randomBytes(24).toString('hex');
    cb(null, `rec_${Date.now()}_${randomHex}${safeExt}`);
  }
});

function fileFilter(req, file, cb) {
  const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
  const ext = (path.extname(file.originalname) || '').toLowerCase();

  const isMimeAllowed = ALLOWED_MIME_TYPES.some(m => m.split(';')[0].trim() === mime);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeAllowed && (isExtAllowed || !ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Security Alert: Unsupported audio format (${file.mimetype}). Accepted formats: WebM, WAV, MP3, M4A.`));
  }
}

const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 40 * 1024 * 1024, // 40 MB max for audio recordings
    files: 1
  },
  fileFilter: fileFilter
});

/**
 * Validates audio file magic bytes (binary file signatures).
 * Matches:
 *  - WebM: 1A 45 DF A3
 *  - WAV: 52 49 46 46 (RIFF) ... 57 41 56 45 (WAVE)
 *  - MP3: 49 44 33 (ID3) or FF FB / FF F3
 *  - M4A/MP4: 66 74 79 70 (ftyp at offset 4)
 *  - Ogg: 4F 67 67 53 (OggS)
 */
function validateAudioMagicBytes(filePath) {
  try {
    const buffer = Buffer.alloc(16);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 16, 0);
    fs.closeSync(fd);

    // WebM: 0x1A, 0x45, 0xDF, 0xA3
    if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
      return true;
    }
    // WAV: 'RIFF' at 0..3 and 'WAVE' at 8..11
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE') {
      return true;
    }
    // MP3 with ID3: 'ID3'
    if (buffer.toString('ascii', 0, 3) === 'ID3') {
      return true;
    }
    // MP3 raw frame header: 0xFF followed by 0xE0..0xFF
    if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
      return true;
    }
    // Ogg: 'OggS'
    if (buffer.toString('ascii', 0, 4) === 'OggS') {
      return true;
    }
    // M4A / MP4: 'ftyp' at bytes 4..8
    if (buffer.toString('ascii', 4, 8) === 'ftyp') {
      return true;
    }

    return false;
  } catch (err) {
    console.error('[Magic Byte Validation Error]:', err.message);
    return false;
  }
}

/**
 * Middleware wrapper that executes multer and verifies magic bytes.
 */
function uploadAudioSecure(fieldName = 'audio') {
  const uploadSingle = multerUpload.single(fieldName);

  return function (req, res, next) {
    uploadSingle(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'Audio file exceeds the 40 MB limit.' });
        }
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (req.file) {
        const isValidSignature = validateAudioMagicBytes(req.file.path);
        if (!isValidSignature) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {}
          return res.status(400).json({
            success: false,
            message: 'Security Alert: Uploaded file signature does not match a valid audio format (WebM, WAV, MP3, M4A).'
          });
        }
      }

      next();
    });
  };
}

module.exports = {
  uploadAudio: multerUpload,
  single: (fieldName) => uploadAudioSecure(fieldName),
  validateAudioMagicBytes
};
