const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const cmsUploadDir = path.resolve(__dirname, '../uploads/cms');
if (!fs.existsSync(cmsUploadDir)) {
  fs.mkdirSync(cmsUploadDir, { recursive: true });
}

// Strict whitelist for CMS media assets
const ALLOWED_EXTENSIONS = [
  '.mp4', '.webm',
  '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif',
  '.wav', '.mp3', '.ogg', '.m4a'
];

const ALLOWED_MIME_TYPES = [
  'video/mp4', 'video/webm',
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif',
  'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/x-m4a'
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, cmsUploadDir);
  },
  filename: function (req, file, cb) {
    const rawExt = (path.extname(file.originalname) || '').toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.bin';
    const cleanBase = path.basename(file.originalname, rawExt).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const randomHex = crypto.randomBytes(8).toString('hex');
    cb(null, `cms_${Date.now()}_${cleanBase}_${randomHex}${safeExt}`);
  }
});

function fileFilter(req, file, cb) {
  const mime = (file.mimetype || '').toLowerCase().split(';')[0].trim();
  const ext = (path.extname(file.originalname) || '').toLowerCase();

  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(mime);
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);

  if (isMimeAllowed && isExtAllowed) {
    cb(null, true);
  } else {
    cb(new Error(`Security Alert: Unsupported media format (${file.mimetype}). Accepted formats: MP4, WebM, PNG, JPG, WebP, SVG, GIF, WAV, MP3, OGG, M4A.`));
  }
}

const cmsUpload = multer({
  storage: storage,
  limits: {
    fileSize: 65 * 1024 * 1024, // 65 MB max (allows HD video/GIF updates)
    files: 1
  },
  fileFilter: fileFilter
});

function detectFileType(ext, mime) {
  const lowerExt = ext.toLowerCase();
  if (['.mp4', '.webm'].includes(lowerExt) || mime.startsWith('video/')) return 'VIDEO';
  if (lowerExt === '.gif' || mime === 'image/gif') return 'GIF';
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(lowerExt) || mime.startsWith('image/')) return 'IMAGE';
  if (['.wav', '.mp3', '.ogg', '.m4a'].includes(lowerExt) || mime.startsWith('audio/')) return 'AUDIO';
  return 'DOCUMENT';
}

module.exports = {
  cmsUpload,
  detectFileType,
  cmsUploadDir
};
