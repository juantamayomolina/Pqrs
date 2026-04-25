const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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

module.exports = { getUsuarioByDoc, getAgentes, getAssignees };
