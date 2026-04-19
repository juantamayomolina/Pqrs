# 🏛️ Documentación General: Plataforma de Gestión de PQRS (Ley 1755 de 2015)

Este documento centraliza el resumen del desarrollo Full-Stack de la plataforma, detallando tanto la arquitectura del servidor como la interfaz visual interactiva diseñada para el uso de la ciudadanía.

## 1. Arquitectura del Backend (Motor de Datos)
El núcleo fue construido en **Node.js** y **Express.js**, siendo el encargado de manejar la estricta lógica transaccional demandada por la reglamentación.

- **Base de Datos & ORM**: Empleando de manera ágil una base de datos relacional nativa (**SQLite**) facilitada y modelada bajo esquemas de **Prisma ORM (V6)**.
- **Modelo de Entidades Relacional**:
  - `Usuario`: (Radicador) Registrado bajo clave única de Número Documento.
  - `Entidad`: (Receptora) Registrada bajo Código de Entidad.
  - [Solicitud](file:///e:/jucat/Documentos/GitHub/Pqrs/src/controllers/pqrs.controller.js#5-63): Elemento centralizador. Vincula íntegramente al Radicador y la Entidad. Capaz de referenciar `Radicados Hijos` de una PQR madre si amerita derivaciones.
- **Lógica de Caducidad Automática**: La API integra algoritmos que calculan matemáticamente la "Fecha Mínima de Respuesta" (sean 10, 15, o 30 días hábiles) descartando inteligentemente los inactivos de Ley, como lo son Sábados, Domingos y todo asueto de índole nacional ("Ley Emiliani").
- **Endpoint Inteligente**: Ubicado como `API REST` bajo `/api/pqrs`. Su protocolo de inserción a base de datos usa **Transacciones**, lo cual asegura íntegramente que ante una avería intermitente, nunca haya un "Usuario Radicador fantasma" sin solicitud oficial asociada.

## 2. Implementación de Interfaz Gráfica (Frontend)
El cliente visual construido enteramente bajo **Vue.js 3** en el ecosistema empaquetador **Vite**. Se encuentra alojado limpiamente dentro de la subcarpeta segregada `/frontend`.

- **Estilos e Identidad Corporativa**: Modelado de raíz utilizando **Vanilla CSS** clásico y estricto, logrando altísima personalización. Usa *Glassmorphism* (Efectos translúcidos de vidrio) para la legibilidad, en combinación a una paleta institucional azul marina que proyecta profesionalismo gubernamental junto a micro-animaciones en interacciones de formulario. Todo unificado globalmente en el archivo `style.css`.
- **Rutas y Pantallas (`Vue Router`)**: 
  - `HomeView.vue`: Pagina central de aterrizaje para la presentación.
  - `CreatePqrsView.vue`: Formulario ordenado en el que el ciudadano digita su información personal, detalla su relato y consigna a la entidad receptora. Posteriormente informa en letras de molde el "Código de Radicado Oficial" del Caso (`PQR-XXXXXX`).
  - `TrackPqrsView.vue`: Panel interactivo que consume el id oficial para imprimir gráficamente en pantalla un resumen cronológico (las Fechas Legales generadas atrás), los estados, usuario y texto reportado.
- **Conectividad Externa**: Vinculado al Backend de Node usando comandos remotos con red nativa por **Axios**.

## 3. Calidad de Software y Muestreo (Pruebas Unitarias)
Todo el ecosistema cuenta con un estricto margen de validación sin fallas, haciendo uso de **Jest** y **Supertest**:
- Extracción de **aserciones precisas (100% de éxito)** que simularon calendarios pasados (ej. Semana Santa 2024) dentro del código para verificar que el servicio calcularía bien los topes y días hábiles permitidos.
- Generación constante y comprobatoria de flujos paralelos por Supertest en una base de datos controlada que ratifica que el servicio HTTP sí entrega los radicados bien formados sin colisionar sus llaves en Prisma.
- Empaquetado estático de Vue (`npm run build`) completado de raíz con estatus OK y sin sobreexceso de datos en Chunks.

---

### Módulo Operativo: ¿Cómo Iniciar el Proyecto?
Abra dos ventanas paralizadas de su terminal / consola del editor:

1. **Para El Motor Central**: Ejecute `npm run dev` o `npm start` estando en la *Raíz Principal* de todo el proyecto (Asignado al puerto `3000`).
2. **Para La Terminal Visual (Web)**: Diríjase a la carpeta del cliente usando en comando `cd frontend`. Seguidamente ejecute `npm run dev` y la consola le mostrará un hipervínculo azul (`http://localhost:5173/`). Solo dé un clic para usar la App.

*Nota técnica para ingenieros: Para testear peticiones en forma silenciada sin acceder a la web, dispone de un archivo preconfigurado `test-api.http` en la carpeta raíz (Lanzables con la extensión REST Client).*
