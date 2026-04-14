import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = env.VITE_SITE_URL || 'https://www.fullpartyuruapan.com.mx';
  const nombreNegocio = env.VITE_NOMBRE_NEGOCIO || 'Full Party Uruapan';

  return {
    plugins: [
      react(),
      createHtmlPlugin({
        inject: {
          data: {
            NOMBRE_NEGOCIO:    nombreNegocio,
            SITE_URL:          siteUrl,
            WHATSAPP_NUMBER:   env.VITE_WHATSAPP_NUMBER   || '521XXXXXXXXXX',
            HORARIO_TIENDA:    env.VITE_HORARIO_TIENDA    || 'Lun-Sab 9:00-19:00',
            SUC1_NOMBRE:       env.VITE_SUC1_NOMBRE       || 'Sucursal Francisco Villa',
            SUC1_DIRECCION:    env.VITE_SUC1_DIRECCION    || 'Uruapan, Michoacan, Mexico',
            SUC1_MAPS_URL:     env.VITE_SUC1_MAPS_URL     || siteUrl,
            SUC1_FACEBOOK:     env.VITE_SUC1_FACEBOOK     || siteUrl,
            SUC2_NOMBRE:       env.VITE_SUC2_NOMBRE       || 'Sucursal Sol Naciente',
            SUC2_DIRECCION:    env.VITE_SUC2_DIRECCION    || 'Uruapan, Michoacan, Mexico',
            SUC2_MAPS_URL:     env.VITE_SUC2_MAPS_URL     || siteUrl,
            SUC2_FACEBOOK:     env.VITE_SUC2_FACEBOOK     || siteUrl,
            TIKTOK_URL:        env.VITE_TIKTOK_URL        || siteUrl,
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
