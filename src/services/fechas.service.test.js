const { calcularFechaMaximaRespuesta, obtenerDiasHabilesPorTipo } = require('./fechas.service');

describe('Servicio de Fechas - Ley 1755', () => {
  test('obtenerDiasHabilesPorTipo devuelve plazos correctos', () => {
    expect(obtenerDiasHabilesPorTipo('peticion')).toBe(15);
    expect(obtenerDiasHabilesPorTipo('informacion')).toBe(10);
    expect(obtenerDiasHabilesPorTipo('consulta')).toBe(30);
    expect(obtenerDiasHabilesPorTipo('desconocido')).toBe(15); // Fallback por defecto
  });

  test('calcularFechaMaximaRespuesta ignora fines de semana (Sab/Dom)', () => {
    // Si radico el Viernes 2024-02-02 y el plazo es 2 días, la respuesta debe ser Martes 2024-02-06.
    const fecha = calcularFechaMaximaRespuesta('2024-02-02T12:00:00Z', 2);
    expect(fecha.toISOString().startsWith('2024-02-06')).toBe(true);
  });

  test('calcularFechaMaximaRespuesta ignora festivos colombianos', () => {
    // El Jueves 28 y Viernes 29 de Marzo de 2024 (Semana Santa) son festivos.
    // Radicado el Miércoles 2024-03-27. Plazo 2 días hábiles.
    // Pasa Jueves(Festivo), Viernes(Festivo), Sab(Fin de semana), Dom(Fin de semana)
    // 1 día martes -> Lunes 01 de Abril
    // 2 día martes -> Martes 02 de Abril
    const fecha = calcularFechaMaximaRespuesta('2024-03-27T10:00:00Z', 2);
    expect(fecha.toISOString().startsWith('2024-04-02')).toBe(true);
  });
});
