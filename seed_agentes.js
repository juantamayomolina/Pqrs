const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('123456', salt);

  const agentes = [
    { tipoDocumento: 'CC', numeroDocumento: 'AGENTE001', nombreCompleto: 'Juan Pérez (Agente de Recepción)', email: 'juan.perez@org.com', rol: 'AGENTE', passwordHash },
    { tipoDocumento: 'CC', numeroDocumento: 'AGENTE002', nombreCompleto: 'Maria Gómez (Especialista en Quejas)', email: 'maria.gomez@org.com', rol: 'AGENTE', passwordHash },
    { tipoDocumento: 'CC', numeroDocumento: 'AGENTE003', nombreCompleto: 'Carlos Ruiz (Soporte Técnico)', email: 'carlos.ruiz@org.com', rol: 'AGENTE', passwordHash },
    { tipoDocumento: 'CC', numeroDocumento: 'ADMIN002', nombreCompleto: 'Laura (Sub-Gerente)', email: 'laura.admin@org.com', rol: 'ADMIN', passwordHash },
  ];

  for (const ag of agentes) {
    await prisma.usuario.upsert({
      where: { numeroDocumento: ag.numeroDocumento },
      update: {},
      create: ag
    });
  }

  console.log('Agentes dummy insertados correctamente.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
