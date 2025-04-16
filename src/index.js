const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const audioRoutes = require('./routers/audio.routes');
const errorHandler = require('./error/errorHandler');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', audioRoutes);

// Manejo de errores
app.use(errorHandler);

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});

