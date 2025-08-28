/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { mergeConfig } from 'vite'
import { defineConfig as defineTestConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default mergeConfig(
  defineConfig({
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Material-UI is large (277KB → 87KB gzipped)
            mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            // Animation libraries (111KB → 36KB gzipped)
            animations: ['framer-motion'],
            // React Query (26KB → 8KB gzipped)
            'react-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
            // AI/utility libraries
            utils: ['@google/generative-ai', 'nanoid'],
          }
        }
      },
      // Increase chunk size warning limit to 800kb (more reasonable for modern apps)
      chunkSizeWarningLimit: 800,
    }
  }),
  defineTestConfig({
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
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
    }
  })
)
