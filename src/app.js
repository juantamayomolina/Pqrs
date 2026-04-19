const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API PQRS running' });
});

// Rutas de negocio
const pqrsRoutes = require('./routes/pqrs.routes');
app.use('/api/pqrs', pqrsRoutes);

module.exports = app;
