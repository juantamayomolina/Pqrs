<template>
  <div class="setup-container">
    <div class="glass-card setup-card">
      <div class="setup-header">
        <h1>Bienvenido al Sistema de Gestión de PQRS</h1>
        <p>Parece que es la primera vez que inicia el sistema. Configuremos la identidad de la entidad antes de continuar.</p>
      </div>

      <form @submit.prevent="submitSetup" class="setup-form">
        <div class="form-group">
          <label>Tipo de Persona</label>
          <select v-model="formData.tipoPersona" required>
            <option value="" disabled>Seleccione...</option>
            <option value="NATURAL">Persona Natural</option>
            <option value="JURIDICA">Persona Jurídica</option>
          </select>
        </div>

        <div class="form-group">
          <label>Razón Social (o Nombre de la Institución)</label>
          <input type="text" v-model="formData.razonSocial" placeholder="Ej. Colegio San José, Empresa XYZ" required />
        </div>

        <div class="form-group">
          <label>Descripción de la Entidad</label>
          <textarea v-model="formData.descripcion" placeholder="Breve descripción de los servicios o actividad principal" rows="3" required></textarea>
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Configurando...' : 'Finalizar Configuración' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const formData = ref({
  tipoPersona: '',
  razonSocial: '',
  descripcion: ''
});

const loading = ref(false);
const error = ref(null);

const submitSetup = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await axios.post(`${backendUrl}/api/setup`, formData.value);
    
    // Configuración exitosa. Hacemos refresh para reiniciar el estado de la app
    window.location.href = '/'; 
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al conectar con el servidor';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.setup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem;
}

.setup-card {
  max-width: 600px;
  width: 100%;
  padding: 3rem;
  text-align: left;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.setup-header {
  margin-bottom: 2rem;
  text-align: center;
}

.setup-header h1 {
  font-size: 2rem;
  color: #1e3a8a;
  margin-bottom: 0.5rem;
}

.setup-header p {
  color: #555;
  font-size: 1.1rem;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #333;
}

input, select, textarea {
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  transition: border-color 0.3s;
}

input:focus, select:focus, textarea:focus {
  border-color: #1e3a8a;
  outline: none;
}

.btn-primary {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #1e3a8a;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #172554;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-msg {
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
}
</style>
