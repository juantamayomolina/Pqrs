const { addDays, isWeekend, format, parseISO } = require('date-fns');

// Lista base de festivos en Colombia. Puede ampliarse o consultarse de paquete.
const FESTIVOS = [
  '2024-01-01', '2024-01-08', '2024-03-25', '2024-03-28', '2024-03-29',
  '2024-05-01', '2024-05-13', '2024-06-03', '2024-06-10', '2024-07-01',
  '2024-07-20', '2024-08-07', '2024-08-19', '2024-10-14', '2024-11-04',
  '2024-11-11', '2024-12-08', '2024-12-25',
  // 2025
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20',
  '2025-08-07', '2025-08-18', '2025-10-13', '2025-11-03', '2025-11-17',
  '2025-12-08', '2025-12-25',

  // 2026
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
  '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
  '2026-11-16', '2026-12-08', '2026-12-25'
];

/**
 * Verifica si una fecha es festivo en Colombia
 */
const esFestivo = (fecha) => {
  const fechaStr = format(fecha, 'yyyy-MM-dd');
  return FESTIVOS.includes(fechaStr);
};

/**
 * Calcula la fecha máxima de respuesta excluyendo fines de semana y festivos
 * @param {Date|String} fechaRadicacion - Fecha de radicación
 * @param {number} diasHabilesPlazo - Plazo en días hábiles (Ley 1755)
 * @returns {Date} Fecha máxima
 */
const calcularFechaMaximaRespuesta = (fechaRadicacion, diasHabilesPlazo) => {
  let fechaCalculada = typeof fechaRadicacion === 'string' ? parseISO(fechaRadicacion) : new Date(fechaRadicacion);
  let diasAgregados = 0;

  while (diasAgregados < diasHabilesPlazo) {
    fechaCalculada = addDays(fechaCalculada, 1);

    if (!isWeekend(fechaCalculada) && !esFestivo(fechaCalculada)) {
      diasAgregados++;
    }
  }
  return fechaCalculada;
};

/**
 * Retorna los días aplicables según el tipo de petición general
 */
const obtenerDiasHabilesPorTipo = (tipoRespuesta) => {
  const plazos = {
    'PETICION': 15,
    'QUEJA': 15,
    'RECLAMO': 15,
    'SUGERENCIA': 15,
    'INFORMACION': 10,
    'CONSULTA': 30
  };
  return plazos[tipoRespuesta.toUpperCase()] || 15;
};

module.exports = {
  calcularFechaMaximaRespuesta,
  esFestivo,
  obtenerDiasHabilesPorTipo
};
