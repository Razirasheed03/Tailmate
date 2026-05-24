import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { RealtimeProvider } from './context/RealtimeContext.tsx'
import App from './App.tsx'
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
     <AuthProvider>
      <RealtimeProvider>
      <ErrorBoundary>
      <App />
      </ErrorBoundary>
      </RealtimeProvider>
    </AuthProvider>
  </StrictMode>,
)
