const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtener todos los tipos de PQRS activos (para el formulario de radicación pública)
 */
const getTiposActivos = async (req, res) => {
  try {
    const tipos = await prisma.tipoPqrs.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' }
    });
    res.status(200).json({ data: tipos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tipos de PQRS activos', error: error.message });
  }
};

/**
 * Obtener todos los tipos de PQRS (activos e inactivos) para gestión de administradores
 */
const getTiposAdmin = async (req, res) => {
  try {
    const tipos = await prisma.tipoPqrs.findMany({
      orderBy: { id: 'asc' }
    });
    res.status(200).json({ data: tipos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al listar tipos de PQRS para administración', error: error.message });
  }
};

/**
 * Crear un nuevo tipo de PQRS personalizado
 */
const crearTipoPqrs = async (req, res) => {
  try {
    let {
      codigo,
      nombre,
      descripcion,
      diasHabiles,
      requiereAnexoObligatorio,
      mensajeAnexoObligatorio
    } = req.body;

    if (!codigo || !nombre || diasHabiles === undefined || diasHabiles === null) {
      return res.status(400).json({ message: 'Los campos código, nombre y días hábiles son obligatorios.' });
    }

    codigo = codigo.trim().toUpperCase().replace(/\s+/g, '_');
    const diasNum = parseInt(diasHabiles, 10);
    if (isNaN(diasNum) || diasNum <= 0) {
      return res.status(400).json({ message: 'El término en días hábiles debe ser un número entero mayor a 0.' });
    }

    const existe = await prisma.tipoPqrs.findUnique({ where: { codigo } });
    if (existe) {
      return res.status(400).json({ message: `Ya existe un tipo de PQRS registrado con el código [${codigo}].` });
    }

    const requiereAnexo = requiereAnexoObligatorio === true || requiereAnexoObligatorio === 'true';

    const nuevoTipo = await prisma.tipoPqrs.create({
      data: {
        codigo,
        nombre: nombre.trim(),
        descripcion: descripcion ? descripcion.trim() : null,
        diasHabiles: diasNum,
        requiereAnexoObligatorio: requiereAnexo,
        mensajeAnexoObligatorio: requiereAnexo && mensajeAnexoObligatorio ? mensajeAnexoObligatorio.trim() : (requiereAnexo ? `Es obligatorio adjuntar material probatorio para tramitar ${nombre.trim()}.` : null),
        activo: true
      }
    });

    res.status(201).json({ message: 'Tipo de PQRS creado exitosamente', data: nuevoTipo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el tipo de PQRS', error: error.message });
  }
};

/**
 * Actualizar un tipo de PQRS existente
 */
const actualizarTipoPqrs = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      nombre,
      descripcion,
      diasHabiles,
      requiereAnexoObligatorio,
      mensajeAnexoObligatorio,
      activo
    } = req.body;

    const tipoExistente = await prisma.tipoPqrs.findUnique({ where: { id: parseInt(id, 10) } });
    if (!tipoExistente) {
      return res.status(404).json({ message: 'El tipo de PQRS especificado no existe.' });
    }

    const diasNum = parseInt(diasHabiles, 10);
    if (isNaN(diasNum) || diasNum <= 0) {
      return res.status(400).json({ message: 'El término en días hábiles debe ser un número mayor a 0.' });
    }

    const requiereAnexo = requiereAnexoObligatorio === true || requiereAnexoObligatorio === 'true';

    const tipoActualizado = await prisma.tipoPqrs.update({
      where: { id: parseInt(id, 10) },
      data: {
        nombre: nombre ? nombre.trim() : tipoExistente.nombre,
        descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : tipoExistente.descripcion,
        diasHabiles: diasNum,
        requiereAnexoObligatorio: requiereAnexo,
        mensajeAnexoObligatorio: requiereAnexo ? (mensajeAnexoObligatorio ? mensajeAnexoObligatorio.trim() : `Es obligatorio adjuntar material probatorio para tramitar ${nombre.trim()}.`) : null,
        activo: activo !== undefined ? (activo === true || activo === 'true') : tipoExistente.activo
      }
    });

    res.status(200).json({ message: 'Tipo de PQRS actualizado exitosamente', data: tipoActualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el tipo de PQRS', error: error.message });
  }
};

/**
 * Conmutar estado activo/inactivo (Soft delete)
 */
const toggleEstadoTipoPqrs = async (req, res) => {
  try {
    const { id } = req.params;

    const tipo = await prisma.tipoPqrs.findUnique({ where: { id: parseInt(id, 10) } });
    if (!tipo) {
      return res.status(404).json({ message: 'El tipo de PQRS no existe.' });
    }

    const actualizado = await prisma.tipoPqrs.update({
      where: { id: parseInt(id, 10) },
      data: { activo: !tipo.activo }
    });

    res.status(200).json({
      message: `El tipo de PQRS fue ${actualizado.activo ? 'activado' : 'desactivado'} con éxito.`,
      data: actualizado
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al conmutar estado del tipo de PQRS', error: error.message });
  }
};

module.exports = {
  getTiposActivos,
  getTiposAdmin,
  crearTipoPqrs,
  actualizarTipoPqrs,
  toggleEstadoTipoPqrs
};
