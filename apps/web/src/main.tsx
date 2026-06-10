import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { configureSupabase } from '@onim/supabase'
import '@onim/ui/theme.css'
import './index.css'
import './styles/module-pages.css'
import App from './App'

configureSupabase(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
