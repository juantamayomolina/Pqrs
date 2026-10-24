const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tiposBase = [
  {
    codigo: 'PETICION',
    nombre: 'Petición General',
    descripcion: 'Solicitud para requerir la intervención de la entidad o el reconocimiento de un derecho.',
    diasHabiles: 15,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: null,
    activo: true
  },
  {
    codigo: 'QUEJA',
    nombre: 'Queja',
    descripcion: 'Manifestación de inconformidad respecto a la conducta o actuación de un funcionario o servicio.',
    diasHabiles: 15,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: null,
    activo: true
  },
  {
    codigo: 'RECLAMO',
    nombre: 'Reclamo',
    descripcion: 'Exigencia por prestación indebida o deficiente de un servicio o producto.',
    diasHabiles: 15,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: null,
    activo: true
  },
  {
    codigo: 'SUGERENCIA',
    nombre: 'Sugerencia',
    descripcion: 'Propuesta de mejora para optimizar la atención o servicios brindados.',
    diasHabiles: 15,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: null,
    activo: true
  },
  {
    codigo: 'INFORMACION',
    nombre: 'Petición de Información / Documentos',
    descripcion: 'Solicitud de acceso o copia de documentos públicos institucionales.',
    diasHabiles: 10,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: null,
    activo: true
  },
  {
    codigo: 'CONSULTA',
    nombre: 'Consulta a Entidad',
    descripcion: 'Petición de concepto técnico, legal o doctrinario sobre materias a su cargo.',
    diasHabiles: 30,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: null,
    activo: true
  },
  {
    codigo: 'RECURSO_QUEJA',
    nombre: 'Recurso de Queja (Superintendencias / Servicios Públicos)',
    descripcion: 'Procedente dentro de los 5 días siguientes a la notificación del rechazo del recurso de reposición. Exige adjuntar la resolución de rechazo.',
    diasHabiles: 5,
    requiereAnexoObligatorio: true,
    mensajeAnexoObligatorio: '⚠️ Es OBLIGATORIO adjuntar el documento/resolución de rechazo del recurso de reposición (o subsidio de apelación) para poder radicar este trámite.',
    activo: true
  }
];

async function main() {
  console.log('🌱 Inicializando inserción de tipos de PQRS base...');
  for (const t of tiposBase) {
    const tipo = await prisma.tipoPqrs.upsert({
      where: { codigo: t.codigo },
      update: {
        nombre: t.nombre,
        descripcion: t.descripcion,
        diasHabiles: t.diasHabiles,
        requiereAnexoObligatorio: t.requiereAnexoObligatorio,
        mensajeAnexoObligatorio: t.mensajeAnexoObligatorio,
        activo: t.activo
      },
      create: t
    });
    console.log(`✅ Tipo de PQRS [${tipo.codigo}] -> "${tipo.nombre}" (${tipo.diasHabiles} días hábiles, Anexo obligatorio: ${tipo.requiereAnexoObligatorio ? 'SI' : 'NO'})`);
  }
  console.log('🎉 Seed de tipos de PQRS completado satisfactoriamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
