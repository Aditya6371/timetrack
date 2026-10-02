import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative asset paths work both on localhost and at
// https://<user>.github.io/timetrack/ without a hardcoded base.
export default defineConfig({
  plugins: [react()],
  base: './',
});
