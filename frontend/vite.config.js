import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'react-refresh-runtime-export-fix',
      enforce: 'post',
      transform(code, id) {
        if (id.includes('@react-refresh')) {
          let updated = code;
          if (!updated.includes('export function register') && updated.includes('function register(type, id)')) {
            updated = updated.replace('function register(type, id)', 'export function register(type, id)');
          }
          if (!updated.includes('register:') && updated.includes('export default { injectIntoGlobalHook }')) {
            updated = updated.replace(
              'export default { injectIntoGlobalHook }',
              'export default { injectIntoGlobalHook, register }'
            );
          }
          return updated;
        }
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy Error]:', err.message);
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                message: 'Backend server is temporarily unreachable on port 5000. Please ensure node server.js is running.'
              }));
            }
          });
        }
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
