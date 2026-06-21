import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Backend the dev server proxies to. Avoids CORS in development, since the
  // browser only ever talks to the Vite origin (same-origin /graphql + /api).
  const target = env.VITE_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/graphql': { target, changeOrigin: true },
        '/api': { target, changeOrigin: true },
      },
    },
  }
})
