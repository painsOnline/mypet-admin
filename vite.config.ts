import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8081'

  return {
    publicDir: 'static',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    css: {
      preprocessorOptions: {
        scss: {}
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/admin': {
          target: apiTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: apiTarget,
          changeOrigin: true
        }
      }
    }
  }
})
