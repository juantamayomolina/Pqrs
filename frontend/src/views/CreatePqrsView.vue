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
          <div style="flex:1">
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
              <input type="text" v-model="form.numeroDocumento" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Nombre Completo</label>
              <input type="text" v-model="form.nombreCompleto" class="form-control" required />
            </div>
            <div class="form-group">
              <label class="form-label">Correo Electrónico (Para recibir notificaciones)</label>
              <input type="email" v-model="form.email" class="form-control" />
            </div>
            <div class="form-group bg-light" style="flex-direction:row; align-items:center; gap: 0.75rem; padding: 1rem; border-radius: var(--radius-sm)">
              <input type="checkbox" v-model="form.esVulnerable" id="vul" style="width: 1.25rem; height: 1.25rem; accent-color: var(--primary-color);" />
              <label for="vul" class="form-label" style="margin:0; cursor:pointer;" title="Permite acelerar los tramites frente a entidades según marco legal">¿Pertenece a Población Vulnerable?</label>
            </div>
          </div>

          <!-- Col 2: Datos Solicitud -->
          <div style="flex:1">
            <h3 style="border-bottom: 2px solid var(--border-color); padding-bottom:0.5rem">2. Detalles de Solicitud</h3>
            <div class="form-group mt-4 flex gap-4" style="flex-direction: row;">
              <div style="flex: 1">
                <label class="form-label">Cód. Entidad</label>
                <input type="text" v-model="form.entidadCodigo" class="form-control" placeholder="Ej: MIN-SALUD" required />
              </div>
              <div style="flex: 2">
                <label class="form-label">Nombre Mínisterio o Entidad</label>
                <input type="text" v-model="form.entidadNombre" class="form-control" placeholder="Ministerio de Salud" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Tipo de Solicitud (Clasificación)</label>
              <select v-model="form.tipoSolicitud" class="form-control" required>
                <option value="PETICION">Petición General (15 días hab.)</option>
                <option value="QUEJA">Queja (15 días hab.)</option>
                <option value="RECLAMO">Reclamo (15 días hab.)</option>
                <option value="SUGERENCIA">Sugerencia (15 días hab.)</option>
                <option value="INFORMACION">Petición de Info / Docs (10 días hab.)</option>
                <option value="CONSULTA">Consulta a Entidad (30 días hab.)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Motivo o Asunto Principal</label>
              <input type="text" v-model="form.conceptoMotivo" class="form-control" placeholder="Ej: Solicitud historia clínica" required />
            </div>
            <div class="form-group">
              <label class="form-label">Desarrollo y Contenido</label>
              <textarea v-model="form.contenido" class="form-control" rows="5" placeholder="Exponga los hechos..." required></textarea>
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
import { ref } from 'vue';
import axios from 'axios';

const form = ref({
  tipoDocumento: 'CC', numeroDocumento: '', nombreCompleto: '', email: '', esVulnerable: false,
  entidadCodigo: '', entidadNombre: '', tipoSolicitud: 'PETICION', conceptoMotivo: '', contenido: ''
});

const loading = ref(false);
const error = ref('');
const success = ref(false);
const successData = ref({});

const submitForm = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.post('http://localhost:3000/api/pqrs', form.value);
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
