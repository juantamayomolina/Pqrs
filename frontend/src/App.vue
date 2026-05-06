<template>
  <div id="layout-wrapper">
    <header class="app-header">
      <div class="container flex justify-between align-center">
        <h2 class="logo"><router-link to="/">Gestión PQRS</router-link></h2>
        <nav class="main-nav">
          <router-link to="/" class="nav-link active-link">Inicio</router-link>
          <router-link v-if="!isLoggedIn" to="/login" class="nav-link active-link">Acceder al Panel</router-link>
          <router-link v-else to="/panel" class="nav-link active-link" style="color:var(--primary-color); font-weight:600">Mi Panel Interno</router-link>
          <router-link to="/radicar" class="nav-link btn btn-secondary" style="color:white">Radicar PQRS</router-link>
        </nav>
      </div>
    </header>

    <main class="app-main container animate-fade-in">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <div class="container text-center text-muted">
        <p>&copy; 2026 Plataforma para la gestión de PQRS.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const isLoggedIn = ref(false);

const checkLoginStatus = () => {
  isLoggedIn.value = !!localStorage.getItem('auth_token');
};

onMounted(() => {
  checkLoginStatus();

  // Escuchar globalmente si el backend devuelve error de token (401 o 403 de capa de validación)
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && (error.response.status === 401)) {
        // Removemos credenciales para limpiar UI, pero SIN ejecutar router.push('/')
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        checkLoginStatus();
        console.warn('Sesión expirada interceptada por App.vue. No se forzó ruteo.');
      }
      return Promise.reject(error);
    }
  );
});

watch(
  () => route.path,
  () => {
    checkLoginStatus();
  }
);
</script>

<style scoped>
#layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
  padding: 1.25rem 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo a {
  text-decoration: none;
  color: var(--primary-dark);
  font-size: 1.6rem;
  margin: 0;
  transition: opacity 0.2s;
}

.logo a:hover {
  opacity: 0.8;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  font-weight: 500;
  color: var(--text-main);
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--primary-color);
}

.app-main {
  flex: 1;
  padding: 3.5rem 1.5rem;
}

.app-footer {
  padding: 2.5rem 0;
  background-color: white;
  border-top: 1px solid var(--border-color);
  font-size: 0.95rem;
}

/* Page Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}
</style>
