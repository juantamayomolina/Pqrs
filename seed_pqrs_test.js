const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateAlphanumeric = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const addBusinessDays = (date, days) => {
  let result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const isValidDay = result.getDay() !== 0 && result.getDay() !== 6;
    if (isValidDay) added++;
  }
  return result;
};

const main = async () => {
  console.log('Iniciando carga de datos de prueba para PQRS...');

  try {
    // 1. Obtener o crear una entidad
    let entidad = await prisma.entidad.findFirst();
    if (!entidad) {
      entidad = await prisma.entidad.create({
        data: {
          nombre: 'Entidad de Pruebas',
          codigo: 'ENT-TEST',
          emailContacto: 'contacto@entidadtest.com'
        }
      });
      console.log('Entidad por defecto creada.');
    } else {
      console.log('Usando entidad existente:', entidad.nombre);
    }

    // 2. Crear 5 usuarios externos
    const usuariosNuevos = [];
    for (let i = 1; i <= 5; i++) {
      const numeroDocumento = `101010${Math.floor(Math.random() * 10000)}${i}`;
      const usuario = await prisma.usuario.upsert({
        where: { numeroDocumento },
        update: {},
        create: {
          tipoDocumento: 'CC',
          numeroDocumento,
          nombreCompleto: `Usuario Externo Test ${i}`,
          email: `usuario.test${i}@ejemplo.com`,
          telefono: `300123456${i}`,
          esVulnerable: false,
          rol: 'USUARIO_EXTERNO'
        }
      });
      usuariosNuevos.push(usuario);
    }
    console.log(`Se insertaron/verificaron ${usuariosNuevos.length} usuarios externos.`);

    // 3. Crear 20 PQRS (4 por usuario)
    const fechaRadicacion = new Date('2026-05-13T08:00:00Z');
    let pqrsAñadidas = 0;

    const tipos = ['PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA'];

    for (const usuario of usuariosNuevos) {
      for (let j = 1; j <= 4; j++) {
        const radicadoAlfaNum = `PQR-${generateAlphanumeric()}`;
        const tipoRandom = tipos[Math.floor(Math.random() * tipos.length)];
        
        // Calcular fecha maxima de respuesta, asumiendo 15 dias habiles para una peticion estándar
        const fechaMaximaRespuesta = addBusinessDays(fechaRadicacion, 15);

        await prisma.solicitud.create({
          data: {
            radicadoAlfaNum,
            usuarioId: usuario.id,
            entidadId: entidad.id,
            conceptoMotivo: `Prueba de respuesta masiva - ${tipoRandom}`,
            tipo: tipoRandom,
            contenido: `Este es un texto de prueba para el flujo de respostas y validación. Creado para el usuario ${usuario.nombreCompleto}.`,
            fechaRadicacion,
            fechaMaximaRespuesta,
            estado: 'ABIERTO'
          }
        });
        pqrsAñadidas++;
      }
    }
    console.log(`Se insertaron con éxito ${pqrsAñadidas} casos de PQRS con fecha de hoy.`);

  } catch (error) {
    console.error('Error poblando base de datos:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Finalizado.');
  }
};

main();
