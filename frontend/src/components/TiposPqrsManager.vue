<template>
  <div class="tipos-manager glass-panel animate-fade-in" style="padding: 1.5rem;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
      <div>
        <h2 style="margin:0; color:var(--primary-color);">Gestión de Tipos de PQRS y Términos Legales</h2>
        <p class="text-muted" style="margin:0.25rem 0 0 0;">Configuración de tipos de actuación, plazos de respuesta en días hábiles y requerimientos de anexos obligatorios.</p>
      </div>
      <button class="btn btn-primary" @click="abrirModalNuevo" style="display:flex; align-items:center; gap:0.5rem;">
        <span>➕</span> Crear Nuevo Tipo
      </button>
    </div>

    <div v-if="error" class="alert alert-error mb-4">{{ error }}</div>
    <div v-if="successMsg" class="alert alert-success mb-4">{{ successMsg }}</div>

    <div style="display:flex; gap:1rem; margin-bottom:1rem;">
      <input type="text" v-model="busqueda" placeholder="🔍 Buscar por código, nombre o descripción..." class="form-control" style="flex:1;" />
    </div>

    <div class="table-container" v-if="!loading">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre del Tipo</th>
            <th>Término (Días Hábiles)</th>
            <th>Anexo Obligatorio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tipo in tiposFiltrados" :key="tipo.id">
            <td><code>{{ tipo.codigo }}</code></td>
            <td>
              <strong>{{ tipo.nombre }}</strong>
              <div v-if="tipo.descripcion" class="text-muted" style="font-size:0.8rem; margin-top:0.2rem;">{{ tipo.descripcion }}</div>
            </td>
            <td>
              <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:bold;">
                ⏱️ {{ tipo.diasHabiles }} días háb.
              </span>
            </td>
            <td>
              <span v-if="tipo.requiereAnexoObligatorio" class="badge" style="background:#fef3c7; color:#b45309; font-weight:bold;" title="Exige adjuntar archivo obligatoriamente">
                📎 Requerido
              </span>
              <span v-else class="badge" style="background:#f1f5f9; color:#64748b;">
                Opcional
              </span>
            </td>
            <td>
              <span :class="['badge', tipo.activo ? 'badge-active' : 'badge-inactive']">
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-sm btn-secondary" @click="abrirModalEditar(tipo)" style="padding:0.3rem 0.6rem; font-size:0.85rem;">
                  ✏️ Editar
                </button>
                <button 
                  :class="['btn', 'btn-sm', tipo.activo ? 'btn-danger-soft' : 'btn-success-soft']" 
                  @click="toggleActivo(tipo)" 
                  style="padding:0.3rem 0.6rem; font-size:0.85rem;"
                >
                  {{ tipo.activo ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="tiposFiltrados.length === 0">
            <td colspan="6" class="text-center text-muted" style="padding:2rem;">
              No se encontraron tipos de PQRS configurados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center p-4">Cargando tipos de PQRS...</div>

    <!-- Modal Formulario (Crear / Editar) -->
    <Teleport to="body">
      <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-content animate-fade-in" style="max-width: 600px;">
          <div class="modal-header">
            <h3>{{ esEdicion ? 'Editar Tipo de PQRS' : 'Crear Nuevo Tipo de PQRS' }}</h3>
            <button class="btn-close" @click="cerrarModal">×</button>
          </div>
          <div class="modal-body" style="padding-top:1rem;">
            <form @submit.prevent="guardarTipo">
              <div v-if="modalError" class="alert alert-error mb-4">{{ modalError }}</div>

              <div class="form-group">
                <label class="form-label">Código Único (Identificador del Sistema)</label>
                <input 
                  type="text" 
                  v-model="form.codigo" 
                  class="form-control" 
                  placeholder="Ej: RECURSO_QUEJA" 
                  :disabled="esEdicion" 
                  required 
                />
                <small class="text-muted">Usado internamente. Se convierte automáticamente a mayúsculas sin espacios.</small>
              </div>

              <div class="form-group">
                <label class="form-label">Nombre del Tipo de PQRS</label>
                <input 
                  type="text" 
                  v-model="form.nombre" 
                  class="form-control" 
                  placeholder="Ej: Recurso de Queja (Servicios Públicos)" 
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">Descripción o Base Legal (Opcional)</label>
                <textarea 
                  v-model="form.descripcion" 
                  class="form-control" 
                  rows="2" 
                  placeholder="Ej: Procede contra el rechazo del recurso de reposición dentro de los 5 días siguientes..."
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Término Legal de Respuesta (Días Hábiles)</label>
                <input 
                  type="number" 
                  v-model.number="form.diasHabiles" 
                  class="form-control" 
                  min="1" 
                  max="120" 
                  required 
                />
                <small class="text-muted">El sistema calculará automáticamente los vencimientos descartando fines de semana y festivos de Colombia.</small>
              </div>

              <div class="form-group p-3 bg-light" style="border-radius: 8px; border:1px solid #e2e8f0; margin-top:1rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <input 
                    type="checkbox" 
                    id="reqAnexo" 
                    v-model="form.requiereAnexoObligatorio" 
                    style="width:1.2rem; height:1.2rem; cursor:pointer;" 
                  />
                  <label for="reqAnexo" style="font-weight:bold; margin:0; cursor:pointer; color:var(--primary-dark);">
                    📎 ¿Requiere Archivo Adjunto de Forma Obligatoria?
                  </label>
                </div>
                <small class="text-muted" style="display:block; margin-top:0.25rem;">
                  Si se activa, el peticionario NO podrá radicar la PQRS sin adjuntar al menos un archivo de soporte.
                </small>
              </div>

              <div v-if="form.requiereAnexoObligatorio" class="form-group mt-3">
                <label class="form-label">Mensaje Explicativo / Advertencia para el Usuario</label>
                <textarea 
                  v-model="form.mensajeAnexoObligatorio" 
                  class="form-control" 
                  rows="2" 
                  placeholder="Ej: Es OBLIGATORIO adjuntar el documento de rechazo del recurso de reposición..."
                ></textarea>
              </div>

              <div class="modal-footer" style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem; border-top:1px solid #eee; padding-top:1rem;">
                <button type="button" class="btn btn-secondary" @click="cerrarModal">Cancelar</button>
                <button type="submit" class="btn btn-primary" :disabled="guardando">
                  {{ guardando ? 'Guardando...' : (esEdicion ? 'Actualizar Tipo' : 'Crear Tipo de PQRS') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const tipos = ref([]);
const loading = ref(true);
const guardando = ref(false);
const error = ref('');
const successMsg = ref('');
const modalError = ref('');
const busqueda = ref('');

const mostrarModal = ref(false);
const esEdicion = ref(false);
const idEdicion = ref(null);

const form = ref({
  codigo: '',
  nombre: '',
  descripcion: '',
  diasHabiles: 15,
  requiereAnexoObligatorio: false,
  mensajeAnexoObligatorio: ''
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const cargarTipos = async () => {
  loading.value = true;
  error.value = '';
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.get(`${backendUrl}/api/tipos-pqrs/admin`, getAuthHeaders());
    tipos.value = res.data.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Error cargando la lista de tipos de PQRS.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  cargarTipos();
});

const tiposFiltrados = computed(() => {
  if (!busqueda.value) return tipos.value;
  const q = busqueda.value.toLowerCase();
  return tipos.value.filter(t => 
    t.codigo.toLowerCase().includes(q) ||
    t.nombre.toLowerCase().includes(q) ||
    (t.descripcion && t.descripcion.toLowerCase().includes(q))
  );
});

const abrirModalNuevo = () => {
  esEdicion.value = false;
  idEdicion.value = null;
  form.value = {
    codigo: '',
    nombre: '',
    descripcion: '',
    diasHabiles: 15,
    requiereAnexoObligatorio: false,
    mensajeAnexoObligatorio: ''
  };
  modalError.value = '';
  mostrarModal.value = true;
};

const abrirModalEditar = (tipo) => {
  esEdicion.value = true;
  idEdicion.value = tipo.id;
  form.value = {
    codigo: tipo.codigo,
    nombre: tipo.nombre,
    descripcion: tipo.descripcion || '',
    diasHabiles: tipo.diasHabiles,
    requiereAnexoObligatorio: tipo.requiereAnexoObligatorio,
    mensajeAnexoObligatorio: tipo.mensajeAnexoObligatorio || ''
  };
  modalError.value = '';
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
};

const guardarTipo = async () => {
  modalError.value = '';
  guardando.value = true;
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    if (esEdicion.value) {
      await axios.put(`${backendUrl}/api/tipos-pqrs/${idEdicion.value}`, form.value, getAuthHeaders());
      successMsg.value = 'Tipo de PQRS actualizado exitosamente.';
    } else {
      await axios.post(`${backendUrl}/api/tipos-pqrs`, form.value, getAuthHeaders());
      successMsg.value = 'Tipo de PQRS creado exitosamente.';
    }
    cerrarModal();
    await cargarTipos();
    setTimeout(() => { successMsg.value = ''; }, 4000);
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Error al guardar el tipo de PQRS.';
  } finally {
    guardando.value = false;
  }
};

const toggleActivo = async (tipo) => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await axios.patch(`${backendUrl}/api/tipos-pqrs/${tipo.id}/toggle`, {}, getAuthHeaders());
    await cargarTipos();
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al modificar estado.';
  }
};
</script>

<style scoped>
.badge-active {
  background: #dcfce7;
  color: #166534;
  font-weight: bold;
}
.badge-inactive {
  background: #fee2e2;
  color: #991b1b;
}
.btn-danger-soft {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}
.btn-danger-soft:hover {
  background: #fee2e2;
}
.btn-success-soft {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #86efac;
}
.btn-success-soft:hover {
  background: #dcfce7;
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
  border-bottom: 1px solid #eee;
  padding-bottom: 0.75rem;
}
.modal-header h3 {
  margin: 0;
  color: var(--primary-color);
}
.modal-body {
  overflow-y: auto;
  flex: 1;
}
.btn-close {
  background: transparent;
  color: #888;
  border: none;
  font-size: 2rem;
  cursor: pointer;
}
.btn-close:hover {
  color: #ef4444;
}
</style>
