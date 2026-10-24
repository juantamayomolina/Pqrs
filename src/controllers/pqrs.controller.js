const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getSubTreeIds } = require('../services/area.service');
const { calcularFechaMaximaRespuesta, obtenerDiasHabilesPorTipo } = require('../services/fechas.service');

const crearSolicitud = async (req, res) => {
  try {
    let {
      tipoDocumento, numeroDocumento, nombreCompleto, email, telefono, esVulnerable,
      conceptoMotivo, tipoSolicitud, contenido
    } = req.body;

    // Castear tipos derivados de FormData
    esVulnerable = esVulnerable === 'true' || esVulnerable === true;

    // Buscar la configuración del Tipo de PQRS en DB
    let tipoConfig = await prisma.tipoPqrs.findFirst({
      where: {
        OR: [
          { codigo: tipoSolicitud ? tipoSolicitud.toUpperCase() : '' },
          { nombre: tipoSolicitud || '' }
        ],
        activo: true
      }
    });

    // Validar obligatoriedad de anexos
    const tieneArchivos = req.files && req.files.length > 0;
    if (tipoConfig && tipoConfig.requiereAnexoObligatorio && !tieneArchivos) {
      const msgError = tipoConfig.mensajeAnexoObligatorio || `Es obligatorio adjuntar soporte documental para tramitar una solicitud de tipo ${tipoConfig.nombre}.`;
      return res.status(400).json({ message: msgError });
    }

    let anexosUrls = null;
    if (tieneArchivos) {
      const paths = req.files.map(f => `/uploads/${f.filename}`);
      anexosUrls = JSON.stringify(paths);
    }

    // Determinar término legal en días hábiles
    const diasHabiles = tipoConfig ? tipoConfig.diasHabiles : obtenerDiasHabilesPorTipo(tipoSolicitud);

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
      const fechaRadicacion = new Date();
      const fechaMaximaRespuesta = calcularFechaMaximaRespuesta(fechaRadicacion, diasHabiles);

      // Generar Radicado AlfaNumérico Unico
      const radicadoBase = `PQR-${fechaRadicacion.getFullYear()}${fechaRadicacion.getMonth() + 1}${fechaRadicacion.getDate()}-${Math.floor(Math.random() * 100000)}`;

      const solicitud = await tx.solicitud.create({
        data: {
          radicadoAlfaNum: radicadoBase,
          tipo: tipoConfig ? tipoConfig.codigo : tipoSolicitud,
          tipoPqrsId: tipoConfig ? tipoConfig.id : null,
          conceptoMotivo,
          contenido,
          anexosUrls,
          fechaRadicacion,
          fechaMaximaRespuesta,
          usuarioId: usuario.id,
          entidadId: entidad.id,
        }
      });

      let detalleExt = `PQRS (${tipoConfig ? tipoConfig.nombre : tipoSolicitud}) ha sido radicada formalmente ante el sistema general.`;
      if (req.files && req.files.length > 0) {
        detalleExt += ` El usuario anexó ${req.files.length} adjuntos como material probatorio / radicación original.`;
      }

      await tx.movimiento.create({
        data: {
          accion: 'CREA_SOLICITUD',
          detalle: detalleExt,
          solicitudId: solicitud.id,
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
        areaAsignada: { select: { id: true, nombre: true } },
        respuestas: true,
        movimientos: {
          orderBy: { fecha: 'asc' },
          include: { autor: { select: { nombreCompleto: true, rol: true } } }
        }
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

    const solicitudActual = await prisma.solicitud.findUnique({ where: { id: parseInt(id) } });
    if (!solicitudActual) return res.status(404).json({ message: 'La solicitud no existe.' });
    if (solicitudActual.estado === 'CERRADO') return res.status(400).json({ message: 'Asignación denegada. El expediente se encuentra cerrado de manera definitiva y es inmutable.' });

    // Boundary Enforcer for GESTOR
    if (rol === 'GESTOR') {
      const validAreas = await getSubTreeIds(areaId);
      if (areaAsignadaId && !validAreas.includes(parseInt(areaAsignadaId))) {
        return res.status(403).json({ message: 'No puedes asignar un caso a un Área jerárquicamente superior a la tuya.' });
      }
      if (agenteAsignadoId && parseInt(agenteAsignadoId) !== userId) {
        const agInfo = await prisma.usuario.findUnique({ where: { id: parseInt(agenteAsignadoId) } });
        if (!agInfo || !validAreas.includes(agInfo.areaId)) {
          return res.status(403).json({ message: 'Error de jerarquía. No puedes re-asignar a un funcionario fuera de tu cadena de mando descendiente.' });
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

    let logMsg = 'Caso desasignado o regresado a estado neutro.';
    if (agenteAsignadoId) {
      const agInfo = await prisma.usuario.findUnique({ where: { id: parseInt(agenteAsignadoId) } });
      logMsg = `Expediente re-asignado al escritorio de: ${agInfo?.nombreCompleto || 'Agente'}`;
    } else if (areaAsignadaId) {
      const arInfo = await prisma.area.findUnique({ where: { id: parseInt(areaAsignadaId) } });
      logMsg = `Expediente trasladado con destino al Área/División: ${arInfo?.nombre || 'Área'}`;
    }

    await prisma.movimiento.create({
      data: {
        accion: 'RE_ASIGNACION',
        detalle: logMsg,
        solicitudId: parseInt(id),
        autorId: userId
      }
    });

    res.status(200).json({ message: 'Actualización exitosa', data: solicitud });
  } catch (error) {
    res.status(500).json({ message: 'Error al asignar agente', error: error.message });
  }
}

const emitirRespuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, contenido } = req.body;
    const { id: userId } = req.user;

    let anexosUrls = null;
    if (req.files && req.files.length > 0) {
      const paths = req.files.map(f => `/uploads/${f.filename}`);
      anexosUrls = JSON.stringify(paths);
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id: parseInt(id) },
      include: { respuestas: true }
    });

    if (!solicitud) return res.status(404).json({ message: 'No encontrada' });
    if (solicitud.estado === 'CERRADO') return res.status(400).json({ message: 'El caso ya se encuentra cerrado estructuralmente.' });

    const ahora = new Date();
    if (tipo === 'PARCIAL') {
      const tieneParcial = solicitud.respuestas.some(r => r.tipo === 'PARCIAL');
      if (tieneParcial) return res.status(400).json({ message: 'Solo te es permitido emitir una única respuesta de carácter PARCIAL según normativa.' });
    }

    if (tipo === 'SOLICITUD_AMPLIACION' || tipo === 'NO_COMPETENCIA') {
      const diffMs = ahora - solicitud.fechaRadicacion;
      const diffDiasCalendario = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // La regla establece 5 días hábiles, se evalúa restrictivamente con un umbral estricto por ahora
      if (diffDiasCalendario > 7) {
        return res.status(403).json({ message: 'Acción bloqueada: Esta opción solo puede seleccionarse dentro de los primeros 5-7 días de recepción del requerimiento original.' });
      }
    }

    let nuevoEstado = solicitud.estado;
    let nuevaFechaCongelacion = solicitud.fechaCongelacion;
    let agenteId = solicitud.agenteAsignadoId;

    if (tipo === 'FINAL' || tipo === 'DESISTIMIENTO_TACITO') {
      nuevoEstado = 'CERRADO';
    } else if (tipo === 'SOLICITUD_AMPLIACION') {
      nuevoEstado = 'ESPERANDO_AMPLIACION';
      nuevaFechaCongelacion = ahora;
    } else if (tipo === 'NO_COMPETENCIA') {
      agenteId = null; // Reboota el control para que caiga en la bandeja del superior(Area) y deba ser re-delegado.
    }

    const respuestaFinal = await prisma.$transaction(async (tx) => {
      const esInterna = tipo === 'NO_COMPETENCIA';
      const radResp = `RTA-${solicitud.radicadoAlfaNum}-${Math.floor(Math.random() * 1000)}`;

      const respuestaDb = await tx.respuesta.create({
        data: {
          radicadoOficio: radResp,
          tipo,
          contenido: contenido || `Mecanismo invocado: ${tipo}`,
          anexosUrls,
          esInterna,
          solicitudId: solicitud.id
        }
      });

      await tx.solicitud.update({
        where: { id: solicitud.id },
        data: {
          estado: nuevoEstado,
          fechaCongelacion: nuevaFechaCongelacion,
          agenteAsignadoId: agenteId
        }
      });

      const anexosTexto = req.files && req.files.length > 0 ? ` (Soportada con ${req.files.length} documentos adjuntos).` : '';
      await tx.movimiento.create({
        data: {
          accion: `RESPUESTA_${tipo}`,
          detalle: `Se generó actuación tipo: ${tipo}.${anexosTexto} [Estado Modificado: ${nuevoEstado}]`,
          solicitudId: solicitud.id,
          autorId: userId
        }
      });

      return respuestaDb;
    });

    res.status(201).json({ message: 'Tramite emitido satisfactoriamente', data: respuestaFinal });
  } catch (err) {
    res.status(500).json({ message: 'Error procesando respuesta', error: err.message });
  }
}

const aportarInformacion = async (req, res) => {
  try {
    const { radicado } = req.params;
    const { contenido } = req.body;

    let anexosUrls = null;
    if (req.files && req.files.length > 0) {
      const paths = req.files.map(f => `/uploads/${f.filename}`);
      anexosUrls = JSON.stringify(paths);
    }

    const solicitud = await prisma.solicitud.findUnique({ where: { radicadoAlfaNum: radicado } });
    if (!solicitud) return res.status(404).json({ message: 'PQRS inválida' });
    if (solicitud.estado !== 'ESPERANDO_AMPLIACION') return res.status(400).json({ message: 'Este radicado no está en fase de ampliación probatoria.' });

    // Matematica legal: Descongelar el SLA reactivando los términos, sumando el delay que se tomó el ciudadano al deadline maximo
    let nuevaFechaMax = solicitud.fechaMaximaRespuesta;
    if (solicitud.fechaCongelacion) {
      const congeladosMs = new Date() - solicitud.fechaCongelacion;
      nuevaFechaMax = new Date(solicitud.fechaMaximaRespuesta.getTime() + congeladosMs);
    }

    const txRes = await prisma.$transaction(async (tx) => {
      const up = await tx.solicitud.update({
        where: { id: solicitud.id },
        data: { estado: 'EN_TRAMITE', fechaCongelacion: null, fechaMaximaRespuesta: nuevaFechaMax }
      });
      const anexosTexto = req.files && req.files.length > 0 ? ` - Aportó ${req.files.length} archivos comprimidos o piezas probatorias adicionales.` : '';
      await tx.movimiento.create({
        data: { accion: 'AMPLIACION_CIUDADANO', detalle: 'El peticionario aportó información adicional referida.' + anexosTexto + ' Plazos formales reactivados en SLA.', solicitudId: solicitud.id }
      });
      if (contenido) {
        await tx.respuesta.create({
          data: { radicadoOficio: `AMPL-${solicitud.radicadoAlfaNum}-${Math.floor(Math.random() * 100)}`, tipo: 'APORTE_CIUDADANO', contenido, anexosUrls, esInterna: false, solicitudId: solicitud.id }
        });
      }
      return up;
    });

    res.status(200).json({ message: 'Ampliación recibida con éxito.', data: txRes });
  } catch (e) {
    res.status(500).json({ message: 'Fallo al procesar aportación temporal', error: e.message });
  }
}

module.exports = { crearSolicitud, obtenerSolicitud, getGestionPqrs, asignarPqrs, emitirRespuesta, aportarInformacion };
