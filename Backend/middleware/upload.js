const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { isS3Enabled } = require('../services/s3Service');

const uploadRoot = path.join(__dirname, '..', 'uploads', 'battles');

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const memoryStorage = multer.memoryStorage();

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${req.params.id}-${Date.now()}${safeExt}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image screenshots are allowed'));
  }
  return cb(null, true);
};

/** Memory storage when S3 is enabled; local disk otherwise (dev fallback). */
const uploadBattleScreenshot = multer({
  storage: isS3Enabled() ? memoryStorage : diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single('screenshot');

module.exports = { uploadBattleScreenshot, uploadRoot };
