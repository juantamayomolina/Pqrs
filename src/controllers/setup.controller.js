const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getSetupStatus = async (req, res) => {
  try {
    let conf = await prisma.configuracionSistema.findUnique({
      where: { id: 1 }
    });
    
    if (!conf) {
      return res.status(200).json({ isConfigured: false });
    }
    
    return res.status(200).json({ isConfigured: conf.configurado });
  } catch (error) {
    console.error('Error fetching setup status:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

const saveSetup = async (req, res) => {
  try {
    const { tipoPersona, razonSocial, descripcion } = req.body;
    
    if (!tipoPersona || !razonSocial || !descripcion) {
      return res.status(400).json({ message: 'Faltan campos requeridos.' });
    }

    const conf = await prisma.configuracionSistema.upsert({
      where: { id: 1 },
      update: { tipoPersona, razonSocial, descripcion, configurado: true },
      create: { id: 1, tipoPersona, razonSocial, descripcion, configurado: true }
    });

    return res.status(200).json({ message: 'Sistema configurado exitosamente.', data: conf });
  } catch (error) {
    console.error('Error saving setup:', error);
    res.status(500).json({ message: 'Error al guardar la configuración', error: error.message });
  }
};

module.exports = { getSetupStatus, saveSetup };
