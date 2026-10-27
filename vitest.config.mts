import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors the `@/*` path alias from tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // The root layout only sets metadata and global CSS; no test renders it.
      exclude: ['src/**/*.test.{ts,tsx}', 'src/app/layout.tsx', 'src/**/*.d.ts'],
      reporter: ['text', 'html'],
    },
  },
});
