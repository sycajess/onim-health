import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@onim/types': path.resolve(__dirname, '../../packages/types/src'),
      '@onim/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@onim/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@onim/supabase': path.resolve(__dirname, '../../packages/supabase/src'),
      '@onim/data': path.resolve(__dirname, '../../packages/data/src'),
    },
  },
})
