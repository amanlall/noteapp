import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Loads environment variables based on mode (e.g., production, development)
  const env = loadEnv(mode, '.', '');

  return {
    base: '/noteapp/', // Replace with your actual repo name if different

    // No need to manually inject env vars via define.
    // Vite automatically exposes variables prefixed with VITE_ via import.meta.env

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
