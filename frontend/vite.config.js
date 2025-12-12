import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Needed for docker
        port: 5173,
        proxy: {
            '/api': {
                target: process.env.VITE_API_URL || 'http://virtualtours_backend:4000',
                changeOrigin: true,
                secure: false,
            },
            '/tours': {
                target: process.env.VITE_API_URL || 'http://virtualtours_backend:4000',
                changeOrigin: true
            },
            '/covers': {
                target: process.env.VITE_API_URL || 'http://virtualtours_backend:4000',
                changeOrigin: true
            }
        }
    }
})
