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
const setupRoutes = require('./routes/setup.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const authRoutes = require('./routes/auth.routes');
const superadminRoutes = require('./routes/superadmin.routes');

app.use('/api/pqrs', pqrsRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);

module.exports = app;
