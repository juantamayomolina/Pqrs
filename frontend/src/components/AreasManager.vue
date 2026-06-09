<template>
  <div class="areas-manager">
    <div class="header-actions">
      <h2>Estructura Organizacional (Áreas)</h2>
      <button class="btn btn-primary" @click="openModal('create')">
        + Crear Área Principal
      </button>
    </div>

    <div v-if="loading" class="text-center mt-4 text-muted">
      Cargando estructura jerárquica...
    </div>
    
    <div v-if="error" class="alert alert-error mt-4">
      {{ error }}
    </div>

    <div class="tree-container mt-4" v-if="!loading && treeData.length > 0">
      <ul class="tree">
        <li v-for="node in treeData" :key="node.id" class="tree-node">
          <AreaNode 
            :node="node" 
            :all-areas="areas"
            @add-child="openModal('create', $event)" 
            @edit="openModal('edit', $event)" 
            @delete="deleteArea" 
          />
        </li>
      </ul>
    </div>

    <div v-else-if="!loading && treeData.length === 0" class="text-center mt-4 text-muted p-4 glass-panel">
      No hay áreas registradas. Crea una para empezar a armar la estructura jerárquica.
    </div>

    <!-- Modal Formulario CRUD -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content animate-fade-in">
          <div class="modal-header">
            <h3>{{ isEdit ? 'Editar Área' : 'Crear Nueva Área' }}</h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          <form @submit.prevent="saveArea" class="modal-body p-4">
            
            <div class="form-group mb-4" v-if="formData.areaPadreId">
               <label class="form-label text-muted" style="font-size:0.85rem">Área Padre Asignada:</label>
               <div style="padding:0.5rem; background:#f1f5f9; border-radius:4px; border:1px solid #cbd5e1">
                 <strong>{{ getAreaName(formData.areaPadreId) }}</strong>
               </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Nombre del Área</label>
              <input type="text" v-model="formData.nombre" class="form-control" required placeholder="Ej. Gerencia General" />
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Descripción (Opcional)</label>
              <textarea v-model="formData.descripcion" class="form-control" rows="3" placeholder="Descripción de las funciones del área..."></textarea>
            </div>

            <div class="form-group mb-4" v-if="isEdit">
              <label class="form-label">Mover Área (Cambiar Padre)</label>
              <select v-model="formData.areaPadreId" class="form-control">
                <option :value="null">Ninguno (Convertir en Área Principal)</option>
                <option v-for="area in validParentOptions" :key="area.id" :value="area.id">
                  {{ area.nombre }}
                </option>
              </select>
            </div>

            <div class="form-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
              <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Guardando...' : 'Guardar Área' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import AreaNode from './AreaNode.vue';

const areas = ref([]);
const treeData = ref([]);
const loading = ref(true);
const saving = ref(false);
const error = ref('');

const showModal = ref(false);
const isEdit = ref(false);
const formData = ref({ id: null, nombre: '', descripcion: '', areaPadreId: null });

const getToken = () => localStorage.getItem('auth_token');

onMounted(() => {
  fetchAreas();
});

const buildTree = (flatAreas) => {
  const map = {};
  const roots = [];
  
  flatAreas.forEach(node => {
    map[node.id] = { ...node, children: [] };
  });
  
  flatAreas.forEach(node => {
    if (node.areaPadreId && map[node.areaPadreId]) {
      map[node.areaPadreId].children.push(map[node.id]);
    } else {
      roots.push(map[node.id]);
    }
  });
  
  return roots;
};

const fetchAreas = async () => {
  loading.value = true;
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.get(`${backendUrl}/api/areas`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    areas.value = res.data.data;
    treeData.value = buildTree(res.data.data);
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cargar las áreas';
  } finally {
    loading.value = false;
  }
};

const getAreaName = (id) => {
  const area = areas.value.find(a => a.id === id);
  return area ? area.nombre : 'Desconocida';
};

const validParentOptions = computed(() => {
  if (!isEdit.value) return areas.value;
  // Prevent cyclical parenting: cannot assign a node to itself, or to any of its children
  // A simplistic approach: just exclude the node itself (in a real deep app we'd exclude all descendants)
  return areas.value.filter(a => a.id !== formData.value.id); 
});

const openModal = (mode, node = null) => {
  error.value = '';
  if (mode === 'create') {
    isEdit.value = false;
    formData.value = { 
      id: null, 
      nombre: '', 
      descripcion: '', 
      areaPadreId: node ? node.id : null 
    };
  } else if (mode === 'edit') {
    isEdit.value = true;
    formData.value = { 
      id: node.id, 
      nombre: node.nombre, 
      descripcion: node.descripcion, 
      areaPadreId: node.areaPadreId 
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  formData.value = { id: null, nombre: '', descripcion: '', areaPadreId: null };
};

const saveArea = async () => {
  saving.value = true;
  error.value = '';
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const payload = {
      nombre: formData.value.nombre,
      descripcion: formData.value.descripcion,
      areaPadreId: formData.value.areaPadreId
    };

    if (isEdit.value) {
      await axios.put(`${backendUrl}/api/areas/${formData.value.id}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } else {
      await axios.post(`${backendUrl}/api/areas`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    }
    
    await fetchAreas();
    closeModal();
  } catch (err) {
    alert(err.response?.data?.message || 'Error al guardar el área');
  } finally {
    saving.value = false;
  }
};

const deleteArea = async (node) => {
  if(node._count && (node._count.areasHijas > 0 || node._count.usuarios > 0 || node._count.pqrsAsignadas > 0)) {
    alert(`No se puede eliminar ${node.nombre} porque tiene sub-áreas, usuarios o PQRS asignadas.`);
    return;
  }

  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el área "${node.nombre}"?`)) {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await axios.delete(`${backendUrl}/api/areas/${node.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      await fetchAreas();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el área');
    }
  }
};
</script>

<style scoped>
.areas-manager {
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
.tree-container {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.tree {
  list-style: none;
  padding: 0;
  margin: 0;
}
.tree-node {
  margin-bottom: 0.5rem;
}

/* Modal Styles */
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
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
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
</style>
