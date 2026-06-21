import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Proxy target so dev requests stay same-origin (no CORS).
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // /api covers both /api/graphql and /api/employees/export.
      proxy: {
        '/api': { target, changeOrigin: true },
      },
    },
  }
})
