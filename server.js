const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const routes = require('./routes/categories'); // Asegúrate de tener el archivo routes.js
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const compression = require('compression');

const app = express();
const PORT = 4500;

app.use(bodyParser.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect('mongodb+srv://data_user:wY1v50t8fX4lMA85@cluster0.entyyeb.mongodb.net/categories', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Configuración de Winston
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console(), // Log en la consola
    new transports.File({ filename: 'server.log' }) // Log en un archivo
  ]
});

// Middleware para servir archivos estáticos con caché de 1 año
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: '1y' }));

// Middleware para comprimir las respuestas
app.use(compression());

// Middleware para validar el subdominio
app.use(async (req, res, next) => {
  try {
    const subdomain = req.headers['domain'];
    if (!subdomain) {
      return res.status(403).send('No se proporcionó ningún subdominio');
    }
    // Aquí debes implementar la validación del subdominio
    next();
  } catch (error) {
    logger.error('Error al validar el subdominio:', error);
    res.status(500).send('Error al validar el subdominio');
  }
});

// Rutas de la aplicación
app.use('/api', routes);

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal en el servidor!');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
