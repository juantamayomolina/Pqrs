<template>
  <div class="db-manager">
    <div class="db-header flex justify-between animate-fade-in" style="align-items:center; margin-bottom: 1.5rem; background:white; padding:1.5rem; border-radius:8px">
      <div style="flex:1">
        <label class="form-label" style="font-weight:bold; color:var(--primary-color)">Seleccionar Tabla Técnica:&nbsp;</label>
        <select v-model="selectedTable" @change="fetchData" class="form-control mt-2" style="max-width:300px">
          <option value="" disabled>-- Seleccione una Entidad --</option>
          <option v-for="t in tables" :key="t" :value="t">{{ t.toUpperCase() }}</option>
        </select>
      </div>
      <button v-if="selectedTable" class="btn btn-primary" @click="openCreateModal">+ Insertar Nuevo Registro</button>
    </div>

    <div v-if="loading" class="text-center p-4">Conectando con la base de datos...</div>

    <div v-if="!loading && selectedTable && records.length > 0" class="table-card glass-panel animate-fade-in">
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col">{{ col }}</th>
              <th>Acciones Peligrosas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in records" :key="row.id">
              <td v-for="col in columns" :key="col + row.id">{{ formatValue(row[col]) }}</td>
              <td style="display:flex;gap:0.5rem">
                <button class="btn btn-sm btn-secondary" style="padding:0.3rem 0.8rem; font-size:0.8rem" @click="openEditModal(row)">Editar</button>
                <button class="btn btn-sm btn-danger" style="background:#dc2626; color:white; border:none; padding:0.3rem 0.8rem; font-size:0.8rem; border-radius:4px; cursor:pointer" @click="confirmDelete(row.id)">Borrar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div v-else-if="!loading && selectedTable" class="text-center p-4 text-muted" style="background:white; border-radius:8px">
      <h3>La tabla no tiene registros.</h3>
    </div>

    <!-- Edit/Create Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content animate-fade-in">
          <div class="modal-header">
            <h3 style="margin:0; word-break: break-all; padding-right:1rem">
              {{ editingId ? 'Editar Registro' : 'Nuevo Registro' }} <br>
              <small style="color:#666; font-size:0.9rem">{{ selectedTable.toUpperCase() }}</small>
            </h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveRecord">
              <div v-for="col in formColumns" :key="'edit'+col" class="form-group mb-4">
                <label class="form-label" style="text-transform:capitalize">{{ col }}</label>
                <input v-if="col !== 'id'" type="text" v-model="form[col]" class="form-control" />
                <input v-else type="text" :value="form[col]" class="form-control bg-light" disabled title="ID Auto-Generado es Inmutable" />
              </div>
              
              <div class="alert alert-warning mb-4" style="background:#fffbeb; color:#d97706; padding:1rem; border-left:4px solid #f59e0b" v-if="selectedTable === 'usuario' && !editingId">
                <em>Nota SuperAdmin:</em> Si está insertando un usuario, la contraseña guardada será directamente el texto plano que ponga si no provee un HASH. Se recomienda hacerlo a través de la UI normal de Registro y luego venir aquí a editarle el ROL.
              </div>

              <button type="submit" class="btn btn-primary" style="width:100%; padding:0.8rem; font-size:1.1rem">
                {{ editingId ? 'Guardar Cambios' : 'Ejecutar Inserción' }}
              </button>
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

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const getConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });

const tables = ref([]);
const selectedTable = ref('');
const records = ref([]);
const loading = ref(false);

const showModal = ref(false);
const editingId = ref(null);
const form = ref({});

const columns = computed(() => {
  if (records.value.length === 0) return [];
  return Object.keys(records.value[0]);
});

// Since columns depend on records, if table is empty we might not know columns unless fetched via schema.
// We fallback to standard names hardcoded below if we can't extract them.
const formColumns = computed(() => {
  if (columns.value.length > 0) return columns.value;
  if (selectedTable.value === 'usuario') return ['id', 'tipoDocumento', 'numeroDocumento', 'nombreCompleto', 'email', 'telefono', 'passwordHash', 'rol'];
  if (selectedTable.value === 'entidad') return ['id', 'tipoEntidad', 'razonSocial', 'departamento', 'municipio', 'descripcionSector'];
  if (selectedTable.value === 'solicitud') return ['id', 'radicadoAlfaNum', 'tipo', 'esVulnerable', 'fechaRadicacion', 'conceptoMotivo', 'descripcion', 'estado', 'usuarioId', 'entidadId', 'agenteAsignadoId'];
  if (selectedTable.value === 'configuracionSistema') return ['id', 'llave', 'valorTexto', 'valorBooleano'];
  return [];
});

onMounted(async () => {
  try {
    const res = await axios.get(`${backendUrl}/api/superadmin/tablas`, getConfig());
    tables.value = res.data.data;
  } catch(e) {
    console.error(e);
  }
});

const fetchData = async () => {
  if (!selectedTable.value) return;
  loading.value = true;
  try {
    const res = await axios.get(`${backendUrl}/api/superadmin/tablas/${selectedTable.value}`, getConfig());
    records.value = res.data.data;
  } catch(e) {
    alert('Error obteniendo tabla genérica');
  } finally {
    loading.value = false;
  }
};

const formatValue = (val) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'object') return JSON.stringify(val);
  if (val && typeof val === 'string' && val.length > 60) return val.substring(0, 60) + '...';
  return val;
};

const openCreateModal = () => {
  editingId.value = null;
  form.value = {};
  if (formColumns.value.length > 0) {
    formColumns.value.forEach(c => { if(c !== 'id') form.value[c] = '' });
  }
  showModal.value = true;
};

const openEditModal = (row) => {
  editingId.value = row.id;
  form.value = {...row};
  showModal.value = true;
};

const closeModal = () => showModal.value = false;

const saveRecord = async () => {
  try {
    // Basic type parsing to prevent Prisma failing
    const parsedPayload = {};
    for (const key in form.value) {
      if (form.value[key] === 'NULL' || form.value[key] === '') {
        parsedPayload[key] = null;
      } else if (!isNaN(form.value[key]) && typeof form.value[key] === 'string' && form.value[key].trim() !== '') {
        // If it's pure number we might try to cast it, but some strings are numeric (numeroDocumento). Look out.
        // Prisma will crash if we cast String to Int. 
        // For simplicity of this generic CRUD, string goes as string unless the db throws an error!
        parsedPayload[key] = form.value[key]; 
      } else {
        parsedPayload[key] = form.value[key];
      }
    }
    
    // Hardcoded numeric conversions for known Prisma fields in backend
    if (parsedPayload.usuarioId) parsedPayload.usuarioId = parseInt(parsedPayload.usuarioId);
    if (parsedPayload.entidadId) parsedPayload.entidadId = parseInt(parsedPayload.entidadId);
    if (parsedPayload.agenteAsignadoId) parsedPayload.agenteAsignadoId = parseInt(parsedPayload.agenteAsignadoId);

    if (editingId.value) {
      await axios.put(`${backendUrl}/api/superadmin/tablas/${selectedTable.value}/${editingId.value}`, parsedPayload, getConfig());
    } else {
      await axios.post(`${backendUrl}/api/superadmin/tablas/${selectedTable.value}`, parsedPayload, getConfig());
    }
    closeModal();
    fetchData();
  } catch(e) {
    alert('Error guardando registro: ' + (e.response?.data?.message || e.message));
  }
};

const confirmDelete = async (id) => {
  if(!confirm('¿Estás seguro de borrar este registro permanentemente? (Esta acción no se puede deshacer)')) return;
  try {
    await axios.delete(`${backendUrl}/api/superadmin/tablas/${selectedTable.value}/${id}`, getConfig());
    fetchData();
  } catch(e) {
    alert('Acción denegada: ' + (e.response?.data?.message || 'Asegúrese de que el registro no tenga hijos o dependencias.'));
  }
}
</script>

<style scoped>
.modal-overlay { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); backdrop-filter:blur(2px); display:flex; justify-content:center; align-items:center; z-index:9999; }
.modal-content { background:white; padding:1.5rem; border-radius:8px; width:90%; max-width:650px; max-height:85vh; display:flex; flex-direction:column; box-shadow: 0 10px 25px rgba(0,0,0,0.2); box-sizing: border-box; overflow: hidden; }
.modal-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:1rem; }
.modal-body { overflow-y:auto; overflow-x:hidden; flex:1; padding-right:0.5rem; box-sizing: border-box; }
.btn-close { background:none; border:none; font-size:2rem; cursor:pointer; color:#888; line-height:1 }
.data-table { width:100%; border-collapse:collapse; background:white; }
.data-table th, .data-table td { padding:0.8rem; border-bottom:1px solid #eee; text-align:left; font-size:0.9rem; }
.data-table th { background:#f1f5f9; color:#475569 }
</style>
