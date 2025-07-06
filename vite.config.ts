import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/noteapp/', // <-- this is the fix (use your actual repo name here)
    define: {
      'process.env.API_KEY': JSON.stringify("AIzaSyBLg2rsiggYYZ1A1BLCRneHlRdkI8iWPkY"),
      'process.env.GEMINI_API_KEY': JSON.stringify("AIzaSyBLg2rsiggYYZ1A1BLCRneHlRdkI8iWPkY")
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
