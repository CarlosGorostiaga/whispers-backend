const express    = require('express');
const multer     = require('multer');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const { procesarAudio } = require('../controller/audio.controller');

// 1. Rate‑limit: 3 peticiones cada 3 horas por IP
const uploadLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000,  // 3 horas
  max: 3,
  message: { error: 'Solo puedes subir 2 audios cada 3 horas.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// MIME types permitidos "puro" (sin codecs)
const allowedMimeTypes = [
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/oga',
  'audio/ogg',
  'audio/wav',
  'audio/webm'
];

// Extensiones según MIME puro
const extensionForMime = {
  'audio/flac': 'flac',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/mp3': 'mp3',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mpeg',
  'audio/mpga': 'mpga',
  'audio/oga': 'oga',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'webm'
};

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    // 1) Limpiamos cualquier ";codecs=..."  
    const pureMime = file.mimetype.split(';')[0].trim();
    // 2) Sacamos la extensión; si no existe, forzamos .webm
    const ext = extensionForMime[pureMime] || 'webm';
    cb(null, `${Date.now()}-grabacion.${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const pureMime = file.mimetype.split(';')[0].trim();
  console.log('>> Archivo recibido con mimeType:', file.mimetype, '→ pureMime:', pureMime);

  if (allowedMimeTypes.includes(pureMime)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Formato ${pureMime} no permitido. Usa uno de: ${allowedMimeTypes.join(', ')}`
    ), false);
  }
};

const upload = multer({ storage, fileFilter });
const router = express.Router();

router.post(
  '/audio',
  uploadLimiter,
  upload.single('audio'),
  procesarAudio
);

module.exports = router;


