const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Retorna todos los Ids de las areas hijas, nietas, etc. basados en un nodo padre utilizando recorrido de grafos BFS.
 * @param {Number} rootAreaId - El id del Area principal a escanear
 * @returns {Promise<Number[]>} - Array de IDs descendientes.
 */
const getDescendantAreaIds = async (rootAreaId) => {
  if (!rootAreaId) return [];
  // Precarga ligera en memoria (muy eficiente bajo coste IO al carecer SQLite de CTE Recursive nativos)
  const allAreas = await prisma.area.findMany({ select: { id: true, areaPadreId: true } });
  
  const childrenMap = {};
  allAreas.forEach(a => {
    if (a.areaPadreId) {
      if(!childrenMap[a.areaPadreId]) childrenMap[a.areaPadreId] = [];
      childrenMap[a.areaPadreId].push(a.id);
    }
  });

  const descendants = [];
  const queue = [rootAreaId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId !== rootAreaId) descendants.push(currentId);
    if (childrenMap[currentId]) queue.push(...childrenMap[currentId]);
  }
  return descendants;
};

/**
 * Retorna un arreglo de Ids incluyéndose a sí mismo, más la descendencia infinita
 */
const getSubTreeIds = async (rootAreaId) => {
  if (!rootAreaId) return [];
  const descendants = await getDescendantAreaIds(rootAreaId);
  return [rootAreaId, ...descendants];
};

module.exports = { getDescendantAreaIds, getSubTreeIds };
