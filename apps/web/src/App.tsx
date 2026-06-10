import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { PageLoader } from '@onim/ui'
import { AuthProvider } from '@onim/auth'
import { DataProvider } from '@onim/data'
import { AppRouter } from './router'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Suspense fallback={<PageLoader />}>
              <AppRouter />
            </Suspense>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
