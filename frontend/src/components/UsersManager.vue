<template>
  <div class="users-manager">
    <div class="header-actions">
      <h2>Gestión de Usuarios y Funcionarios</h2>
      <button class="btn btn-primary" @click="openModal('create')">
        + Registrar Nuevo
      </button>
    </div>

    <div v-if="loading" class="text-center mt-4 text-muted">
      Cargando base de datos de usuarios...
    </div>
    
    <div v-if="error" class="alert alert-error mt-4">
      {{ error }}
    </div>

    <div class="table-container mt-4" v-if="!loading && usuarios.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nombre Completo</th>
            <th>Rol / Nivel</th>
            <th>Área Asignada</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usuarios" :key="user.id" :class="{'inactive-row': !user.activo}">
            <td><strong>{{ user.tipoDocumento }} - {{ user.numeroDocumento }}</strong></td>
            <td>
              <div>{{ user.nombreCompleto }}</div>
              <div class="text-muted" style="font-size:0.8rem">{{ user.email || 'Sin correo' }}</div>
            </td>
            <td>
              <span class="badge" :class="getRoleBadgeClass(user.rol)">{{ user.rol }}</span>
            </td>
            <td>{{ user.area?.nombre || 'N/A' }}</td>
            <td>
              <span class="badge" :style="user.activo ? 'background:#dcfce7;color:#166534' : 'background:#fee2e2;color:#991b1b'">
                {{ user.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div style="display:flex; gap:0.5rem">
                <button class="btn btn-sm btn-secondary" @click="openModal('edit', user)">✏️</button>
                <button class="btn btn-sm" :class="user.activo ? 'btn-danger' : 'btn-success'" @click="toggleEstado(user)" :title="user.activo ? 'Desactivar' : 'Reactivar'">
                  {{ user.activo ? '🚫' : '✅' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!loading && usuarios.length === 0" class="text-center mt-4 text-muted p-4 glass-panel">
      No hay usuarios registrados en el sistema.
    </div>

    <!-- Modal Formulario CRUD -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content animate-fade-in" style="max-width: 600px;">
          <div class="modal-header">
            <h3>{{ isEdit ? 'Editar Registro' : 'Nuevo Usuario / Empleado' }}</h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          <form @submit.prevent="saveUser" class="modal-body p-4">
            
            <div style="display:flex; gap:1rem; margin-bottom:1rem">
              <div class="form-group" style="flex:1">
                <label class="form-label">Tipo Doc.</label>
                <select v-model="formData.tipoDocumento" class="form-control" required>
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div class="form-group" style="flex:2">
                <label class="form-label">Número de Documento</label>
                <input type="text" v-model="formData.numeroDocumento" class="form-control" required :disabled="isEdit" />
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Nombre Completo o Razón Social</label>
              <input type="text" v-model="formData.nombreCompleto" class="form-control" required />
            </div>
            
            <div style="display:flex; gap:1rem; margin-bottom:1rem">
              <div class="form-group" style="flex:1">
                <label class="form-label">Correo (Opcional)</label>
                <input type="email" v-model="formData.email" class="form-control" />
              </div>
              <div class="form-group" style="flex:1">
                <label class="form-label">Teléfono (Opcional)</label>
                <input type="text" v-model="formData.telefono" class="form-control" />
              </div>
            </div>

            <div class="form-group mb-4 p-3" style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:8px">
              <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-weight:bold; color:var(--primary-color)">
                <input type="checkbox" v-model="formData.esFuncionario" style="width:18px; height:18px;" />
                ¿Es este usuario un Funcionario / Empleado Interno?
              </label>
            </div>

            <div v-if="formData.esFuncionario" class="animate-fade-in" style="background:#f0f9ff; padding:1rem; border-radius:8px; border:1px solid #bae6fd; margin-bottom:1rem">
              <div class="form-group mb-3">
                <label class="form-label">Nivel de Acceso (Rol)</label>
                <select v-model="formData.rol" class="form-control" required>
                  <option value="AGENTE">Agente Base (Responde PQRS)</option>
                  <option value="GESTOR">Gestor de Área (Coordina)</option>
                  <option value="ADMIN">Administrador General</option>
                  <option value="SUPERADMIN">Super Administrador (Técnico)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Área Organizacional Asociada</label>
                <select v-model="formData.areaId" class="form-control" required>
                  <option :value="null" disabled>Seleccione el área del funcionario...</option>
                  <option v-for="area in areasDb" :key="area.id" :value="area.id">
                    {{ area.nombre }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="!isEdit && formData.esFuncionario" class="alert mb-4" style="background:#fffbeb; color:#92400e; border:1px solid #fde68a; font-size:0.85rem">
              ⚠️ Al guardar, se generará una contraseña automática para el funcionario: <strong>Pqrs{{ new Date().getFullYear() }}*</strong>
            </div>

            <div class="form-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Guardar Registro' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const usuarios = ref([]);
const areasDb = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');

const showModal = ref(false);
const isEdit = ref(false);
const formData = ref({ 
  id: null, 
  tipoDocumento: 'CC', 
  numeroDocumento: '', 
  nombreCompleto: '',
  email: '',
  telefono: '',
  esFuncionario: false,
  rol: 'AGENTE',
  areaId: null
});

const getToken = () => localStorage.getItem('auth_token');

onMounted(() => {
  fetchData();
});

const fetchData = async () => {
  loading.value = true;
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [resUsers, resAreas] = await Promise.all([
      axios.get(`${backendUrl}/api/usuarios`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      axios.get(`${backendUrl}/api/areas`, { headers: { Authorization: `Bearer ${getToken()}` } })
    ]);
    
    usuarios.value = resUsers.data.data;
    areasDb.value = resAreas.data.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar información';
  } finally {
    loading.value = false;
  }
};

const getRoleBadgeClass = (rol) => {
  if(rol === 'USUARIO_EXTERNO') return '';
  if(rol === 'AGENTE') return 'role-agente';
  if(rol === 'GESTOR') return 'role-gestor';
  if(rol === 'ADMIN' || rol === 'SUPERADMIN') return 'role-admin';
  return '';
};

const openModal = (mode, user = null) => {
  error.value = '';
  if (mode === 'create') {
    isEdit.value = false;
    formData.value = { 
      id: null, tipoDocumento: 'CC', numeroDocumento: '', nombreCompleto: '',
      email: '', telefono: '', esFuncionario: false, rol: 'AGENTE', areaId: null
    };
  } else if (mode === 'edit') {
    isEdit.value = true;
    const esFunc = user.rol !== 'USUARIO_EXTERNO';
    formData.value = { 
      id: user.id, tipoDocumento: user.tipoDocumento, numeroDocumento: user.numeroDocumento, 
      nombreCompleto: user.nombreCompleto, email: user.email, telefono: user.telefono,
      esFuncionario: esFunc, rol: esFunc ? user.rol : 'AGENTE', areaId: user.areaId
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveUser = async () => {
  saving.value = true;
  error.value = '';
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const payload = { ...formData.value };

    if (isEdit.value) {
      await axios.put(`${backendUrl}/api/usuarios/${formData.value.id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } else {
      await axios.post(`${backendUrl}/api/usuarios`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    }
    
    await fetchData();
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al procesar petición');
  } finally {
    saving.value = false;
  }
};

const toggleEstado = async (user) => {
  const accion = user.activo ? 'desactivar' : 'reactivar';
  if (confirm(`¿Estás seguro que deseas ${accion} al usuario ${user.nombreCompleto}?`)) {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.put(`${backendUrl}/api/usuarios/${user.id}/toggle-activo`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      await fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar estado');
    }
  }
};
</script>

<style scoped>
.users-manager {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 1rem;
}
.header-actions h2 {
  color: var(--primary-color);
  margin: 0;
}
.table-container {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
}
.data-table th {
  background: #f8fafc;
  color: #475569;
}
.inactive-row td {
  opacity: 0.6;
  background: #fdfdfd;
}

.badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  background: #e2e8f0;
  color: #334155;
}
.role-agente { background: #e0f2fe; color: #0284c7; }
.role-gestor { background: #fef3c7; color: #d97706; }
.role-admin { background: #fee2e2; color: #dc2626; }

.btn-danger {
  background: transparent;
  border: 1px solid #fecaca;
}
.btn-danger:hover { background: #fee2e2; }
.btn-success {
  background: transparent;
  border: 1px solid #bbf7d0;
}
.btn-success:hover { background: #dcfce7; }

/* Modal Styles */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(3px);
  display: flex; justify-content: center; align-items: center; z-index: 9999;
}
.modal-content {
  background: white; padding: 1.5rem 2rem; border-radius: 8px;
  width: 90%; max-height: 85vh; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;
}
.modal-header h3 { margin: 0; color: var(--primary-color); font-size: 1.4rem; }
.btn-close {
  background: transparent; color: #888; border: none; font-size: 2rem;
  cursor: pointer; line-height: 1; transition: color 0.2s;
}
.btn-close:hover { color: #ef4444; }
.modal-body {
  overflow-y: auto; flex: 1;
}
</style>
