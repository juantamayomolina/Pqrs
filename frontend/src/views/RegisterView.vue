<template>
  <div class="auth-container animate-fade-in">
    <div class="glass-card auth-card">
      <h2 class="text-center" style="color:var(--primary-color); margin-bottom: 0.5rem">Regístrate</h2>
      <p class="text-center text-muted mb-4">Crea una cuenta gratuita para hacer seguimiento exacto de todos tus trámites.</p>
      
      <form @submit.prevent="handleRegister">
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        
        <div class="form-group mb-4 flex gap-4" style="flex-direction:row">
          <div style="flex:1">
            <label class="form-label">Tipo Doc.</label>
            <select v-model="form.tipoDocumento" class="form-control" required>
              <option value="CC">CC</option>
              <option value="CE">CE</option>
              <option value="NIT">NIT</option>
            </select>
          </div>
          <div style="flex:2">
            <label class="form-label">Número de Documento</label>
            <input type="text" v-model="form.numeroDocumento" class="form-control" placeholder="Documento" required>
          </div>
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Nombre Completo</label>
          <input type="text" v-model="form.nombreCompleto" class="form-control" placeholder="Tu nombre completo" required>
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Correo Electrónico</label>
          <input type="email" v-model="form.email" class="form-control" placeholder="tu@email.com" required>
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Contraseña</label>
          <input type="password" v-model="form.password" class="form-control" placeholder="Configura tu clave" required>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem; font-size:1.1rem" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Crear Cuenta' }}
        </button>
      </form>

      <div class="auth-footer mt-4 text-center">
        <p>¿Ya tienes cuenta? <router-link to="/login" style="color:var(--secondary-color); font-weight:600">Inicia sesión</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = ref({ tipoDocumento: 'CC', numeroDocumento: '', nombreCompleto: '', email: '', password: '' });
const loading = ref(false);
const error = ref(null);

const handleRegister = async () => {
  error.value = null;
  loading.value = true;
  
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    await axios.post(`${backendUrl}/api/auth/register`, form.value);
    
    // Auto-login after successful translation or redirect
    router.push('/login');
  } catch (err) {
    error.value = err.response?.data?.message || 'Error de conexión. Intente más tarde.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 2rem 0;
}
.auth-card {
  max-width: 450px;
  width: 100%;
  padding: 2.5rem;
}
.alert-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #dc2626;
  margin-bottom: 1.5rem;
  text-align: center;
}
</style>
