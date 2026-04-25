const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getSubTreeIds } = require('../services/area.service');
const { calcularFechaMaximaRespuesta, obtenerDiasHabilesPorTipo } = require('../services/fechas.service');

const crearSolicitud = async (req, res) => {
  try {
    const { 
      tipoDocumento, numeroDocumento, nombreCompleto, email, telefono, esVulnerable,
      conceptoMotivo, tipoSolicitud, contenido, anexosUrls
    } = req.body;

    const solicitudResult = await prisma.$transaction(async (tx) => {
      // Upsert: Si existe actualiza, si no, crea
      const usuario = await tx.usuario.upsert({
        where: { numeroDocumento },
        update: { nombreCompleto, email, telefono, esVulnerable },
        create: { tipoDocumento, numeroDocumento, nombreCompleto, email, telefono, esVulnerable }
      });

      // Auto-assign global entity information defined in the Initial Setup.
      const config = await tx.configuracionSistema.findUnique({ where: { id: 1 } });
      const entidadNombreGlobal = config ? config.razonSocial : 'Entidad Principal';
      const entidadCodigoGlobal = 'MAIN-ENT';

      const entidad = await tx.entidad.upsert({
        where: { codigo: entidadCodigoGlobal },
        update: { nombre: entidadNombreGlobal },
        create: { codigo: entidadCodigoGlobal, nombre: entidadNombreGlobal }
      });

      // Lógica de fechas
      const diasHabiles = obtenerDiasHabilesPorTipo(tipoSolicitud);
      const fechaRadicacion = new Date();
      const fechaMaximaRespuesta = calcularFechaMaximaRespuesta(fechaRadicacion, diasHabiles);

      // Generar Radicado AlfaNumérico Unico
      const radicadoBase = `PQR-${fechaRadicacion.getFullYear()}${fechaRadicacion.getMonth() + 1}${fechaRadicacion.getDate()}-${Math.floor(Math.random() * 100000)}`;

      const solicitud = await tx.solicitud.create({
        data: {
          radicadoAlfaNum: radicadoBase,
          tipo: tipoSolicitud,
          conceptoMotivo,
          contenido,
          anexosUrls,
          fechaRadicacion,
          fechaMaximaRespuesta,
          usuarioId: usuario.id,
          entidadId: entidad.id,
        }
      });

      return solicitud;
    });

    res.status(201).json({
      message: 'PQRS radicada exitosamente',
      radicado: solicitudResult.radicadoAlfaNum,
      data: solicitudResult
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error interno al radicar la PQRS', error: error.message });
  }
};

const obtenerSolicitud = async (req, res) => {
  try {
    const { radicado } = req.params;

    const solicitud = await prisma.solicitud.findUnique({
      where: { radicadoAlfaNum: radicado },
      include: {
        usuario: true,
        entidad: true,
        solicitudesHijas: true,
        respuestas: true
      }
    });

    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    res.status(200).json({ data: solicitud });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la solicitud', error: error.message });
  }
};

const getGestionPqrs = async (req, res) => {
  try {
    const { rol, id, areaId } = req.user;
    
    let whereClause = {};
    if (rol === 'AGENTE') {
      whereClause.agenteAsignadoId = id;
    } else if (rol === 'GESTOR') {
      const areasVisibles = await getSubTreeIds(areaId);
      whereClause = {
        OR: [
          { areaAsignadaId: { in: areasVisibles } },
          { agenteAsignadoId: id }
        ]
      };
    }
    // GESTOR reads from target areas. ADMIN / SUPERADMIN have no constraints.

    const solicitudes = await prisma.solicitud.findMany({
      where: whereClause,
      include: {
        usuario: true,
        entidad: true,
        agenteAsignado: { select: { id: true, nombreCompleto: true, email: true } },
        areaAsignada: { select: { id: true, nombre: true } }
      },
      orderBy: { fechaRadicacion: 'desc' }
    });

    res.status(200).json({ data: solicitudes });
  } catch (error) {
    res.status(500).json({ message: 'Error cargando panel de gestión', error: error.message });
  }
};

const asignarPqrs = async (req, res) => {
  try {
    const { id } = req.params;
    const { agenteAsignadoId, areaAsignadaId } = req.body;
    
    const { rol, areaId, id: userId } = req.user;

    // Boundary Enforcer for GESTOR
    if (rol === 'GESTOR') {
      const validAreas = await getSubTreeIds(areaId);
      if (areaAsignadaId && !validAreas.includes(parseInt(areaAsignadaId))) {
        return res.status(403).json({ message: 'No puedes asignar un caso a un Área jerárquicamente superior a la tuya.' });
      }
      if (agenteAsignadoId && parseInt(agenteAsignadoId) !== userId) {
        const agInfo = await prisma.usuario.findUnique({ where: { id: parseInt(agenteAsignadoId) }});
        if (!agInfo || !validAreas.includes(agInfo.areaId)) {
          return res.status(403).json({ message: 'El agente seleccionado no pertenece a tu radio de áreas hijas.'});
        }
      }
    }

    const solicitud = await prisma.solicitud.update({
      where: { id: parseInt(id) },
      data: { 
        agenteAsignadoId: agenteAsignadoId ? parseInt(agenteAsignadoId) : null,
        areaAsignadaId: areaAsignadaId ? parseInt(areaAsignadaId) : null
      }
    });

    res.status(200).json({ message: 'Actualización exitosa', data: solicitud });
  } catch (error) {
    res.status(500).json({ message: 'Error al asignar agente', error: error.message });
  }
}

module.exports = { crearSolicitud, obtenerSolicitud, getGestionPqrs, asignarPqrs };
