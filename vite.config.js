import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      react(),
      createHtmlPlugin({
        inject: {
          data: {
            NOMBRE_NEGOCIO: env.VITE_NOMBRE_NEGOCIO || 'Full Party Uruapan',
            SITE_URL: env.VITE_SITE_URL || 'https://full-party-store.vercel.app',
          },
        },
      }),
    ],
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:   ['react', 'react-dom'],
            icons:    ['lucide-react'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  };
});
