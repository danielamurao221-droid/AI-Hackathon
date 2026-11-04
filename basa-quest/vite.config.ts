import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    target: 'es2019',
    // Phaser (about 350 KB gzipped) is split into its own chunk and only loads for the student game.
    chunkSizeWarningLimit: 1500,
    // The one-file preview (npm run build:preview, mode "single") needs everything in one script.
    rollupOptions: mode === 'single' ? { output: { inlineDynamicImports: true } } : {},
  },
}));
