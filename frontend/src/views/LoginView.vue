<template>
  <div class="auth-container animate-fade-in">
    <div class="glass-card auth-card">
      <h2 class="text-center" style="color:var(--primary-color); margin-bottom: 0.5rem">Inicia Sesión</h2>
      <p class="text-center text-muted mb-4">Accede a tu cuenta para radicar o consultar peticiones y trámites.</p>
      
      <form @submit.prevent="handleLogin">
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        
        <div class="form-group mb-4">
          <label class="form-label">Número de Documento</label>
          <input type="text" v-model="form.numeroDocumento" class="form-control" placeholder="Escribe tu documento" required>
        </div>

        <div class="form-group mb-4">
          <label class="form-label">Contraseña</label>
          <input type="password" v-model="form.password" class="form-control" placeholder="Ingresa tu clave secreta" required>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem; font-size:1.1rem" :disabled="loading">
          {{ loading ? 'Autenticando...' : 'Entrar al Sistema' }}
        </button>
      </form>

      <div class="auth-footer mt-4 text-center">
        <p>¿No tienes cuenta? <router-link to="/register" style="color:var(--secondary-color); font-weight:600">Regístrate aquí</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = ref({ numeroDocumento: '', password: '' });
const loading = ref(false);
const error = ref(null);

const handleLogin = async () => {
  error.value = null;
  loading.value = true;
  
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await axios.post(`${backendUrl}/api/auth/login`, form.value);
    
    // Store token and user
    localStorage.setItem('auth_token', res.data.token);
    localStorage.setItem('auth_user', JSON.stringify(res.data.user));
    
    // Redirect logic based on role
    const rol = res.data.user.rol;
    if (rol === 'ADMIN' || rol === 'AGENTE' || rol === 'SUPERADMIN') {
      window.location.href = '/panel';
    } else {
      window.location.href = '/'; 
    }
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
}
.auth-card {
  max-width: 400px;
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
