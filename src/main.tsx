import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Upright weights 200-800 only; the site uses no italics.
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css'
import './index.css'
import App from './App.tsx'

// The installable app's offline support (see pwa/sw.js). Built sites only, so development never
// serves stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
