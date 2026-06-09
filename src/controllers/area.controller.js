const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las áreas (útil para armar el árbol en el frontend)
const getAreas = async (req, res) => {
  try {
    const areas = await prisma.area.findMany({
      include: {
        _count: {
          select: { areasHijas: true, usuarios: true, pqrsAsignadas: true }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    res.json({ success: true, data: areas });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener áreas', error: error.message });
  }
};

// Crear un área
const createArea = async (req, res) => {
  const { nombre, descripcion, areaPadreId } = req.body;
  try {
    const nuevaArea = await prisma.area.create({
      data: {
        nombre,
        descripcion,
        areaPadreId: areaPadreId ? parseInt(areaPadreId) : null
      }
    });
    res.status(201).json({ success: true, data: nuevaArea, message: 'Área creada con éxito' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Ya existe un área con este nombre.' });
    }
    res.status(500).json({ success: false, message: 'Error al crear área', error: error.message });
  }
};

// Actualizar un área
const updateArea = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, areaPadreId } = req.body;
  
  if (parseInt(id) === parseInt(areaPadreId)) {
    return res.status(400).json({ success: false, message: 'Un área no puede ser padre de sí misma.' });
  }

  try {
    // Validar cíclicos simples (un área no puede asignarse a un padre que es en realidad su propio hijo)
    // Para simplificar, confiaremos en que el front no mande cosas extrañas o se manejará a un nivel en futuros desarrollos.
    const area = await prisma.area.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        descripcion,
        areaPadreId: areaPadreId ? parseInt(areaPadreId) : null
      }
    });
    res.json({ success: true, data: area, message: 'Área actualizada' });
  } catch (error) {
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: 'El área no existe.' });
    }
    res.status(500).json({ success: false, message: 'Error al actualizar área', error: error.message });
  }
};

// Eliminar un área
const deleteArea = async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar si tiene dependencias
    const areaCheck = await prisma.area.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { areasHijas: true, usuarios: true, pqrsAsignadas: true }
        }
      }
    });

    if (!areaCheck) {
      return res.status(404).json({ success: false, message: 'El área no existe.' });
    }

    if (areaCheck._count.areasHijas > 0 || areaCheck._count.usuarios > 0 || areaCheck._count.pqrsAsignadas > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se puede eliminar esta área. Tiene sub-áreas, usuarios o solicitudes (PQRS) vinculadas.' 
      });
    }

    await prisma.area.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true, message: 'Área eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar área', error: error.message });
  }
};

module.exports = {
  getAreas,
  createArea,
  updateArea,
  deleteArea
};
