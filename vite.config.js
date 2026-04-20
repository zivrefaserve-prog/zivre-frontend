import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie)
            }
            proxyReq.setHeader('Origin', 'http://localhost:3000')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Forward Set-Cookie headers back to client
            const setCookie = proxyRes.headers['set-cookie']
            if (setCookie) {
              res.setHeader('set-cookie', setCookie)
            }
            // Add CORS headers
            proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
            proxyRes.headers['Access-Control-Allow-Credentials'] = 'true'
          })
        }
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie)
            }
          })
        }
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})