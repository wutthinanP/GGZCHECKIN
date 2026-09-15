const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'selfies');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname || '.jpg'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'), false);
    }
  },
});

/**
 * Save a base64 data URL to disk and return the relative path.
 * @param {string} base64Data - e.g. "data:image/jpeg;base64,/9j/4AAQ..."
 * @returns {string} relative URL path like "/uploads/selfies/1692345678-abc.jpg"
 */
const saveBase64Image = (base64Data) => {
  if (!base64Data || !base64Data.startsWith('data:image')) return null;

  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return null;

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/selfies/${filename}`;
};

module.exports = { upload, saveBase64Image };
