const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { getSubTreeIds } = require('../services/area.service');

const getUsuarioByDoc = async (req, res) => {
  try {
    const { tipoDocumento, numeroDocumento } = req.query;
    
    if (!tipoDocumento || !numeroDocumento) {
      return res.status(400).json({ message: 'Faltan parámetros de búsqueda.' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { numeroDocumento }
    });

    if (usuario && usuario.tipoDocumento === tipoDocumento) {
      return res.status(200).json({ data: usuario });
    }

    return res.status(404).json({ message: 'Usuario no encontrado.' });
  } catch (error) {
    console.error('Error buscando usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getAgentes = async (req, res) => {
  try {
    const agentes = await prisma.usuario.findMany({
      where: { rol: { in: ['ADMIN', 'AGENTE', 'GESTOR'] } },
      select: { id: true, nombreCompleto: true, email: true, rol: true }
    });
    res.status(200).json({ data: agentes });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando lista de agentes.' });
  }
}

const getAssignees = async (req, res) => {
  try {
    const { rol, areaId } = req.user;
    
    let validAreaIds = [];
    if (rol === 'GESTOR') {
      validAreaIds = await getSubTreeIds(areaId);
    } else {
      const allAreas = await prisma.area.findMany({ select: { id: true }});
      validAreaIds = allAreas.map(a => a.id);
    }

    const areas = await prisma.area.findMany({
      where: { id: { in: validAreaIds } }
    });
    
    const usuarios = await prisma.usuario.findMany({
      where: { 
        areaId: { in: validAreaIds },
        rol: { in: ['AGENTE', 'GESTOR', 'ADMIN'] }
      },
      select: { id: true, nombreCompleto: true, email: true, rol: true, areaId: true }
    });

    res.status(200).json({ data: { areas, usuarios } });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando nodos', error: error.message });
  }
}

const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        area: { select: { nombre: true } },
        _count: { select: { solicitudes: true, solicitudesAsignadas: true, movimientosRealizados: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando usuarios.', error: error.message });
  }
};

const createUsuario = async (req, res) => {
  try {
    const { tipoDocumento, numeroDocumento, nombreCompleto, email, telefono, esFuncionario, rol, areaId } = req.body;
    
    // Verificamos existencia
    const existente = await prisma.usuario.findUnique({ where: { numeroDocumento } });
    if (existente) return res.status(400).json({ message: 'El usuario ya existe con ese documento.' });

    // Autogenerar contraseña
    const autoPassword = `Pqrs${new Date().getFullYear()}*`;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(autoPassword, salt);

    const dataUser = {
      tipoDocumento,
      numeroDocumento,
      nombreCompleto,
      email,
      telefono,
      passwordHash,
      activo: true,
      rol: esFuncionario ? rol : 'USUARIO_EXTERNO',
      areaId: esFuncionario && areaId ? parseInt(areaId) : null
    };

    const newUser = await prisma.usuario.create({ data: dataUser });
    res.status(201).json({ message: 'Usuario creado', data: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creando usuario', error: error.message });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoDocumento, numeroDocumento, nombreCompleto, email, telefono, esFuncionario, rol, areaId } = req.body;

    const dataUser = {
      tipoDocumento,
      numeroDocumento,
      nombreCompleto,
      email,
      telefono,
      rol: esFuncionario ? rol : 'USUARIO_EXTERNO',
      areaId: esFuncionario && areaId ? parseInt(areaId) : null
    };

    const updatedUser = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: dataUser
    });
    
    res.status(200).json({ message: 'Usuario actualizado', data: updatedUser });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'El número de documento ya está en uso por otro usuario.' });
    res.status(500).json({ message: 'Error actualizando usuario', error: error.message });
  }
};

const toggleUsuarioActivo = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ message: 'No encontrado' });

    // En lugar de borrar, activamos o desactivamos
    const updatedUser = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { activo: !user.activo }
    });
    
    res.status(200).json({ message: updatedUser.activo ? 'Usuario reactivado' : 'Usuario desactivado' });
  } catch (error) {
    res.status(500).json({ message: 'Error cambiando estado', error: error.message });
  }
};

module.exports = { 
  getUsuarioByDoc, 
  getAgentes, 
  getAssignees,
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleUsuarioActivo
};
