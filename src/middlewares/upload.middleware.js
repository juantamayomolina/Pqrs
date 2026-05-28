const multer = require('multer');
const path = require('path');

// 1. Configurar Disco Físico (Local)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_'));
  }
});

// 2. MimeTypes Whitelisted Estrictos (Ofimática e Imagenes Seguras)
const allowedMimes = [
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'text/plain', 
  'image/jpeg', 
  'image/png', 
  'application/zip',
  'application/x-zip-compressed'
];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Extensiones de Anexo denegadas por el sistema. Intente convirtiéndolo a PDF, ZIP o Formatos aceptados (Word/Excel/Img).'));
  }
};

// 3. Limitantes Duros 
const limits = {
  // Limite por archivo individual en multer (lo calibramos a 5mb) 
  // pero luego haremos una barrera Matemática post-lectura por si envían 5 archivos de 2mb = 10mb.
  fileSize: 5 * 1024 * 1024, 
  files: 5 // Máximo 5 documentos
};

const upload = multer({ storage, fileFilter, limits });

// 4. Middleware Global Controlador (Punto de Entrada Restrictivo)
const handleUpload = (req, res, next) => {
  // "archivos" es el nombre del array en FromData que enviara el Frontend Vue
  const multerUpload = upload.array('archivos', 5); 
  
  multerUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'El payload fue interceptado; algun file supera el límite estructural de 5MB.' });
      if (err.code === 'LIMIT_FILE_COUNT') return res.status(400).json({ message: 'Acción bloqueada: No se admiten configuraciones de más de 5 anexos disociados. Favor agrupar en un archivo .ZIP comprimido.' });
      return res.status(400).json({ message: 'Rechazo estructural al procesar evidencias Multipart', error: err.message });
    } else if (err) {
      // Cayó en el fileFilter de ClamAV "Light" (MimeTypes Estrictos)
      return res.status(400).json({ message: err.message });
    }

    // 5. Verificación de Sincronismo Global: (Suma Acumulada de todos los archivos)
    if (req.files && req.files.length > 0) {
      const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5 MB en bytes directos
      const sumaAcumulada = req.files.reduce((acc, file) => acc + file.size, 0);
      
      if (sumaAcumulada > MAX_TOTAL_SIZE) {
         return res.status(400).json({ message: `Abortado: La acumulación sumatoria de sus ${req.files.length} documentos es ${(sumaAcumulada / 1024 / 1024).toFixed(2)}MB lo cual excede el peso tope organizacional de 5 MB.`});
      }
    }

    next();
  });
};

module.exports = { handleUpload };
