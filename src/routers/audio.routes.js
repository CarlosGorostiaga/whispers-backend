const express = require('express');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { procesarAudio } = require('../controller/audio.controller');



// 1. Rate‑limit: 2 peticiones cada 3 horas por IP
const uploadLimiter = rateLimit({
  windowMs: 3 * 60 * 60 * 1000,  // 3 horas
  max: 2,
  message: { error: 'Solo puedes subir 2 audios cada 3 horas.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lista de MIME types permitidos
const allowedMimeTypes = [
  'audio/flac',
  'audio/m4a',
  'audio/x-m4a', // Para iPhone
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/oga',
  'audio/ogg',
  'audio/wav',
  'audio/webm'
];

// Mapeo para asignar la extensión correcta según el MIME type
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
    const ext = extensionForMime[file.mimetype] || 'bin';
    cb(null, Date.now() + '-grabacion.' + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Por favor, sube un audio válido.'), false);
  }
};

const upload = multer({ storage, fileFilter });

const router = express.Router();

// Aplicamos el rate limiter Y luego Multer + controlador
router.post(
  '/audio',
  uploadLimiter,
  upload.single('audio'),
  procesarAudio
);

module.exports = router;
