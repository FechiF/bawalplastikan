import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev`   -> normal dev server using index.html (a fake "WordPress page")
// `npm run build` -> one self-contained script + stylesheet for embedding:
//                    dist/bawal-plastikan.js, dist/bawal-plastikan.css, dist/data/*
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  // Escape non-ASCII (·, →, ←) so the script renders correctly even if a server
  // sends it without a charset header.
  esbuild: { charset: 'ascii' },
  build: {
    outDir: 'dist',
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.jsx',
      name: 'BawalPlastikan',
      formats: ['iife'],
      fileName: () => 'bawal-plastikan.js',
      cssFileName: 'bawal-plastikan',
    },
  },
});
