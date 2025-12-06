import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // This rule handles your regular API requests
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // This NEW rule specifically handles WebSocket connections
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      }
    }
  }
})