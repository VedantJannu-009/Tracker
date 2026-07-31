import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { initializeDatabase } from './db/seed'
import './stores/themeStore'
import { useLaunchStore } from './stores/launchStore'

initializeDatabase()
  .then(() => useLaunchStore.getState().setReady())
  .catch((err) => {
    console.error('Failed to initialize database', err)
    useLaunchStore.getState().setReady()
  })

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
