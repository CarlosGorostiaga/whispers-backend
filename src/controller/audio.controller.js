const fs = require('fs');
const path = require('path');
const openai = require('../config/openaiClient');

const procesarAudio = async (req, res, next) => {
  try {
    // Log para ver los detalles del archivo (nombre original, MIME type y filename generado)
    console.log('Archivo recibido:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      filename: req.file.filename,
      size: req.file.size
    });

    const audioPath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // Transcribir
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "es"
    });

    const texto = transcription.text;

    // Resumir
    const resumenResponse = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que resume audios de reuniones y juntas en español en puntos clave enumerados, destacando lo mas importante, si ves que algo no tiene sentido intenta encontrarle el sentido a lo que quiere decir"
        },
        {
          role: "user",
          content: `Resume en forma de lista de puntos clave este texto: ${texto}`
        }
      ]
    });

    const resumenTexto = resumenResponse.choices[0].message.content;
    const resumen = resumenTexto.split('\n').filter(line => line.trim() !== '');

    res.json({ resumen });

    fs.unlinkSync(audioPath);
  } catch (error) {
    next(error); // Pasamos el error al manejador
  }
};

module.exports = { procesarAudio };

