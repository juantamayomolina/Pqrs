const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-pqrs';

const register = async (req, res) => {
  try {
    const { tipoDocumento, numeroDocumento, nombreCompleto, email, telefono, password } = req.body;
    
    if (!numeroDocumento || !password) {
      return res.status(400).json({ message: 'Documento y contraseña son requeridos' });
    }

    const existingUser = await prisma.usuario.findUnique({ where: { numeroDocumento } });
    if (existingUser && existingUser.passwordHash) {
      return res.status(400).json({ message: 'El usuario ya se encuentra registrado con contraseña.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (existingUser) {
      // Setup the password for an existing unpassworded user
      const updatedUser = await prisma.usuario.update({
        where: { numeroDocumento },
        data: { passwordHash, nombreCompleto, email, telefono }
      });
      return res.status(200).json({ message: 'Registro completado exitosamente', user: { id: updatedUser.id, rol: updatedUser.rol } });
    }

    const newUser = await prisma.usuario.create({
      data: {
        tipoDocumento,
        numeroDocumento,
        nombreCompleto,
        email,
        telefono,
        passwordHash,
        rol: 'USUARIO_EXTERNO'
      }
    });

    res.status(201).json({ message: 'Usuario registrado', user: { id: newUser.id, rol: newUser.rol } });
  } catch (error) {
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { numeroDocumento, password } = req.body;
    const user = await prisma.usuario.findUnique({ where: { numeroDocumento } });

    if (!user || !user.passwordHash) {
      return res.status(404).json({ message: 'Usuario no encontrado o no tiene una cuenta activa' });
    }

    if (user.activo === false) {
      return res.status(401).json({ message: 'Su cuenta ha sido desactivada temporal o permanentemente por administración.' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        numeroDocumento: user.numeroDocumento, 
        rol: user.rol, 
        nombreCompleto: user.nombreCompleto,
        areaId: user.areaId
      },
      SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Sesión iniciada',
      token,
      user: { 
        id: user.id, 
        nombreCompleto: user.nombreCompleto, 
        rol: user.rol, 
        numeroDocumento: user.numeroDocumento, 
        tipoDocumento: user.tipoDocumento, 
        email: user.email,
        areaId: user.areaId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error de servidor al iniciar sesión', error: error.message });
  }
};

// Endpoint utilitario para crear el primer ADMIN
const createAdmin = async (req, res) => {
  try {
    const { numeroDocumento, password, nombreCompleto, rolParam } = req.body;
    if (!password) return res.status(400).json({message: 'Especifique contraseña'});
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const asignativeRol = rolParam || 'ADMIN';
    
    const admin = await prisma.usuario.upsert({
      where: { numeroDocumento },
      update: { passwordHash, rol: asignativeRol },
      create: { tipoDocumento: 'CC', numeroDocumento, nombreCompleto, passwordHash, rol: asignativeRol }
    });
    
    res.status(201).json({ message: 'Cuenta interna configurada', admin });
  } catch (err) {
    res.status(500).json({ message: 'Error creando admin', error: err.message });
  }
}

module.exports = { register, login, createAdmin };
