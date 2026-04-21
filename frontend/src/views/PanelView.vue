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

    <div class="panel-content animate-fade-in">
      <div v-if="loading" class="text-center mt-4">
        <p>Cargando información...</p>
      </div>
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="table-card glass-panel" v-if="!loading && solicitudes.length > 0">
        <h3>Bandeja de Entrada</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Radicado</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Asunto</th>
              <th>Estado</th>
              <th v-if="isAdmin">Asignado A</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pqrs in solicitudes" :key="pqrs.id">
              <td><strong>{{ pqrs.radicadoAlfaNum }}</strong></td>
              <td><span class="badge">{{ pqrs.tipo }}</span></td>
              <td>{{ new Date(pqrs.fechaRadicacion).toLocaleDateString() }}</td>
              <td>{{ pqrs.conceptoMotivo }}</td>
              <td>{{ pqrs.estado }}</td>
              <td v-if="isAdmin">
                <button 
                  @click="abrirModalAsignacion(pqrs)" 
                  class="btn btn-sm" 
                  :class="pqrs.agenteAsignadoId ? 'btn-secondary' : 'btn-primary'"
                  :style="pqrs.agenteAsignadoId ? 'color:white; font-size:0.85rem; padding:0.4rem 0.8rem' : 'font-size:0.85rem; padding:0.4rem 0.8rem'"
                >
                  {{ pqrs.agenteAsignadoId ? pqrs.agenteAsignado?.nombreCompleto : 'Asignar Agente' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!loading && solicitudes.length === 0" class="text-center mt-4" style="padding: 2rem;">
        <h3 class="text-muted">No hay PQRS para mostrar en tu bandeja.</h3>
      </div>
    </div>

    <!-- Modal de Asignación -->
    <div v-if="showModal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content animate-fade-in">
        <div class="modal-header">
          <h3>Asignar PQRS No. {{ pqrsSeleccionada?.radicadoAlfaNum }}</h3>
          <button class="btn-close" @click="cerrarModal">×</button>
        </div>
        <div class="modal-body">
          <input type="text" v-model="filtroAgentes" placeholder="🔍 Buscar agente por nombre o rol..." class="form-control mb-4" />
          <div class="table-container">
            <table class="data-table" style="margin-top:0">
              <thead>
                <tr>
                  <th>Nombre del Agente</th>
                  <th>Rol</th>
                  <th>Correo Asignado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="agente in agentesFiltrados" :key="agente.id">
                  <td>{{ agente.nombreCompleto }}</td>
                  <td><span class="badge">{{ agente.rol }}</span></td>
                  <td>{{ agente.email }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" style="padding:0.4rem 1rem" @click="confirmarAsignacion(agente.id)">
                      Seleccionar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="agentesFiltrados.length === 0" class="text-center mt-4 text-muted">No se encontraron agentes aplicando el filtro actual.</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = ref(null);
const token = ref('');
const solicitudes = ref([]);
const agentes = ref([]);
const loading = ref(true);
const error = ref('');

// Modal state
const showModal = ref(false);
const pqrsSeleccionada = ref(null);
const filtroAgentes = ref('');

const isAdmin = computed(() => user.value && user.value.rol === 'ADMIN');

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

    // Fetch Agentes if ADMIN
    if (isAdmin.value) {
      const resAgentes = await axios.get(`${backendUrl}/api/usuarios/agentes`, getAxiosConfig());
      agentes.value = resAgentes.data.data;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al conectar protegido con la API.';
  } finally {
    loading.value = false;
  }
};

const asignarAgente = async (pqrsId, agenteId) => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await axios.put(`${backendUrl}/api/pqrs/${pqrsId}/asignar`, { agenteAsignadoId: agenteId }, getAxiosConfig());
    await fetchData(); // reload to reflect assigned names natively
  } catch (err) {
    alert('Error al asignar el agente. Verifique permisos.');
    fetchData(); // reload
  }
};

const agentesFiltrados = computed(() => {
  if (!filtroAgentes.value) return agentes.value;
  const search = filtroAgentes.value.toLowerCase();
  return agentes.value.filter(a => a.nombreCompleto.toLowerCase().includes(search) || a.rol.toLowerCase().includes(search));
});

const abrirModalAsignacion = (pqrs) => {
  pqrsSeleccionada.value = pqrs;
  filtroAgentes.value = '';
  showModal.value = true;
};

const cerrarModal = () => {
  showModal.value = false;
  pqrsSeleccionada.value = null;
};

const confirmarAsignacion = async (agenteId) => {
  await asignarAgente(pqrsSeleccionada.value.id, agenteId);
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
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: var(--radius-md);
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
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
  flex: 1;
}

.table-container {
  overflow-y: auto;
  padding-bottom: 1rem;
}
</style>
