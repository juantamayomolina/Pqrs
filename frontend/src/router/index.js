import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import axios from 'axios';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/radicar',
    name: 'Radicar',
    component: () => import('../views/CreatePqrsView.vue')
  },
  {
    path: '/consultar',
    name: 'Consultar',
    component: () => import('../views/TrackPqrsView.vue')
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('../views/SetupView.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/panel',
    name: 'Panel',
    component: () => import('../views/PanelView.vue'),
    meta: { requiresAuth: true, internalRoles: ['ADMIN', 'AGENTE', 'SUPERADMIN', 'GESTOR'] }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

let isSetupChecked = false;
let isConfigured = true;

router.beforeEach(async (to, from, next) => {
  // Config Guard
  if (!isSetupChecked) {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/setup/status`);
      isConfigured = response.data.isConfigured;
    } catch (error) {
      console.error('Error fetching setup status:', error);
      isConfigured = true; 
    } finally {
      isSetupChecked = true;
    }
  }

  if (!isConfigured && to.name !== 'Setup') {
    return next({ name: 'Setup' });
  } else if (isConfigured && to.name === 'Setup') {
    return next({ name: 'Home' });
  }

  // Auth Guard
  const token = localStorage.getItem('auth_token');
  const userStr = localStorage.getItem('auth_user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch(e){}
  }

  if (to.meta.requiresAuth) {
    if (!token || !user) {
      return next({ name: 'Login' });
    }
    if (to.meta.internalRoles && !to.meta.internalRoles.includes(user.rol)) {
      return next({ name: 'Home' });
    }
  }

  next();
});

export default router;
