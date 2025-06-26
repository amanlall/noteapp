import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/noteapp/', // <-- this is the fix (use your actual repo name here)
    define: {
      'process.env.API_KEY': JSON.stringify(import.meta.env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(import.meta.env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
