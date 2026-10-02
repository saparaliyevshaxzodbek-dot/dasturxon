import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The dev server forwards API, SignalR and uploaded images to the ASP.NET Core backend,
// so the browser only ever talks to one origin and no CORS setup is needed.
const backend = process.env.API_URL ?? 'http://localhost:5011';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': backend,
      '/uploads': backend,
      '/hubs': { target: backend, ws: true },
    },
  },
});
