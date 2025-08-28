/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 30000, // 30 seconds timeout for CI
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 70,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Material-UI into its own chunk (large dependency)
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Split animation library into its own chunk
          animations: ['framer-motion'],
          // Split React Query into its own chunk
          query: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          // Split AI/utility libraries
          utils: ['@google/generative-ai', 'nanoid'],
        },
      },
    },
    // Increase chunk size warning limit to 800kb (more reasonable for modern apps)
    chunkSizeWarningLimit: 800,
  },
})
