import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project URLs are case-sensitive: repository is named RoamWise.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/RoamWise/' : '/',
}));
