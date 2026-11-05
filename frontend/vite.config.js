import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const DJANGO_URL = process.env.DJANGO_URL || 'http://127.0.0.1:8000';

// The Django API is proxied so the session + CSRF cookies stay same-origin.
// changeOrigin stays false: Django's CSRF check compares the browser's Origin
// header with the Host header, so the original Host must be forwarded.
const toDjango = { target: DJANGO_URL, changeOrigin: false };

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': toDjango,
      // Trailing slash so the React /admin-panel route is not sent to Django.
      '/admin/': toDjango,
      '/static': toDjango,
      '/media': toDjango,
      '/reset': toDjango, // password reset link from the email
    },
  },
});
