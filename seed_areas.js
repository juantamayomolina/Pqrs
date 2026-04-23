const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding jerarquía de áreas...');

  // 1. Crear Jerarquía de Áreas
  const db_admon = await prisma.area.upsert({
    where: { nombre: 'Dirección General' },
    update: {},
    create: { nombre: 'Dirección General', descripcion: 'Máxima autoridad jerárquica' }
  });

  const db_th = await prisma.area.upsert({
    where: { nombre: 'Talento Humano' },
    update: { areaPadreId: db_admon.id },
    create: { nombre: 'Talento Humano', areaPadreId: db_admon.id }
  });

  const db_tech = await prisma.area.upsert({
    where: { nombre: 'Tecnología' },
    update: { areaPadreId: db_admon.id },
    create: { nombre: 'Tecnología', areaPadreId: db_admon.id }
  });

  const db_soporte = await prisma.area.upsert({
    where: { nombre: 'Soporte IT' },
    update: { areaPadreId: db_tech.id },
    create: { nombre: 'Soporte IT', areaPadreId: db_tech.id }
  });

  console.log('Inyectando usuarios ficticios en roles delegados GESTOR / AGENTE...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  // Gestor GNRAL (Acceso a TODO al igual que admin, pero vía herencia ramificada)
  await prisma.usuario.upsert({
    where: { numeroDocumento: 'GEST_GNRAL' },
    update: { areaId: db_admon.id, rol: 'GESTOR' },
    create: { tipoDocumento: 'CC', numeroDocumento: 'GEST_GNRAL', nombreCompleto: 'Gestor Central Direccion', passwordHash, rol: 'GESTOR', areaId: db_admon.id }
  });

  // Gestor TECH (Debe poder delegar tareas a Soporte IT, pero no a TH ni Administrativa superior)
  await prisma.usuario.upsert({
    where: { numeroDocumento: 'GEST_TECH' },
    update: { areaId: db_tech.id, rol: 'GESTOR' },
    create: { tipoDocumento: 'CC', numeroDocumento: 'GEST_TECH', nombreCompleto: 'Gestor Desarrollo TI', passwordHash, rol: 'GESTOR', areaId: db_tech.id }
  });

  // Agente final de escalera jerárquica
  await prisma.usuario.upsert({
    where: { numeroDocumento: 'AGENTE_SOPORTE' },
    update: { areaId: db_soporte.id, rol: 'AGENTE' },
    create: { tipoDocumento: 'CC', numeroDocumento: 'AGENTE_SOPORTE', nombreCompleto: 'Agente Junior Soporte', passwordHash, rol: 'AGENTE', areaId: db_soporte.id }
  });

  console.log('Mapeos validados. Test Data integrada satisfactoriamente.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
