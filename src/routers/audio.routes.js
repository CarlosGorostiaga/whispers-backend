const express = require('express');
const multer = require('multer');
const path = require('path');
const { procesarAudio } = require('../controller/audio.controller');

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
    // Obtenemos la extensión basada en el MIME type real del archivo
    const ext = extensionForMime[file.mimetype] || 'bin';
    // Arma el nombre usando la extensión adecuada (por ejemplo, 1744789070519-grabacion.m4a)
    cb(null, Date.now() + '-grabacion.' + ext);
  }
});

// Filtro de archivos de audio
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Por favor, sube un audio válido.'), false);
  }
};

const upload = multer({ storage, fileFilter });

const router = express.Router();

// Ruta para procesar el audio
router.post('/audio', upload.single('audio'), procesarAudio);

module.exports = router;
