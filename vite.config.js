import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative asset paths support GitHub Pages project sites and Capacitor builds.
export default defineConfig({
  base: './',
  plugins: [react()],
});
