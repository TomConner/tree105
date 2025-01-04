import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  return {
    plugins: [react()],
    build: {
        outDir: '../public/app'
    },
    base: '/app',
    server: {
      host: env.VITE_HOST,
      port: parseInt(env.VITE_PORT || '3000'),
      proxy: {
        '/api': {
          target: 'http://localhost:5000', //env.VITE_TARGET,
          changeOrigin: true
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
})
