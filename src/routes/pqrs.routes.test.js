const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

beforeAll(async () => {
  // Limpiar BD antes de pruebas respetando restricciones de integridad referencial
  await prisma.movimiento.deleteMany();
  await prisma.respuesta.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.entidad.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('API PQRS Endpoints', () => {
  let radicadoGenerado = '';

  test('POST /api/pqrs crea una solicitud exitosamente', async () => {
    const payload = {
      tipoDocumento: "CC",
      numeroDocumento: "1122334455",
      nombreCompleto: "Usuario Test",
      email: "test@test.com",
      esVulnerable: false,
      entidadCodigo: "E-TEST-01",
      entidadNombre: "Salud Local",
      tipoSolicitud: "QUEJA",
      conceptoMotivo: "Demoras",
      contenido: "Test queja de prueba e2e"
    };

    const response = await request(app)
      .post('/api/pqrs')
      .send(payload)
      .expect(201);

    expect(response.body.message).toBe('PQRS radicada exitosamente');
    expect(response.body.radicado).toBeDefined();
    expect(response.body.data.estado).toBe('ABIERTO');
    
    radicadoGenerado = response.body.radicado;
  });

  test('GET /api/pqrs/:radicado obtiene exitosamente la solicitud con sus relaciones', async () => {
    const response = await request(app)
      .get(`/api/pqrs/${radicadoGenerado}`)
      .expect(200);

    expect(response.body.data.radicadoAlfaNum).toBe(radicadoGenerado);
    expect(response.body.data.usuario.numeroDocumento).toBe('1122334455');
    expect(response.body.data.entidad.codigo).toBe('MAIN-ENT');
  });

  test('GET /api/pqrs/:radicado retorna 404 para radicados inexistentes', async () => {
    const response = await request(app)
      .get('/api/pqrs/PQR-INVENTADO-999')
      .expect(404);
      
    expect(response.body.message).toBe('Solicitud no encontrada');
  });
});
