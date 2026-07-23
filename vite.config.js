import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

function publicRouteAssetsManifest() {
  return {
    name: 'public-route-assets-manifest',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        if (!context.bundle) return [];

        const publicRouteChunk = Object.values(context.bundle).find((entry) => (
          entry.type === 'chunk'
          && Object.keys(entry.modules).some((moduleId) => (
            moduleId.replace(/\\/g, '/').endsWith('/src/routes/PublicCatalogRoute.jsx')
          ))
        ));
        if (!publicRouteChunk) return [];

        const preloadResources = [
          { rel: 'modulepreload', href: `/${publicRouteChunk.fileName}` },
          ...[...(publicRouteChunk.viteMetadata?.importedCss || [])]
            .map((href) => ({ rel: 'preload', as: 'style', href: `/${href}` })),
        ];

        return [{
          tag: 'script',
          attrs: { 'data-fp-catalog-preload': '' },
          children: `(function(){if(!location.pathname.startsWith('/catalogo'))return;var r=${JSON.stringify(preloadResources)};for(var i=0;i<r.length;i++){var l=document.createElement('link');for(var k in r[i])l.setAttribute(k,r[i][k]);if(r[i].rel==='modulepreload')l.crossOrigin='anonymous';document.head.appendChild(l);}})();`,
          injectTo: 'head-prepend',
        }];
      },
    },
    generateBundle(_options, bundle) {
      const chunks = Object.values(bundle).filter((entry) => entry.type === 'chunk');
      const chunksByFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
      const publicRouteChunk = chunks.find((chunk) => (
        Object.keys(chunk.modules).some((moduleId) => (
          moduleId.replace(/\\/g, '/').endsWith('/src/routes/PublicCatalogRoute.jsx')
        ))
      ));

      if (!publicRouteChunk) {
        this.error('No se encontró el chunk de PublicCatalogRoute para el manifiesto offline.');
      }

      const desktopFiltersChunk = chunks.find((chunk) => (
        Object.keys(chunk.modules).some((moduleId) => (
          moduleId.replace(/\\/g, '/').endsWith('/src/components/SidebarFiltrosDesktop.jsx')
        ))
      ));
      const pending = [publicRouteChunk, desktopFiltersChunk]
        .filter(Boolean)
        .map((chunk) => chunk.fileName);
      const visited = new Set();
      const assets = new Set();

      while (pending.length > 0) {
        const fileName = pending.pop();
        if (visited.has(fileName)) continue;
        visited.add(fileName);

        const chunk = chunksByFile.get(fileName);
        if (!chunk) continue;

        const moduleIds = Object.keys(chunk.modules);
        const isCssOnlyChunk = moduleIds.length > 0 && moduleIds.every((moduleId) => (
          /\.(?:css|pcss|postcss|scss|sass|less|styl|stylus)(?:\?|$)/i.test(moduleId)
        ));
        if (!isCssOnlyChunk) assets.add(`/${chunk.fileName}`);
        chunk.imports.forEach((dependency) => pending.push(dependency));
        chunk.viteMetadata?.importedCss?.forEach((asset) => assets.add(`/${asset}`));
        chunk.viteMetadata?.importedAssets?.forEach((asset) => assets.add(`/${asset}`));
      }

      this.emitFile({
        type: 'asset',
        fileName: 'public-route-assets.json',
        source: JSON.stringify({ assets: [...assets].sort() }),
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = env.VITE_SITE_URL || 'https://www.fullpartyuruapan.com.mx';
  const nombreNegocio = env.VITE_NOMBRE_NEGOCIO || 'Full Party Uruapan';
  let supabaseOrigin = '';

  try {
    if (env.VITE_SUPABASE_URL) {
      supabaseOrigin = new URL(env.VITE_SUPABASE_URL).origin;
    }
  } catch {
    supabaseOrigin = '';
  }

  return {
    plugins: [
      react(),
      publicRouteAssetsManifest(),
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
            SUPABASE_ORIGIN:   supabaseOrigin,
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
            vendor:   ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js'],
            recharts: ['recharts'],
          },
        },
      },
    },
  };
});
