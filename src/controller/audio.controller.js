const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { getAudioDurationInSeconds } = require('get-audio-duration');
const openai = require('../config/openaiClient');

const TRANSCRIBE_URL = process.env.TRANSCRIBE_URL || 'http://localhost:8000/transcribe';

const procesarAudio = async (req, res, next) => {
  try {
    const audioPath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // 1) Validar duración máxima (10 min)
    const duration = await getAudioDurationInSeconds(audioPath);
    if (duration > 10 * 60) {
      fs.unlinkSync(audioPath);
      return res.status(400).json({ error: 'El audio no puede durar más de 10 minutos.' });
    }

    // 2) Transcripción con microservicio FastAPI
    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath), req.file.filename);

    const apiResp = await axios.post(TRANSCRIBE_URL, form, {
      headers: form.getHeaders()
    });
    const texto = apiResp.data.text;

    // 3) Resumen con OpenAI
    const resumenResponse = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        { role: 'system',
          content: 'Eres un asistente que resume audios de reuniones en español en puntos clave.' 
        },
        { role: 'user',
          content: `Resume en forma de lista de puntos clave este texto:\n\n${texto}`
        }
      ]
    });

    const resumenTexto = resumenResponse.choices[0].message.content;
    const resumen = resumenTexto
      .split('\n')
      .map(l => l.trim())
      .filter(l => l);

    res.json({ resumen });
    fs.unlinkSync(audioPath);
  } catch (err) {
    next(err);
  }
};

module.exports = { procesarAudio };


