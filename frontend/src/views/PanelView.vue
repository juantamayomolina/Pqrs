<template>
  <div class="panel-container">
    <nav class="panel-nav">
      <div class="nav-left">
        <h2 style="color:white">Panel de Gestión Interno</h2>
      </div>
      <div class="nav-right" v-if="user">
        <span class="user-badge">{{ user.rol }}</span>
        <span>{{ user.nombreCompleto }}</span>
        <button @click="logout" class="btn btn-sm btn-logout">Cerrar Sesión</button>
      </div>
    </nav>

    <div class="panel-tabs" v-if="user && ['SUPERADMIN', 'ADMIN'].includes(user.rol)">
      <button :class="['tab-btn', activeTab === 'pqrs' ? 'active' : '']" @click="activeTab = 'pqrs'">Bandeja PQRS</button>
      <button :class="['tab-btn', activeTab === 'users' ? 'active' : '']" @click="activeTab = 'users'">Gestión de Usuarios</button>
      <button :class="['tab-btn', activeTab === 'areas' ? 'active' : '']" @click="activeTab = 'areas'">Gestión de Áreas</button>
      <button v-if="user.rol === 'SUPERADMIN'" :class="['tab-btn', activeTab === 'db' ? 'active' : '']" @click="activeTab = 'db'">Gestión de Base de Datos</button>
    </div>

    <template v-if="activeTab === 'pqrs'">
      <div class="panel-content animate-fade-in">
        <div v-if="loading" class="text-center mt-4">
          <p>Cargando información...</p>
        </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="table-card glass-panel" v-if="!loading && solicitudes.length > 0">
        <h3>Bandeja de Entrada</h3>
        
        <div class="filtros-bandeja" style="display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <input type="text" v-model="filtroTablaRadicado" placeholder="🔍 Buscar por radicado..." class="form-control" style="flex: 1; min-width: 200px" />
          <select v-model="filtroTablaTipo" class="form-control" style="flex: 1; min-width: 150px">
            <option value="">Todos los tipos</option>
            <option value="Peticion">Petición</option>
            <option value="Queja">Queja</option>
            <option value="Reclamo">Reclamo</option>
            <option value="Sugerencia">Sugerencia</option>
          </select>
          <select v-model="filtroTablaEstado" class="form-control" style="flex: 1; min-width: 150px">
            <option value="">Todos los estados</option>
            <option value="ABIERTO">Abierto</option>
            <option value="EN_TRAMITE">En Trámite</option>
            <option value="ESPERANDO_AMPLIACION">Esperando Ampliación</option>
            <option value="CERRADO">Cerrado</option>
          </select>
          <input v-if="canAssign" type="text" v-model="filtroTablaAsignacion" placeholder="🔍 Filtrar asignado a..." class="form-control" style="flex: 1; min-width: 150px" />
          
          <select v-model="itemsPerPage" class="form-control" style="width: auto" title="Registros por página">
            <option :value="5">5 / Pág</option>
            <option :value="10">10 / Pág</option>
            <option :value="20">20 / Pág</option>
            <option :value="50">50 / Pág</option>
          </select>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th @click="setSort('radicadoAlfaNum')" style="cursor:pointer" title="Ordenar por Radicado">Radicado ⇕</th>
              <th @click="setSort('tipo')" style="cursor:pointer" title="Ordenar por Tipo">Tipo ⇕</th>
              <th @click="setSort('fechaRadicacion')" style="cursor:pointer" title="Ordenar por Fecha">Fecha ⇕</th>
              <th>Asunto</th>
              <th @click="setSort('estado')" style="cursor:pointer" title="Ordenar por Estado">Estado ⇕</th>
              <th @click="setSort('vencimiento')" style="cursor:pointer" title="Ordenar por Días Restantes">Vencimiento ⇕</th>
              <th v-if="canAssign">Asignado A</th>
              <th>Expediente</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pqrs in paginatedSolicitudes" :key="pqrs.id">
              <td><strong>{{ pqrs.radicadoAlfaNum }}</strong></td>
              <td><span class="badge">{{ pqrs.tipo }}</span></td>
              <td>{{ new Date(pqrs.fechaRadicacion).toLocaleDateString() }}</td>
              <td>{{ pqrs.conceptoMotivo }}</td>
              <td>{{ pqrs.estado }}</td>
              <td>
                <span :class="obtenerVencimiento(pqrs).class" :style="`background:${obtenerVencimiento(pqrs).bg}; color:${obtenerVencimiento(pqrs).color}`">
                  {{ obtenerVencimiento(pqrs).text }}
                </span>
              </td>
              <td v-if="canAssign">
                <button 
                  v-if="pqrs.estado !== 'CERRADO'"
                  @click="abrirModalAsignacion(pqrs)" 
                  class="btn btn-sm" 
                  :class="pqrs.agenteAsignadoId || pqrs.areaAsignadaId ? 'btn-secondary' : 'btn-primary'"
                  :style="pqrs.agenteAsignadoId || pqrs.areaAsignadaId ? 'color:white; font-size:0.85rem; padding:0.4rem 0.8rem' : 'font-size:0.85rem; padding:0.4rem 0.8rem'"
                >
                  {{ pqrs.agenteAsignadoId ? pqrs.agenteAsignado?.nombreCompleto : (pqrs.areaAsignadaId ? pqrs.areaAsignada?.nombre : 'Asignar') }}
                </button>
                <div v-else class="badge" style="background:#cbd5e1; color:#475569"><span style="font-size:0.8rem">🔒 Permanente</span></div>
              </td>
              <td>
                <button class="btn btn-sm btn-primary" @click="abrirModalExpediente(pqrs)" style="padding:0.4rem; font-size:0.85rem; margin-left: 0.5rem; background:#3b82f6">
                  📂 Ver Caso
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación UI -->
        <div class="pagination-controls" style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem; padding: 0.5rem">
          <span style="font-size:0.9rem; color:#64748b">
            Mostrando {{ paginatedSolicitudes.length }} de {{ solicitudesFiltradasBandeja.length }} registros
          </span>
          <div style="display:flex; gap:0.5rem; align-items:center">
            <button class="btn btn-secondary btn-sm" @click="prevPage" :disabled="currentPage === 1">Anterior</button>
            <span style="font-size:0.9rem; font-weight:bold">Pág {{ currentPage }} de {{ totalPages }}</span>
            <button class="btn btn-secondary btn-sm" @click="nextPage" :disabled="currentPage >= totalPages">Siguiente</button>
          </div>
        </div>

      </div>

      <div v-else-if="!loading && solicitudes.length === 0" class="text-center mt-4" style="padding: 2rem;">
        <h3 class="text-muted">No hay PQRS para mostrar en tu bandeja.</h3>
      </div>
    </div>

    <!-- Modal de Asignación -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-content animate-fade-in">
          <div class="modal-header">
            <h3>Asignar Agente</h3>
            <button class="btn-close" @click="cerrarModal">×</button>
          </div>
          <div class="modal-body">
            <p style="margin-bottom: 1rem; color:#666">PQRS No. <strong>{{ pqrsSeleccionada?.radicadoAlfaNum }}</strong></p>
            
            <div style="display:flex; gap:1rem; margin-bottom:1.5rem">
              <button :class="['btn', assignMode === 'persona' ? 'btn-primary' : 'btn-secondary']" @click="assignMode='persona'" style="flex:1">A Empleado</button>
              <button :class="['btn', assignMode === 'area' ? 'btn-primary' : 'btn-secondary']" @click="assignMode='area'" style="flex:1">A Grupo / Área</button>
            </div>

            <!-- TAB PERSONA -->
            <template v-if="assignMode === 'persona'">
              <input type="text" v-model="filtroAgentes" placeholder="🔍 Buscar agente por nombre o rol..." class="form-control mb-4" />
              <div class="table-container">
                <table class="data-table" style="margin-top:0">
                  <thead>
                    <tr>
                      <th>Nombre del Agente</th>
                      <th>Rol</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="agente in agentesFiltrados" :key="agente.id">
                      <td>{{ agente.nombreCompleto }}</td>
                      <td><span class="badge">{{ agente.rol }}</span></td>
                      <td>
                        <button class="btn btn-sm btn-primary" style="padding:0.4rem 1rem" @click="confirmarAsignacion({ agenteAsignadoId: agente.id })">
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="agentesFiltrados.length === 0" class="text-center mt-4 text-muted">No se encontraron agentes.</div>
              </div>
            </template>

            <!-- TAB AREA -->
            <template v-if="assignMode === 'area'">
              <input type="text" v-model="filtroAreas" placeholder="🔍 Buscar área por nombre..." class="form-control mb-4" />
              <div class="table-container">
                <table class="data-table" style="margin-top:0">
                  <thead>
                    <tr>
                      <th>Nombre del Área</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="area in areasFiltradas" :key="area.id">
                      <td><strong>{{ area.nombre }}</strong></td>
                      <td>
                        <button class="btn btn-sm btn-primary" style="padding:0.4rem 1rem" @click="confirmarAsignacion({ areaAsignadaId: area.id })">
                          Delegar a esta Área
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="areasFiltradas.length === 0" class="text-center mt-4 text-muted">No se encontraron áreas asociadas a tu nivel.</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de Expediente y Trazabilidad -->
    <Teleport to="body">
      <div v-if="showExpediente" class="modal-overlay" @click.self="cerrarExpediente">
        <div class="modal-content animate-fade-in" style="max-width: 950px; flex-direction: row; padding:0; height: 85vh;">
          
          <!-- Lado Izquierdo: Info y Respuestas -->
          <div style="flex: 2; padding: 2rem; overflow-y: auto; border-right: 1px solid #e2e8f0; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e2e8f0; padding-bottom:1rem; margin-bottom:1.5rem">
               <h2 style="margin:0; color:var(--primary-color); font-size:1.5rem">Expediente No. {{ expedienteActual?.radicadoAlfaNum }}</h2>
            </div>
            
            <p><strong>Clasificación:</strong> Solicitud de Tipo {{ expedienteActual?.tipo }}</p>
            <p><strong>Asunto:</strong> {{ expedienteActual?.conceptoMotivo }}</p>
            <p><strong>Motivación/Descripción:</strong> {{ expedienteActual?.contenido }}</p>
            
            <div v-if="getAnexos(expedienteActual?.anexosUrls)?.length" class="mt-2" style="background:#f1f5f9; padding:1rem; border-radius:8px">
              <strong>📎 Anexos Radicados:</strong>
              <div class="flex gap-2 flex-wrap mt-2">
                <a :href="`http://localhost:3000${url}`" target="_blank" v-for="(url, i) in getAnexos(expedienteActual?.anexosUrls)" :key="i" class="badge" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.5rem; background:white; border:1px solid #cbd5e1">
                  <span>📄</span> Visualizar Archivo {{ i + 1 }}
                </a>
              </div>
            </div>
            
            <div class="mt-4" style="background:#f8fafc; padding:1.5rem; border-radius:0.5rem; border:1px solid #e2e8f0;">
              <h4>Actuaciones Emitidas ({{ expedienteActual?.respuestas?.length || 0 }})</h4>
              <div v-for="r in expedienteActual?.respuestas" :key="r.id" style="background:white; padding:1rem; margin-top:1rem; border-left:4px solid #3b82f6; box-shadow:0 1px 3px rgba(0,0,0,0.1)">
                 <strong>{{ r.tipo }}</strong> <span class="text-muted" style="font-size:0.8rem"> - Uso Interno: {{r.esInterna?'Si':'No'}}</span>
                 <p style="margin-top:0.5rem; font-size:0.95rem; line-height: 1.5">{{ r.contenido }}</p>
                 <div v-if="getAnexos(r.anexosUrls)?.length" class="mt-2 p-2 rounded" style="background:#f8fafc; border:1px dashed #cbd5e1">
                   <strong style="font-size:0.85rem; color:#64748b">📎 Evidencias de la Resolución:</strong>
                   <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.5rem">
                     <a :href="`http://localhost:3000${url}`" target="_blank" v-for="(url, i) in getAnexos(r.anexosUrls)" :key="i" style="font-size:0.8rem; background:white; padding:0.2rem 0.5rem; border-radius:4px; text-decoration:none; border:1px solid #ccc; color:#0f172a; display:inline-flex; align-items:center; gap:0.3rem">
                       <span>📄</span> Documento Adjunto {{i+1}}
                     </a>
                   </div>
                 </div>
              </div>
              <div v-if="!expedienteActual?.respuestas?.length" class="text-muted py-2">Ningún oficio o respuesta ha sido radicado sobre este expediente.</div>
            </div>

            <div class="mt-4" style="border-top: 2px solid #e2e8f0; padding-top: 1rem;" v-if="expedienteActual?.estado !== 'CERRADO'">
               <h4>Emitir Actuación</h4>
               <form @submit.prevent="submitRespuesta" style="margin-top:1rem; background:white; padding:1.5rem; border-radius:8px; border:1px solid #cbd5e1">
                  <select class="form-control mb-4" v-model="formaRespuesta.tipo" required style="width:100%; padding:0.8rem">
                     <option value="" disabled selected>Seleccione Sub-Tipo de Oficio (Ley 1755)</option>
                     <option value="FINAL">Respuesta Final</option>
                     <option value="PARCIAL">Respuesta Parcial</option>
                     <option value="SOLICITUD_AMPLIACION">Solicitud de Ampliación de Información al Usuario</option>
                     <option value="NO_COMPETENCIA">Rechazo por No Competencia (Devolución a Coordinación)</option>
                     <option value="DESISTIMIENTO_TACITO">Desistimiento Tácito (Extinción por silencio)</option>
                  </select>
                  <textarea v-model="formaRespuesta.contenido" class="form-control mb-4" rows="4" placeholder="Contenido de la actuación" required></textarea>
                  
                  <div class="form-group mb-4 p-3" style="background:white; border:1px solid #cbd5e1; border-radius:8px">
                    <label class="form-label mb-2" style="font-weight:600">📎 Anexos a la petición (Máx 5)</label>
                    <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt" @change="handleFileUploadPanel" class="form-control" />
                    <div v-if="archivosRespuesta.length > 0" class="mt-2 text-muted" style="font-size:0.8rem; font-weight:600">
                      Cargados: {{ archivosRespuesta.length }} documento(s).
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary" :disabled="guardandoRespuesta" style="width: 100%; justify-content:center; padding:1rem; font-size:1.1rem">
                    {{ guardandoRespuesta ? 'Aplicando Resoluciones...' : 'Legalizar y Radicar Oficio' }}
                  </button>
               </form>
            </div>
            <div v-else class="mt-4 p-4 text-center rounded bg-gray" style="background:#e2e8f0; border-radius:8px">
               <strong>🔒 Expediente Cerrado</strong>
               <p style="margin-top:0.5rem">No es posible añadir nuevos oficios a un caso finalizado administrativamente.</p>
            </div>
          </div>

          <!-- Lado Derecho: Auditoria / Timeline -->
          <div style="flex: 1; padding: 2rem; background: #fdfdfd; overflow-y: auto; position:relative; min-width: 350px">
             <button class="btn-close" @click="cerrarExpediente" style="position:absolute; right:1.5rem; top:1.5rem; z-index:1000">×</button>
             <h3 style="margin-bottom:2rem; font-size:1.3rem; margin-top:2.5rem"><span style="font-size:1.5rem">🕵️</span> Bitácora Auditoría</h3>
             
             <div style="position:relative; margin-left:14px; border-left:3px solid #cbd5e1; padding-left:1.5rem">
               <div v-for="mov in expedienteActual?.movimientos" :key="mov.id" style="margin-bottom: 2.5rem; position:relative;">
                  <div style="position:absolute; width:18px; height:18px; background:#fcd34d; border-radius:50%; left:-1.5rem; top:0; transform:translateX(-65%); border:3px solid white; box-shadow:0 0 0 2px #cbd5e1"></div>
                  <strong style="display:block; color:#0f172a; font-size:0.95rem">{{ mov.accion }}</strong>
                  <span style="font-size:0.75rem; color:#64748b; font-weight:bold">{{ new Date(mov.fecha).toLocaleString() }}</span>
                  <p style="margin:0.5rem 0 0 0; font-size:0.9rem; color:#334155">{{ mov.detalle }}</p>
                  <div v-if="mov.autor" style="margin-top:0.5rem; font-size:0.8rem; background:#f1f5f9; padding:0.3rem 0.5rem; border-radius:4px; display:inline-block; border:1px solid #e2e8f0">👤 Modificado por: <strong>{{ mov.autor.nombreCompleto }}</strong> ({{mov.autor.rol}})</div>
                  <div v-else style="margin-top:0.5rem; font-size:0.8rem; background:#f1f5f9; padding:0.3rem 0.5rem; border-radius:4px; display:inline-block; border:1px solid #e2e8f0">⚡ Inyección Sistémica o Automática</div>
               </div>
               
               <div v-if="!expedienteActual?.movimientos || expedienteActual?.movimientos.length === 0" class="text-muted">
                 No hay movimientos registrados en la bitácora aún.
               </div>
             </div>
          </div>

        </div>
      </div>
    </Teleport>
      </template>

      <template v-if="activeTab === 'users'">
        <div class="panel-content animate-fade-in" style="max-width: 1400px; padding: 1rem">
          <UsersManager />
        </div>
      </template>

      <template v-if="activeTab === 'areas'">
        <div class="panel-content animate-fade-in" style="max-width: 1400px; padding: 1rem">
          <AreasManager />
        </div>
      </template>

      <template v-if="activeTab === 'db'">
        <div class="panel-content animate-fade-in" style="max-width: 1400px; padding: 1rem">
          <DatabaseManager />
        </div>
      </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import DatabaseManager from '../components/DatabaseManager.vue';
import AreasManager from '../components/AreasManager.vue';
import UsersManager from '../components/UsersManager.vue';

const router = useRouter();
const user = ref(null);
const token = ref('');
const solicitudes = ref([]);
const agentes = ref([]);
const loading = ref(true);
const error = ref('');

const filtroTablaRadicado = ref('');
const filtroTablaTipo = ref('');
const filtroTablaEstado = ref('');
const filtroTablaAsignacion = ref('');

const sortKey = ref('fechaRadicacion');
const sortOrder = ref('desc');

const setSort = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const getDiasRestantes = (pqrs) => {
  if (pqrs.estado === 'CERRADO') return 9999;
  let diasLimite = 15;
  if (pqrs.tipo && pqrs.tipo.toLowerCase().includes('informacion')) diasLimite = 10;
  if (pqrs.tipo && pqrs.tipo.toLowerCase().includes('consulta')) diasLimite = 30;
  
  const fecha = new Date(pqrs.fechaRadicacion);
  fecha.setDate(fecha.getDate() + diasLimite);
  
  const diff = fecha - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const obtenerVencimiento = (pqrs) => {
  if (pqrs.estado === 'CERRADO') return { text: 'Cerrado', class: 'badge', bg: '#e2e8f0', color: '#475569' };
  
  const diasRestantes = getDiasRestantes(pqrs);

  if (diasRestantes < 0) {
    return { text: `${diasRestantes} días`, class: 'badge', bg: '#fee2e2', color: '#dc2626' };
  } else if (diasRestantes <= 3) {
    return { text: `Quedan ${diasRestantes} días`, class: 'badge', bg: '#fef3c7', color: '#d97706' };
  } else {
    return { text: `Quedan ${diasRestantes} días`, class: 'badge', bg: '#dcfce7', color: '#166534' };
  }
};

const solicitudesFiltradasBandeja = computed(() => {
  let filtradas = solicitudes.value.filter(pqrs => {
    const matchRadicado = !filtroTablaRadicado.value || pqrs.radicadoAlfaNum.toLowerCase().includes(filtroTablaRadicado.value.toLowerCase());
    const matchTipo = !filtroTablaTipo.value || pqrs.tipo === filtroTablaTipo.value;
    const matchEstado = !filtroTablaEstado.value || pqrs.estado === filtroTablaEstado.value;
    
    let nombreAsignado = 'Sin Asignar';
    if (pqrs.agenteAsignadoId && pqrs.agenteAsignado) nombreAsignado = pqrs.agenteAsignado.nombreCompleto;
    else if (pqrs.areaAsignadaId && pqrs.areaAsignada) nombreAsignado = pqrs.areaAsignada.nombre;
    
    const matchAsignacion = !filtroTablaAsignacion.value || nombreAsignado.toLowerCase().includes(filtroTablaAsignacion.value.toLowerCase());

    return matchRadicado && matchTipo && matchEstado && matchAsignacion;
  });

  filtradas.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    
    if (sortKey.value === 'vencimiento') {
      valA = getDiasRestantes(a);
      valB = getDiasRestantes(b);
    }
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });

  return filtradas;
});

const currentPage = ref(1);
const itemsPerPage = ref(10);

const totalPages = computed(() => {
  return Math.ceil(solicitudesFiltradasBandeja.value.length / itemsPerPage.value) || 1;
});

const paginatedSolicitudes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return solicitudesFiltradasBandeja.value.slice(start, end);
});

watch([filtroTablaRadicado, filtroTablaTipo, filtroTablaEstado, filtroTablaAsignacion, itemsPerPage], () => {
  currentPage.value = 1;
});

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const activeTab = ref('pqrs');

// Modal state
const showModal = ref(false);
const showExpediente = ref(false);
const pqrsSeleccionada = ref(null);
const expedienteActual = ref(null);
const guardandoRespuesta = ref(false);
const formaRespuesta = ref({ tipo: '', contenido: '' });
const archivosRespuesta = ref([]);

const getAnexos = (str) => {
  if (!str) return [];
  try { return JSON.parse(str); } catch(e) { return []; }
};

const handleFileUploadPanel = (e) => {
  archivosRespuesta.value = Array.from(e.target.files);
};

const filtroAgentes = ref('');
const filtroAreas = ref('');
const assignMode = ref('persona');
const nodosAreas = ref([]);

const canAssign = computed(() => user.value && ['ADMIN', 'SUPERADMIN', 'GESTOR'].includes(user.value.rol));

onMounted(() => {
  const localToken = localStorage.getItem('auth_token');
  const localUser = localStorage.getItem('auth_user');
  
  if (!localToken || !localUser) {
    router.push('/login');
    return;
  }
  
  token.value = localToken;
  user.value = JSON.parse(localUser);
  
  fetchData();
});

const getAxiosConfig = () => ({
  headers: {
    Authorization: `Bearer ${token.value}`
  }
});

const fetchData = async () => {
  loading.value = true;
  error.value = '';
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Fetch PQRS
    const resPqrs = await axios.get(`${backendUrl}/api/pqrs/gestion`, getAxiosConfig());
    solicitudes.value = resPqrs.data.data;

    // Fetch Agentes if canAssign
    if (canAssign.value) {
      const resAsignables = await axios.get(`${backendUrl}/api/usuarios/asignables`, getAxiosConfig());
      nodosAreas.value = resAsignables.data.data.areas;
      agentes.value = resAsignables.data.data.usuarios;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al conectar protegido con la API.';
  } finally {
    loading.value = false;
  }
};

const asignarCaso = async (pqrsId, payload) => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await axios.put(`${backendUrl}/api/pqrs/${pqrsId}/asignar`, payload, getAxiosConfig());
    await fetchData(); // reload
  } catch (err) {
    alert('Error denegado: ' + (err.response?.data?.message || 'Verifique permisos jerárquicos.'));
    fetchData(); // reload
  }
};

const agentesFiltrados = computed(() => {
  if (!filtroAgentes.value) return agentes.value;
  const search = filtroAgentes.value.toLowerCase();
  return agentes.value.filter(a => a.nombreCompleto.toLowerCase().includes(search) || a.rol.toLowerCase().includes(search));
});

const areasFiltradas = computed(() => {
  if (!filtroAreas.value) return nodosAreas.value;
  const search = filtroAreas.value.toLowerCase();
  return nodosAreas.value.filter(a => a.nombre.toLowerCase().includes(search));
});

const abrirModalAsignacion = (pqrs) => {
  pqrsSeleccionada.value = pqrs;
  filtroAgentes.value = '';
  filtroAreas.value = '';
  assignMode.value = 'persona';
  showModal.value = true;
};

const cerrarModal = () => {
  showModal.value = false;
  pqrsSeleccionada.value = null;
};

const abrirModalExpediente = (pqrs) => {
  expedienteActual.value = pqrs;
  formaRespuesta.value = { tipo: '', contenido: '' };
  showExpediente.value = true;
};

const cerrarExpediente = () => {
  showExpediente.value = false;
  expedienteActual.value = null;
};

const submitRespuesta = async () => {
  guardandoRespuesta.value = true;
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Limits Checking Local Validation
    let sum = 0;
    archivosRespuesta.value.forEach(f => sum += f.size);
    if(sum > 5 * 1024 * 1024) throw new Error('El archivo cargado supera tu capacidad designada global de 5 MB.');
    if(archivosRespuesta.value.length > 5) throw new Error('Campaña denegada. Límite máximo son 5 archivos paralelos. Comprime en un solo ZIP.');

    const formData = new FormData();
    formData.append('tipo', formaRespuesta.value.tipo);
    formData.append('contenido', formaRespuesta.value.contenido);
    archivosRespuesta.value.forEach(f => formData.append('archivos', f));

    await axios.post(`${backendUrl}/api/pqrs/${expedienteActual.value.id}/respuesta`, formData, {
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    });

    alert('Operación procesada con éxito y trazada en bitácora transparente.');
    
    await fetchData(); // Recargar DB para reflejar el estado actual
    const actualizado = solicitudes.value.find(s => s.id === expedienteActual.value.id);
    if(actualizado) expedienteActual.value = actualizado;
    
    formaRespuesta.value = { tipo: '', contenido: '' };
    archivosRespuesta.value = [];
  } catch(e) {
    alert('Restricción Legal: ' + (e.response?.data?.message || e.message));
  } finally {
    guardandoRespuesta.value = false;
  }
};

const confirmarAsignacion = async (payload) => {
  await asignarCaso(pqrsSeleccionada.value.id, payload);
  cerrarModal();
};

const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
};
</script>

<style scoped>
.panel-container {
  min-height: 100vh;
  background-color: #f8fafc;
}

.panel-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.nav-left h2 {
  margin: 0;
  font-size: 1.4rem;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-badge {
  background: #3b82f6;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.btn-logout {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.1);
}

.panel-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.panel-tabs {
  display: flex;
  justify-content: center;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}
.tab-btn {
  background: none;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}
.tab-btn:hover {
  color: var(--primary-color);
}
.tab-btn.active {
  color: var(--primary-color);
  border-bottom: 3px solid var(--primary-color);
}

.table-card {
  padding: 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
}

.badge {
  background: #e2e8f0;
  color: #334155;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.select-asignacion {
  padding: 0.3rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.9rem;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-left: 4px solid #dc2626;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  padding: 1.5rem 2rem;
  border-radius: var(--radius-md);
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.modal-header h3 {
  margin: 0;
  color: var(--primary-color);
  font-size: 1.4rem;
}

.btn-close {
  background: transparent;
  color: #888;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #ef4444;
}

.modal-body {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  box-sizing: border-box;
}

.table-container {
  overflow-y: auto;
  padding-bottom: 1rem;
}
</style>
