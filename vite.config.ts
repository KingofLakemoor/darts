import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('motion')) return 'motion';
            if (id.includes('@google/genai')) return 'genai';
            if (id.includes('lucide-react')) return 'lucide';
            if (id.includes('react-dom') || id.includes('react/')) return 'react';
            return 'vendor';
          }
        }
      }
    }
  }
});
