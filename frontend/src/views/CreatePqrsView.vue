<template>
  <div class="create-pqrs glass-panel animate-fade-in" style="max-width: 900px; margin: 0 auto;">
    <h2>Radicar Nueva PQRS</h2>
    <p class="text-muted mb-4">Complete los datos a continuación para registrar su solicitud formal frente a las entidades.</p>
    
    <form @submit.prevent="submitForm">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success text-center">
        <h3 style="color:var(--secondary-dark); margin-bottom:1rem">¡PQRS Radicada Exitosamente!</h3>
        <p style="font-size:1.1rem">Su código oficial es <strong style="font-size:1.5rem">{{ successData.radicado }}</strong></p>
        <br>
        <p>Guarde este código en un sitio seguro. Con él podrá dar seguimiento a las respuestas y caducidad según lo emitido por la Ley 1755 de 2015.</p>
        <br>
        <router-link to="/consultar" class="btn btn-primary">Ir a Consultar Estado</router-link>
      </div>

      <template v-if="!success">
        <div class="form-sections flex gap-8">
          <!-- Col 1: Datos Usuario -->
          <div style="flex:1" v-if="!isLoggedIn">
            <h3 style="border-bottom: 2px solid var(--border-color); padding-bottom:0.5rem">1. Ciudadano (Radicador)</h3>
            <div class="form-group mt-4">
              <label class="form-label">Tipo de Documento</label>
              <select v-model="form.tipoDocumento" class="form-control" required>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="CE">Cédula de Extranjería</option>
                <option value="NIT">NIT Institucional</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Número de Documento</label>
              <input type="text" v-model="form.numeroDocumento" class="form-control" @blur="buscarUsuario" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre Completo</label>
              <input type="text" v-model="form.nombreCompleto" class="form-control" :disabled="isUserReadOnly" required />
            </div>
            <div class="form-group">
              <label class="form-label">Correo Electrónico (Para recibir notificaciones)</label>
              <input type="email" v-model="form.email" class="form-control" :disabled="isUserReadOnly" />
            </div>
            <div class="form-group bg-light" style="flex-direction:row; align-items:center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius-sm)">
              <input type="checkbox" v-model="form.esVulnerable" id="vul" style="width: 1.25rem; height: 1.25rem; accent-color: var(--primary-color);" />
              <label for="vul" class="form-label" style="margin:0; cursor:pointer;" title="Permite acelerar los tramites frente a entidades según marco legal">¿Pertenece a Población Vulnerable?</label>
            </div>
          </div>
          
          <div style="flex:1" v-else>
            <h3 style="border-bottom: 2px solid var(--border-color); padding-bottom:0.5rem">1. Radicador</h3>
            <div class="alert alert-success mt-4">
              <p><strong>Sesión Activa:</strong> Radicando a nombre de {{ loggedUser.nombreCompleto }} ({{ loggedUser.numeroDocumento }}).</p>
              <br><br>
              <em class="text-muted" style="font-size: 0.9rem">Sus datos personales han sido vinculados automáticamente a esta solicitud por motivos de trazabilidad y seguridad institucional.</em>
            </div>
          </div>

          <!-- Col 2: Datos Solicitud -->
          <div style="flex:1">
            <h3 style="border-bottom: 2px solid var(--border-color); padding-bottom:0.5rem">2. Detalles de Solicitud</h3>
            <div class="form-group">
              <label class="form-label">Tipo de Solicitud (Clasificación)</label>
              <select v-model="form.tipoSolicitud" class="form-control" required>
                <option v-for="tipo in tiposPqrs" :key="tipo.id" :value="tipo.codigo">
                  {{ tipo.nombre }} ({{ tipo.diasHabiles }} días hab.){{ tipo.requiereAnexoObligatorio ? ' 📎 Anexo Obligatorio' : '' }}
                </option>
              </select>
            </div>

            <div v-if="tipoSeleccionadoObj?.requiereAnexoObligatorio" class="alert alert-warning mb-3" style="background:#fffbeb; border-left:5px solid #f59e0b; color:#92400e; padding:1rem; border-radius:8px;">
              <strong>⚠️ Adjunto Obligatorio Requerido:</strong>
              <p style="margin-top:0.3rem; font-size:0.9rem; margin-bottom:0;">
                {{ tipoSeleccionadoObj.mensajeAnexoObligatorio || 'Para este tipo de solicitud es obligatorio adjuntar el archivo/documento de soporte.' }}
              </p>
            </div>

            <div class="form-group">
              <label class="form-label">Motivo o Asunto Principal</label>
              <input type="text" v-model="form.conceptoMotivo" class="form-control" placeholder="Ej: Solicitud historia clínica" required />
            </div>
            <div class="form-group">
              <label class="form-label">Desarrollo y Contenido</label>
              <textarea v-model="form.contenido" class="form-control" rows="5" placeholder="Exponga los hechos..." required></textarea>
            </div>
            <div class="form-group mt-4 p-4" style="background:#f1f5f9; border:1px dashed #cbd5e1; border-radius:8px">
              <label class="form-label mb-2" style="font-weight:bold; color:var(--primary-dark)">
                📎 Anexar Material Probatorio (Máx 5 MB Total)
                <span v-if="tipoSeleccionadoObj?.requiereAnexoObligatorio" style="color:#dc2626;"> * Requerido</span>
              </label>
              <p class="text-muted" style="font-size:0.85rem; margin-top:0; margin-bottom:1rem">Puede subir hasta 5 adjuntos (PDF, Word, Excel, Imagenes o comprimido ZIP).</p>
              <input type="file" ref="fileInput" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt" @change="handleFileUpload" class="form-control" style="background:white; padding: 0.5rem" />
              
              <div v-if="archivosSeleccionados.length > 0" class="mt-2">
                <ul style="padding-left: 1.5rem; font-size:0.85rem; color:#475569">
                  <li v-for="(f, i) in archivosSeleccionados" :key="i">
                    {{ f.name }} ({{ (f.size / 1024 / 1024).toFixed(2) }} MB)
                  </li>
                </ul>
                <p style="font-weight:bold; font-size:0.9rem" :style="{ color: calculoExcede ? 'var(--danger-color)' : 'var(--success-color)' }">
                  Peso Estimado Total: {{ (totalSizeCalculado / 1024 / 1024).toFixed(2) }} / 5.00 MB
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="text-center mt-4" style="border-top: 1px solid var(--border-color); padding-top: 2rem;">
          <button type="submit" class="btn btn-primary" :disabled="loading" style="width: 250px; font-size: 1.1rem; padding: 1rem;">
            <span v-if="loading">📡 Radicando...</span>
            <span v-else>✅ Radicar Solicitud Oficial</span>
          </button>
        </div>
      </template>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const form = ref({
  tipoDocumento: 'CC', numeroDocumento: '', nombreCompleto: '', email: '', esVulnerable: false,
  tipoSolicitud: 'PETICION', conceptoMotivo: '', contenido: ''
});

const tiposPqrs = ref([]);
const archivosSeleccionados = ref([]);
const fileInput = ref(null);
const totalSizeCalculado = ref(0);
const calculoExcede = ref(false);

const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);
  archivosSeleccionados.value = files;
  let total = 0;
  for(let file of files) total += file.size;
  totalSizeCalculado.value = total;
  calculoExcede.value = total > 5 * 1024 * 1024;
};

const loading = ref(false);
const error = ref('');
const success = ref(false);
const successData = ref({});
const isUserReadOnly = ref(false);
const isLoggedIn = ref(false);
const loggedUser = ref(null);

const tipoSeleccionadoObj = computed(() => {
  return tiposPqrs.value.find(t => t.codigo === form.value.tipoSolicitud) || null;
});

const cargarTiposPqrs = async () => {
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.get(`${backendUrl}/api/tipos-pqrs`);
    if (res.data && res.data.data) {
      tiposPqrs.value = res.data.data;
      if (tiposPqrs.value.length > 0 && !form.value.tipoSolicitud) {
        form.value.tipoSolicitud = tiposPqrs.value[0].codigo;
      }
    }
  } catch (err) {
    console.error('Error cargando tipos de PQRS:', err);
    // Fallback básico si la API no estuviera disponible
    tiposPqrs.value = [
      { id: 1, codigo: 'PETICION', nombre: 'Petición General', diasHabiles: 15, requiereAnexoObligatorio: false },
      { id: 2, codigo: 'QUEJA', nombre: 'Queja', diasHabiles: 15, requiereAnexoObligatorio: false },
      { id: 3, codigo: 'RECLAMO', nombre: 'Reclamo', diasHabiles: 15, requiereAnexoObligatorio: false }
    ];
  }
};

onMounted(() => {
  cargarTiposPqrs();
  const token = localStorage.getItem('auth_token');
  const user = localStorage.getItem('auth_user');
  if (token && user) {
    isLoggedIn.value = true;
    loggedUser.value = JSON.parse(user);
    form.value.numeroDocumento = loggedUser.value.numeroDocumento;
    form.value.tipoDocumento = loggedUser.value.tipoDocumento;
    form.value.nombreCompleto = loggedUser.value.nombreCompleto;
    form.value.email = loggedUser.value.email || '';
  }
});

const buscarUsuario = async () => {
  if (!form.value.numeroDocumento || !form.value.tipoDocumento) return;
  
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.get(`${backendUrl}/api/usuarios/buscar`, {
      params: {
        tipoDocumento: form.value.tipoDocumento,
        numeroDocumento: form.value.numeroDocumento
      }
    });

    if (res.data && res.data.data) {
      form.value.nombreCompleto = res.data.data.nombreCompleto;
      form.value.email = res.data.data.email || '';
      isUserReadOnly.value = true;
    }
  } catch (err) {
    if (isUserReadOnly.value) {
      form.value.nombreCompleto = '';
      form.value.email = '';
    }
    isUserReadOnly.value = false;
  }
};

const submitForm = async () => {
  if (tipoSeleccionadoObj.value?.requiereAnexoObligatorio && archivosSeleccionados.value.length === 0) {
    error.value = tipoSeleccionadoObj.value.mensajeAnexoObligatorio || 'Es obligatorio adjuntar al menos un archivo de soporte para radicar esta solicitud.';
    return;
  }

  if (archivosSeleccionados.value.length > 5) {
    error.value = 'Ha excedido la cantidad máxima legal de 5 anexos permitidos. Por favor comprimir evidencias amplias en un ZIP.';
    return;
  }
  if (calculoExcede.value) {
    error.value = 'El peso total de los archivos supera el umbral de 5 MB dictaminado normativamente.';
    return;
  }

  loading.value = true;
  error.value = '';
  
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Serializando el FormData Nativo
    const formData = new FormData();
    for (let key in form.value) {
      formData.append(key, form.value[key]);
    }
    for (let i = 0; i < archivosSeleccionados.value.length; i++) {
        formData.append('archivos', archivosSeleccionados.value[i]);
    }

    const res = await axios.post(`${backendUrl}/api/pqrs`, formData);
    
    successData.value = res.data;
    success.value = true;
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al conectar con la API central. Inténtelo más tarde.';
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.alert {
  padding: 1.5rem;
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  box-shadow: var(--shadow-sm);
}
.alert-error {
  background-color: #fef2f2;
  color: var(--danger-color);
  border-left: 5px solid var(--danger-color);
}
.alert-success {
  background-color: #f0fdf4;
  color: var(--secondary-dark);
  border-left: 5px solid var(--secondary-color);
}
.bg-light {
  background-color: var(--bg-color);
}
</style>
