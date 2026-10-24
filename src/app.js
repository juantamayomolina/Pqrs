const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
const areaRoutes = require('./routes/area.routes');
const tipoPqrsRoutes = require('./routes/tipoPqrs.routes');

app.use('/api/pqrs', pqrsRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/tipos-pqrs', tipoPqrsRoutes);

module.exports = app;

