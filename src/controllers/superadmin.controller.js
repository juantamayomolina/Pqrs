const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista estricta de mapeo para evitar colisiones a otras dbs (si las hubiera) y garantizar la capa de seguridad.
const ALLOWED_MODELS = ['usuario', 'entidad', 'solicitud', 'configuracionSistema', 'area'];

const getTablas = (req, res) => {
  res.status(200).json({ data: ALLOWED_MODELS });
};

const getRegistros = async (req, res) => {
  try {
    const { tabla } = req.params;
    if (!ALLOWED_MODELS.includes(tabla)) return res.status(403).json({ message: 'Tabla protegida' });
    
    const data = await prisma[tabla].findMany();
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: 'Error recuperando registros', error: error.message });
  }
};

const createRegistro = async (req, res) => {
  try {
    const { tabla } = req.params;
    if (!ALLOWED_MODELS.includes(tabla)) return res.status(403).json({ message: 'Acceso denegado a la tabla' });
    
    // Delete potential payload noise usually passed by forms accidentally
    const payload = {...req.body};
    delete payload.id;

    // Notice: if creating users directly via CRUD we inject the string literally.
    // It is recommended for SUPERADMIN to just know hashes if dealing with raw passwords directly.
    const data = await prisma[tabla].create({ data: payload });
    res.status(201).json({ data, message: 'Fila creada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error insertando fila', error: error.message });
  }
};

const updateRegistro = async (req, res) => {
  try {
    const { tabla, id } = req.params;
    if (!ALLOWED_MODELS.includes(tabla)) return res.status(403).json({ message: 'Control de tabla denegado' });

    let parsedId = parseInt(id);
    const payload = {...req.body};
    delete payload.id; // avoid mutating primary keys arbitrarily

    const data = await prisma[tabla].update({
      where: { id: parsedId },
      data: payload
    });
    res.status(200).json({ data, message: 'El registro técnico ha sido actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Avería durante la actualización', error: error.message });
  }
};

const deleteRegistro = async (req, res) => {
  try {
    const { tabla, id } = req.params;
    if (!ALLOWED_MODELS.includes(tabla)) return res.status(403).json({ message: 'Operación denegada en tabla' });

    let parsedId = parseInt(id);
    await prisma[tabla].delete({ where: { id: parsedId } });
    res.status(200).json({ message: 'Instancia eliminada de forma permanente y recursiva' });
  } catch (error) {
    res.status(500).json({ message: 'La tabla advierte una limitante de integridad referencial. Imposible el borrado.'});
  }
};

module.exports = { getTablas, getRegistros, createRegistro, updateRegistro, deleteRegistro };
