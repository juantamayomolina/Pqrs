import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Si la variable no viene de Docker, usamos 'true' por defecto para no romper el flujo
  const allowed = env.VITE_ALLOWED_HOSTS ? [env.VITE_ALLOWED_HOSTS] : true

  return {
    plugins: [vue()],

    server: {
      port: 5173,
      host: true,
      strictPort: true,
      allowedHosts: allowed // Protege el modo dev
    },

    preview: {
      port: 4173,         // Puerto por defecto de Vite para producción estática
      host: true,         // PERMITE que Docker exponga este puerto externamente
      strictPort: true,
      allowedHosts: allowed // Protege el modo producción/preview
    }
  }
})