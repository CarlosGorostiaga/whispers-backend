const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const openai = require('../config/openaiClient');

const procesarAudio = async (req, res, next) => {
  try {
    const audioPath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // 2. Validación de duración (10 min = 600 s) con manejo de errores
    let duration = 0;
    try {
      duration = await getAudioDurationInSeconds(audioPath);
    } catch (err) {
      console.warn('No se pudo leer la duración del audio, omitiendo validación:', err);
    }
    if (duration > 10 * 60) {
      fs.unlinkSync(audioPath);
      return res.status(400).json({ error: 'El audio no puede durar más de 10 minutos.' });
    }

    // 3. Transcribir
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "es"
    });
    const texto = transcription.text;

    // 4. Resumir
    const resumenResponse = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que resume audios de reuniones y juntas en español en puntos clave enumerados, destacando lo más importante."
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

    // 5. Limpieza
    fs.unlinkSync(audioPath);
  } catch (error) {
    // Si es error de duración no encontrada
    if (error.message && error.message.includes('No duration found')) {
      return res.status(400).json({ error: 'No se pudo procesar la duración del audio. Asegúrate de enviar un fichero válido.' });
    }
    next(error);
  }
};

module.exports = { procesarAudio };


