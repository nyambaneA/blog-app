import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSSG } from 'vite-plugin-ssg-spa';

export default defineConfig({
  plugins: [
    react(),
    viteSSG({
      siteUrl: 'https://www.lecturerroom.online',
      autoCrawl: true,
      excludePatterns: ['/admin', '/login', '/auth'],
      generatePlatformConfig: true,
    }),
  ],
});