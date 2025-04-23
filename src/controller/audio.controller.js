const fs = require('fs');
const path = require('path');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const openai = require('../config/openaiClient');

const procesarAudio = async (req, res, next) => {
  try {
    const audioPath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // 1) Logs para verificar archivo en disco
    console.log('>> Audio en disco:', audioPath);
    const stats = fs.statSync(audioPath);
    console.log(`   → Tamaño en bytes: ${stats.size}`);
    if (stats.size === 0) {
      throw new Error('Archivo vacío');
    }

    // 2) Validación de duración (10 min = 600 s), ignorando errores de metadata
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

    // 3) Transcripción con Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "es"
    });
    console.log('>> Transcripción Whisper completa:', transcription);
    console.log('>> transcription.text:', JSON.stringify(transcription.text));
    const texto = transcription.text;

    // 4) Resumen con GPT-4.1-nano
    const resumenResponse = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "Eres un asistente que resume audios de reuniones y juntas en español en puntos clave enumerados, destacando lo más importante, usa una lenguaje llamativo y empresarial , si ves que algo no tiene sentido intenta encontrarle el sentido los mas fielmente posible"
        },
        {
          role: "user",
          content: `Resume en forma de lista de puntos clave este texto: ${texto}`
        }
      ]
    });

    const resumenTexto = resumenResponse.choices[0].message.content;
    const resumen = resumenTexto
      .split('\n')
      .filter(line => line.trim() !== '');

    // 5) Devuelve el resumen
    res.json({ resumen });

    // 6) Limpieza: borra el archivo temporal
    fs.unlinkSync(audioPath);

  } catch (error) {
    // Captura error de archivo vacío o duration metadata
    if (error.message && (error.message === 'Archivo vacío' || error.message.includes('No duration found'))) {
      return res.status(400).json({ error: 'No se pudo procesar el audio. Asegúrate de enviar un fichero válido.' });
    }
    next(error);
  }
};

module.exports = { procesarAudio };



