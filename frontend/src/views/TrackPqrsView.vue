<template>
  <div class="track-pqrs glass-panel animate-fade-in" style="max-width: 850px; margin: 0 auto;">
    <h2>Consultar Estado de Trámite</h2>
    <p class="text-muted mb-4">Ingrese aquí su Código Radicado y verifique el avance de sus Peticiones institucionales.</p>

    <form @submit.prevent="buscarPqr" class="flex gap-4 align-center mb-4 p-4" style="background:var(--bg-color); border-radius: var(--radius-md);">
      <input type="text" v-model="radicado" class="form-control" style="flex:1; border:none; padding:1.2rem; box-shadow:var(--shadow-sm); font-size:1.1rem" placeholder="Ej: PQR-2026414-87421" required />
      <button type="submit" class="btn btn-primary" :disabled="loading" style="padding:1.2rem 2rem; font-size:1.1rem">
        {{ loading ? 'Buscando...' : '🔍 Buscar' }}
      </button>
    </form>

    <div v-if="error" class="alert alert-error animate-fade-in text-center">
      <h3>Lo sentimos.</h3>
      <p>{{ error }}</p>
    </div>

    <div v-if="resultado" class="result-card animate-fade-in mt-4">
      <div class="status-banner" :class="resultado.estado.toLowerCase()">
        <div class="flex justify-between align-center">
          <div>
            <h2 style="color:white; margin:0; font-size: 1.8rem">ESTADO: </h2>
            <p style="color:white; margin:0; opacity: 0.9; margin-top:0.2rem">{{ resultado.estado }}</p>
          </div>
          <div class="text-right">
             <h2 style="color:white; margin:0; font-size:1.8rem">No. DE RADICADO:</h2>
             <p style="color:white; margin:0; opacity:0.9">{{ resultado.radicadoAlfaNum }}</p>
          </div>
        </div>
      </div>

      <div class="flex gap-4 mt-4">
        <!-- CIUDADANO INFO -->
        <div class="info-box">
          <div class="box-header flex align-center gap-4">
            <span style="font-size:1.5rem">👤</span><h4 style="margin:0">Datos Radicador</h4>
          </div>
          <div style="margin-top:1rem">
            <p><strong>Cédula/NIT:</strong> {{ resultado.usuario.numeroDocumento }}</p>
            <p><strong>Nombre:</strong> {{ resultado.usuario.nombreCompleto }}</p>
          </div>
        </div>
        
        <!-- ENTIDAD INFO -->
        <div class="info-box">
          <div class="box-header flex align-center gap-4">
             <span style="font-size:1.5rem">🏛️</span><h4 style="margin:0">Información Entidad</h4>
          </div>
          <div style="margin-top:1rem">
            <p><strong>Clasificación:</strong> Solicitud de Tipo {{ resultado.tipo }}</p>
            <p><strong>Oficina Asignada:</strong> {{ resultado.entidad.nombre }} <span style="font-size:0.8rem" class="text-muted">({{resultado.entidad.codigo}})</span></p>
          </div>
        </div>
      </div>

      <!-- TIMELINE INFO -->
      <div class="info-box mt-4 timeline-box">
        <h4 style="color: #92400e; margin-bottom: 1rem; border-bottom: 1px solid #fcd34d; padding-bottom: 0.5rem">⏱️ Tiempos de Respuesta - Ley 1755</h4>
        <div class="flex justify-between align-center">
          <div>
            <p class="text-muted" style="margin:0; font-size:0.9rem">FECHA INICIO TRAMITE</p>
            <p style="font-size:1.1rem; font-weight:600">📅 {{ formatDate(resultado.fechaRadicacion) }}</p>
          </div>
          <div style="text-align:right">
            <p class="text-muted" style="margin:0; font-size:0.9rem">FECHA TOPE RESPUESTA</p>
            <p style="font-size:1.1rem; font-weight:700; color:var(--danger-color)">🛑 {{ formatDate(resultado.fechaMaximaRespuesta) }}</p>
          </div>
        </div>
      </div>

      <!-- SOLICITUD CONTENIDO -->
      <div class="info-box mt-4" style="background:var(--bg-color)">
        <h4>📜 "{{ resultado.conceptoMotivo }}"</h4>
        <p class="text-muted" style="margin-top:1rem; font-size:1.05rem">{{ resultado.contenido }}</p>
      </div>

      <!-- AMPLIACION DE INFORMACION -->
      <div v-if="resultado.estado === 'ESPERANDO_AMPLIACION'" class="info-box mt-4" style="border-color:#3b82f6; background-color:#eff6ff">
        <h4 style="color:#1d4ed8; margin-bottom: 1rem;">⚠️ Requerimiento de Ampliación de Información</h4>
        <p class="text-muted">La autoridad a cargo no ha podido dar respuesta de fondo a su requerimiento porque requiere complementariedad de pruebas o afirmaciones. <strong>(Ley 1755 de 2015)</strong>.</p>
        <p class="text-muted">Describa aquí la información para reactivar la vigencia de su expediente:</p>
        
        <form @submit.prevent="aportarAmpliacion" class="mt-4">
          <textarea v-model="aporteForm.contenido" class="form-control mb-4" rows="4" placeholder="Detalle aquí las justificaciones o pruebas..." required></textarea>
          <button type="submit" class="btn btn-primary" :disabled="aportando">
            {{ aportando ? 'Enviando Registro...' : 'Aportar Documentación Faltante' }}
          </button>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const radicado = ref('');
const loading = ref(false);
const error = ref('');
const resultado = ref(null);

const aporteForm = ref({ contenido: '' });
const aportando = ref(false);

const buscarPqr = async () => {
  loading.value = true;
  error.value = '';
  resultado.value = null;

  try {
    const res = await axios.get(`http://localhost:3000/api/pqrs/${radicado.value}`);
    resultado.value = res.data.data;
  } catch (err) {
    error.value = err.response?.status === 404 
       ? `No hemos encontrado evidencia u operación oficial para el radicado ${radicado.value}. Compruebe el código.` 
       : 'Hubo un error de conexión con el Servidor Central.';
  } finally {
    loading.value = false;
  }
};

const aportarAmpliacion = async () => {
  aportando.value = true;
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await axios.post(`${backendUrl}/api/pqrs/aportar/${resultado.value.radicadoAlfaNum}`, aporteForm.value);
    alert('Aporte recibido por la entidad. Sus tiempos de respuesta (SLA) han sido reactivados y notificados oficialmente.');
    aporteForm.value.contenido = '';
    await buscarPqr(); // Reload
  } catch(e) {
    alert('Fallo al procesar el aporte: ' + (e.response?.data?.message || e.message));
  } finally {
    aportando.value = false;
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
  });
};
</script>

<style scoped>
.alert { padding: 1.5rem; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.alert-error { background-color: #fef2f2; color: var(--danger-color); border-left: 5px solid var(--danger-color); }
.status-banner {
  padding: 2rem;
  border-radius: var(--radius-lg);
  color: white;
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.2);
}
.status-banner.abierto { background-color: var(--primary-color); }
.status-banner.en_tramite { background-color: #f59e0b; }
.status-banner.esperando_ampliacion { background-color: #3b82f6; }
.status-banner.cerrado { background-color: var(--secondary-dark); }
.info-box {
  background: white;
  padding: 1.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  flex: 1;
}
.box-header { border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
.timeline-box { background-color: #fffbeb; border-color: #fcd34d; }
</style>
