import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['__tests__/utils/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.ts',
        '*.config.js',
        'src/components/ui/', // shadcn components
        '.next/',
        'coverage/',
        'src/app/layout.tsx', // Next.js layout
        'src/app/page.tsx', // Main page (UI-only)
        'src/components/Hero.tsx', // UI-only component
        'src/components/Onboarding.tsx', // UI-only component
        'src/components/DashboardCharts.tsx', // UI-only component
        'src/components/DemandIndicator.tsx', // UI-only component
        'src/components/CompetitorCard.tsx', // UI-only component
        'next-env.d.ts', // TypeScript definitions
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
